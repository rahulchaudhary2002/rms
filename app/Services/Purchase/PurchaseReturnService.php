<?php

namespace App\Services\Purchase;

use App\Exceptions\InsufficientStockException;
use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseReceive;
use App\Models\PurchaseReturn;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\IngredientInventoryService;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PurchaseReturnService
{
    use PaginatesQuery;

    public function __construct(private IngredientInventoryService $inventoryService) {}

    public function getIndexData(array $filters): array
    {
        $query = PurchaseReturn::with(['supplier', 'warehouse', 'purchaseReceive', 'purchaseInvoice'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%' . $filters['search'] . '%';
                $b->where('return_no', 'like', $search);
            })
            ->when($filters['supplier_id'] !== '', fn ($b) => $b->where('supplier_id', $filters['supplier_id']))
            ->when($filters['warehouse_id'] !== '', fn ($b) => $b->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->orderByDesc('return_date')
            ->orderByDesc('id');

        $returns    = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $suppliers  = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('returns', 'suppliers', 'warehouses', 'filters');
    }

    public function getCreateData(): array
    {
        $suppliers       = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses      = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients     = Ingredient::with('baseUnit')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'base_unit_id']);
        $units           = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']);
        $batches         = IngredientBatch::where('is_closed', false)
            ->where('available_quantity', '>', 0)
            ->orderBy('batch_no')
            ->get(['id', 'batch_no', 'ingredient_id']);
        $purchaseReceives = PurchaseReceive::where('status', 'posted')->orderByDesc('received_date')->get(['id', 'receive_no', 'supplier_id', 'warehouse_id']);
        $purchaseInvoices = PurchaseInvoice::whereIn('status', ['unpaid', 'partially_paid', 'paid'])->orderByDesc('invoice_date')->get(['id', 'invoice_no', 'supplier_id']);

        return compact('suppliers', 'warehouses', 'ingredients', 'units', 'batches', 'purchaseReceives', 'purchaseInvoices');
    }

    public function getEditData(PurchaseReturn $return): array
    {
        $return->load(['items.ingredient.baseUnit', 'items.unit', 'items.batch', 'supplier', 'warehouse', 'purchaseReceive', 'purchaseInvoice']);
        $createData = $this->getCreateData();

        return array_merge($createData, compact('return'));
    }

    public function getShowData(PurchaseReturn $return): array
    {
        $return->load([
            'items.ingredient.baseUnit',
            'items.unit',
            'items.batch',
            'supplier',
            'warehouse',
            'purchaseReceive',
            'purchaseInvoice',
            'createdBy',
            'postedBy',
        ]);

        return compact('return');
    }

    public function createReturn(array $data, int $userId): PurchaseReturn
    {
        return DB::transaction(function () use ($data, $userId) {
            $return = PurchaseReturn::create([
                'supplier_id'         => $data['supplier_id'],
                'warehouse_id'        => $data['warehouse_id'],
                'purchase_receive_id' => $data['purchase_receive_id'] ?? null,
                'purchase_invoice_id' => $data['purchase_invoice_id'] ?? null,
                'return_no'           => $this->generateReturnNo(),
                'return_date'         => $data['return_date'],
                'status'              => 'draft',
                'reason'              => $data['reason'] ?? null,
                'created_by'          => $userId,
                'subtotal'            => 0,
                'tax_amount'          => 0,
                'grand_total'         => 0,
            ]);

            $this->syncItems($return, $data['items'] ?? []);
            $this->recalculateTotals($return, $data);

            return $return;
        });
    }

    public function updateReturn(PurchaseReturn $return, array $data): void
    {
        DB::transaction(function () use ($return, $data) {
            $return->update([
                'supplier_id'         => $data['supplier_id'],
                'warehouse_id'        => $data['warehouse_id'],
                'purchase_receive_id' => $data['purchase_receive_id'] ?? null,
                'purchase_invoice_id' => $data['purchase_invoice_id'] ?? null,
                'return_date'         => $data['return_date'],
                'reason'              => $data['reason'] ?? null,
            ]);

            $this->syncItems($return, $data['items'] ?? []);
            $this->recalculateTotals($return, $data);
        });
    }

    public function deleteReturn(PurchaseReturn $return): void
    {
        $return->delete();
    }

    public function post(PurchaseReturn $return, int $userId): void
    {
        if ($return->status !== 'draft') {
            throw new RuntimeException('Only draft returns can be posted.');
        }

        DB::transaction(function () use ($return, $userId) {
            $return->load(['items.ingredient', 'warehouse']);
            $warehouse = $return->warehouse;

            foreach ($return->items as $item) {
                $ingredient = $item->ingredient;
                $quantity   = (float) $item->quantity;

                if ($quantity <= 0) {
                    continue;
                }

                $this->inventoryService->decreaseStock($warehouse, $ingredient, [
                    'transaction_type' => 'purchase_return',
                    'quantity'         => $quantity,
                    'unit_cost'        => (float) $item->unit_price,
                    'batch_id'         => $item->ingredient_batch_id,
                    'reference_type'   => PurchaseReturn::class,
                    'reference_id'     => $return->id,
                    'remarks'          => "Purchase Return: {$return->return_no}",
                    'created_by'       => $userId,
                ]);
            }

            // Adjust invoice due amount if linked
            if ($return->purchase_invoice_id) {
                $invoice = $return->purchaseInvoice;
                if ($invoice) {
                    $newDue = max(0, (float) $invoice->due_amount - (float) $return->grand_total);
                    $invoice->update(['due_amount' => $newDue]);
                    app(PurchaseInvoiceService::class)->resolveStatus($invoice);
                }
            }

            $return->update([
                'status'    => 'posted',
                'posted_by' => $userId,
                'posted_at' => now(),
            ]);
        });
    }

    public function cancel(PurchaseReturn $return): void
    {
        if ($return->status !== 'draft') {
            throw new RuntimeException('Only draft returns can be cancelled.');
        }

        $return->update(['status' => 'cancelled']);
    }

    private function syncItems(PurchaseReturn $return, array $items): void
    {
        $return->items()->delete();

        foreach ($items as $item) {
            $lineTotal = (float) $item['quantity'] * (float) ($item['unit_price'] ?? 0);

            $return->items()->create([
                'ingredient_id'       => $item['ingredient_id'],
                'ingredient_batch_id' => $item['ingredient_batch_id'] ?? null,
                'unit_id'             => $item['unit_id'],
                'quantity'            => $item['quantity'],
                'unit_price'          => $item['unit_price'] ?? 0,
                'line_total'          => $lineTotal,
                'reason'              => $item['reason'] ?? null,
            ]);
        }
    }

    private function recalculateTotals(PurchaseReturn $return, array $data): void
    {
        $return->refresh();
        $subtotal   = $return->items->sum('line_total');
        $taxAmount  = (float) ($data['tax_amount'] ?? 0);
        $grandTotal = $subtotal + $taxAmount;

        $return->update([
            'subtotal'    => $subtotal,
            'tax_amount'  => $taxAmount,
            'grand_total' => max(0, $grandTotal),
        ]);
    }

    private function generateReturnNo(): string
    {
        $last = PurchaseReturn::withTrashed()->orderByDesc('id')->value('return_no');
        $seq  = $last ? ((int) substr($last, -6)) + 1 : 1;

        return 'RTN-' . date('Ymd') . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);
    }
}
