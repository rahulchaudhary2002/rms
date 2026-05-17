<?php

namespace App\Services\Purchase;

use App\Models\Ingredient;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceive;
use App\Models\Supplier;
use App\Models\Unit;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class PurchaseInvoiceService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = PurchaseInvoice::with(['supplier', 'purchaseOrder', 'purchaseReceive', 'createdBy'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%' . $filters['search'] . '%';
                $b->where(fn ($q) => $q
                    ->where('invoice_no', 'like', $search)
                    ->orWhere('supplier_invoice_no', 'like', $search)
                );
            })
            ->when($filters['supplier_id'] !== '', fn ($b) => $b->where('supplier_id', $filters['supplier_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->orderByDesc('invoice_date')
            ->orderByDesc('id');

        $invoices  = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('invoices', 'suppliers', 'filters');
    }

    public function getCreateData(): array
    {
        $suppliers      = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients    = Ingredient::with('baseUnit')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'base_unit_id']);
        $units          = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']);
        $purchaseOrders = PurchaseOrder::orderByDesc('order_date')->get(['id', 'purchase_order_no', 'supplier_id']);
        $purchaseReceives = PurchaseReceive::where('status', 'posted')->orderByDesc('received_date')->get(['id', 'receive_no', 'supplier_id']);

        return compact('suppliers', 'ingredients', 'units', 'purchaseOrders', 'purchaseReceives');
    }

    public function getEditData(PurchaseInvoice $invoice): array
    {
        $invoice->load(['items.ingredient.baseUnit', 'items.unit', 'supplier', 'purchaseOrder', 'purchaseReceive']);
        $createData = $this->getCreateData();

        return array_merge($createData, compact('invoice'));
    }

    public function getShowData(PurchaseInvoice $invoice): array
    {
        $invoice->load([
            'items.ingredient.baseUnit',
            'items.unit',
            'supplier',
            'purchaseOrder',
            'purchaseReceive',
            'createdBy',
            'paymentAllocations.payment',
        ]);

        return compact('invoice');
    }

    public function createInvoice(array $data, int $userId): PurchaseInvoice
    {
        return DB::transaction(function () use ($data, $userId) {
            $invoice = PurchaseInvoice::create([
                'supplier_id'        => $data['supplier_id'],
                'purchase_order_id'  => $data['purchase_order_id'] ?? null,
                'purchase_receive_id' => $data['purchase_receive_id'] ?? null,
                'invoice_no'         => $this->generateInvoiceNo(),
                'supplier_invoice_no' => $data['supplier_invoice_no'] ?? null,
                'invoice_date'       => $data['invoice_date'],
                'due_date'           => $data['due_date'] ?? null,
                'status'             => 'draft',
                'notes'              => $data['notes'] ?? null,
                'created_by'         => $userId,
                'subtotal'           => 0,
                'discount_amount'    => 0,
                'tax_amount'         => 0,
                'shipping_amount'    => 0,
                'grand_total'        => 0,
                'paid_amount'        => 0,
                'due_amount'         => 0,
            ]);

            $this->syncItems($invoice, $data['items'] ?? []);
            $this->recalculateTotals($invoice, $data);

            // Move to unpaid once saved
            if ($invoice->grand_total > 0) {
                $invoice->update(['status' => 'unpaid']);
            }

            return $invoice;
        });
    }

    public function updateInvoice(PurchaseInvoice $invoice, array $data): void
    {
        DB::transaction(function () use ($invoice, $data) {
            $invoice->update([
                'supplier_id'         => $data['supplier_id'],
                'purchase_order_id'   => $data['purchase_order_id'] ?? null,
                'purchase_receive_id' => $data['purchase_receive_id'] ?? null,
                'supplier_invoice_no' => $data['supplier_invoice_no'] ?? null,
                'invoice_date'        => $data['invoice_date'],
                'due_date'            => $data['due_date'] ?? null,
                'notes'               => $data['notes'] ?? null,
            ]);

            $this->syncItems($invoice, $data['items'] ?? []);
            $this->recalculateTotals($invoice, $data);
            $this->resolveStatus($invoice);
        });
    }

    public function deleteInvoice(PurchaseInvoice $invoice): void
    {
        $invoice->delete();
    }

    public function cancel(PurchaseInvoice $invoice): void
    {
        $invoice->update(['status' => 'cancelled']);
    }

    public function resolveStatus(PurchaseInvoice $invoice): void
    {
        $invoice->refresh();
        $paid    = (float) $invoice->paid_amount;
        $total   = (float) $invoice->grand_total;

        $status = 'unpaid';
        if ($paid >= $total && $total > 0) {
            $status = 'paid';
        } elseif ($paid > 0) {
            $status = 'partially_paid';
        }

        $invoice->update(['status' => $status, 'due_amount' => max(0, $total - $paid)]);
    }

    private function syncItems(PurchaseInvoice $invoice, array $items): void
    {
        $invoice->items()->delete();

        foreach ($items as $item) {
            $lineTotal = (float) $item['quantity'] * (float) $item['unit_price']
                - (float) ($item['discount_amount'] ?? 0)
                + (float) ($item['tax_amount'] ?? 0);

            $invoice->items()->create([
                'ingredient_id'   => $item['ingredient_id'],
                'unit_id'         => $item['unit_id'],
                'quantity'        => $item['quantity'],
                'unit_price'      => $item['unit_price'],
                'discount_amount' => $item['discount_amount'] ?? 0,
                'tax_amount'      => $item['tax_amount'] ?? 0,
                'line_total'      => $lineTotal,
            ]);
        }
    }

    private function recalculateTotals(PurchaseInvoice $invoice, array $data): void
    {
        $invoice->refresh();
        $subtotal       = $invoice->items->sum('line_total');
        $discountAmount = (float) ($data['discount_amount'] ?? 0);
        $taxAmount      = (float) ($data['tax_amount'] ?? 0);
        $shippingAmount = (float) ($data['shipping_amount'] ?? 0);
        $grandTotal     = $subtotal - $discountAmount + $taxAmount + $shippingAmount;
        $dueAmount      = max(0, $grandTotal - (float) $invoice->paid_amount);

        $invoice->update([
            'subtotal'        => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount'      => $taxAmount,
            'shipping_amount' => $shippingAmount,
            'grand_total'     => max(0, $grandTotal),
            'due_amount'      => $dueAmount,
        ]);
    }

    private function generateInvoiceNo(): string
    {
        $last = PurchaseInvoice::withTrashed()->orderByDesc('id')->value('invoice_no');
        $seq  = $last ? ((int) substr($last, -6)) + 1 : 1;

        return 'INV-' . date('Ymd') . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);
    }
}
