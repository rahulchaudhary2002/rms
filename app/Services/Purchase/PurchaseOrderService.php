<?php

namespace App\Services\Purchase;

use App\Models\Ingredient;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class PurchaseOrderService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = PurchaseOrder::with(['supplier', 'warehouse', 'createdBy'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%' . $filters['search'] . '%';
                $b->where('purchase_order_no', 'like', $search);
            })
            ->when($filters['supplier_id'] !== '', fn ($b) => $b->where('supplier_id', $filters['supplier_id']))
            ->when($filters['warehouse_id'] !== '', fn ($b) => $b->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->orderByDesc('order_date')
            ->orderByDesc('id');

        $orders    = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('orders', 'suppliers', 'warehouses', 'filters');
    }

    public function getCreateData(): array
    {
        $suppliers   = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'base_unit_id', 'default_purchase_unit_id']);
        $units       = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']);

        return compact('suppliers', 'warehouses', 'ingredients', 'units');
    }

    public function getEditData(PurchaseOrder $order): array
    {
        $order->load(['items.ingredient.baseUnit', 'items.unit', 'supplier', 'warehouse']);
        $createData  = $this->getCreateData();

        return array_merge($createData, compact('order'));
    }

    public function getShowData(PurchaseOrder $order): array
    {
        $order->load([
            'items.ingredient.baseUnit',
            'items.unit',
            'supplier',
            'warehouse',
            'createdBy',
            'approvedBy',
        ]);

        return compact('order');
    }

    public function createOrder(array $data, int $userId): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $userId) {
            $order = PurchaseOrder::create([
                'supplier_id'             => $data['supplier_id'],
                'warehouse_id'            => $data['warehouse_id'],
                'purchase_order_no'       => $this->generateOrderNo(),
                'order_date'              => $data['order_date'],
                'expected_delivery_date'  => $data['expected_delivery_date'] ?? null,
                'status'                  => $data['status'] ?? 'draft',
                'notes'                   => $data['notes'] ?? null,
                'created_by'              => $userId,
                'subtotal'                => 0,
                'discount_amount'         => 0,
                'tax_amount'              => 0,
                'shipping_amount'         => 0,
                'grand_total'             => 0,
            ]);

            $this->syncItems($order, $data['items'] ?? []);
            $this->recalculateTotals($order, $data);
            $this->syncInvoiceForOrder($order, $userId);

            return $order;
        });
    }

    public function updateOrder(PurchaseOrder $order, array $data): void
    {
        DB::transaction(function () use ($order, $data) {
            $order->update([
                'supplier_id'            => $data['supplier_id'],
                'warehouse_id'           => $data['warehouse_id'],
                'order_date'             => $data['order_date'],
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'status'                 => $data['status'] ?? $order->status,
                'notes'                  => $data['notes'] ?? null,
            ]);

            $this->syncItems($order, $data['items'] ?? []);
            $this->recalculateTotals($order, $data);
            $this->syncInvoiceForOrder($order, $order->created_by ?? 0);
        });
    }

    public function deleteOrder(PurchaseOrder $order): void
    {
        DB::transaction(function () use ($order) {
            $this->deleteUnpaidInvoiceForOrder($order);
            $order->delete();
        });
    }

    public function approve(PurchaseOrder $order, int $userId): void
    {
        DB::transaction(function () use ($order, $userId) {
            $order->update([
                'approved_by' => $userId,
                'approved_at' => now(),
                'status'      => 'ordered',
            ]);

            $this->syncInvoiceForOrder($order, $userId);
        });
    }

    public function cancel(PurchaseOrder $order): void
    {
        DB::transaction(function () use ($order) {
            $order->update(['status' => 'cancelled']);

            $invoice = $this->editableInvoiceForOrder($order);
            if ($invoice) {
                $invoice->update(['status' => 'cancelled']);
            }
        });
    }

    private function syncItems(PurchaseOrder $order, array $items): void
    {
        $order->items()->delete();

        foreach ($items as $item) {
            $lineTotal = (float) $item['quantity'] * (float) $item['unit_price']
                - (float) ($item['discount_amount'] ?? 0)
                + (float) ($item['tax_amount'] ?? 0);

            $order->items()->create([
                'ingredient_id'   => $item['ingredient_id'],
                'unit_id'         => $item['unit_id'],
                'quantity'        => $item['quantity'],
                'received_quantity' => 0,
                'unit_price'      => $item['unit_price'],
                'discount_amount' => $item['discount_amount'] ?? 0,
                'tax_amount'      => $item['tax_amount'] ?? 0,
                'line_total'      => $lineTotal,
                'notes'           => $item['notes'] ?? null,
            ]);
        }
    }

    private function recalculateTotals(PurchaseOrder $order, array $data): void
    {
        $order->refresh();
        $subtotal       = $order->items->sum('line_total');
        $discountAmount = (float) ($data['discount_amount'] ?? 0);
        $taxAmount      = (float) ($data['tax_amount'] ?? 0);
        $shippingAmount = (float) ($data['shipping_amount'] ?? 0);
        $grandTotal     = $subtotal - $discountAmount + $taxAmount + $shippingAmount;

        $order->update([
            'subtotal'        => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount'      => $taxAmount,
            'shipping_amount' => $shippingAmount,
            'grand_total'     => max(0, $grandTotal),
        ]);
    }

    private function syncInvoiceForOrder(PurchaseOrder $order, int $userId): void
    {
        $order->refresh();
        $order->load('items');

        $invoice = $this->openInvoiceForOrder($order);

        if ($invoice && (float) $invoice->paid_amount > 0) {
            return;
        }

        $paidAmount = $invoice ? (float) $invoice->paid_amount : 0;
        $grandTotal = (float) $order->grand_total;
        $status     = $grandTotal > 0 ? 'unpaid' : 'draft';

        if (! $invoice) {
            $invoice = PurchaseInvoice::create([
                'supplier_id'          => $order->supplier_id,
                'purchase_order_id'    => $order->id,
                'purchase_receive_id'  => null,
                'invoice_no'           => $this->generateInvoiceNo(),
                'supplier_invoice_no'  => null,
                'invoice_date'         => $order->order_date,
                'due_date'             => $order->expected_delivery_date,
                'status'               => $status,
                'notes'                => $order->notes,
                'created_by'           => $userId ?: null,
                'subtotal'             => $order->subtotal,
                'discount_amount'      => $order->discount_amount,
                'tax_amount'           => $order->tax_amount,
                'shipping_amount'      => $order->shipping_amount,
                'grand_total'          => $order->grand_total,
                'paid_amount'          => 0,
                'due_amount'           => $grandTotal,
            ]);
        } else {
            $invoice->update([
                'supplier_id'          => $order->supplier_id,
                'invoice_date'         => $order->order_date,
                'due_date'             => $order->expected_delivery_date,
                'status'               => $status,
                'notes'                => $order->notes,
                'subtotal'             => $order->subtotal,
                'discount_amount'      => $order->discount_amount,
                'tax_amount'           => $order->tax_amount,
                'shipping_amount'      => $order->shipping_amount,
                'grand_total'          => $order->grand_total,
                'due_amount'           => max(0, $grandTotal - $paidAmount),
            ]);
        }

        $invoice->items()->delete();

        foreach ($order->items as $item) {
            $invoice->items()->create([
                'ingredient_id'   => $item->ingredient_id,
                'unit_id'         => $item->unit_id,
                'quantity'        => $item->quantity,
                'unit_price'      => $item->unit_price,
                'discount_amount' => $item->discount_amount,
                'tax_amount'      => $item->tax_amount,
                'line_total'      => $item->line_total,
            ]);
        }
    }

    private function deleteUnpaidInvoiceForOrder(PurchaseOrder $order): void
    {
        $invoice = $this->editableInvoiceForOrder($order);
        if (! $invoice) {
            return;
        }

        $invoice->items()->delete();
        $invoice->delete();
    }

    private function editableInvoiceForOrder(PurchaseOrder $order): ?PurchaseInvoice
    {
        $invoice = $this->openInvoiceForOrder($order);

        if (! $invoice || (float) $invoice->paid_amount > 0) {
            return null;
        }

        return $invoice;
    }

    private function openInvoiceForOrder(PurchaseOrder $order): ?PurchaseInvoice
    {
        return PurchaseInvoice::where('purchase_order_id', $order->id)
            ->where('status', '!=', 'cancelled')
            ->first();
    }

    private function generateOrderNo(): string
    {
        $last = PurchaseOrder::withTrashed()->orderByDesc('id')->value('purchase_order_no');
        $seq  = $last ? ((int) substr($last, -6)) + 1 : 1;

        return 'PO-' . date('Ymd') . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);
    }

    private function generateInvoiceNo(): string
    {
        $last = PurchaseInvoice::withTrashed()->orderByDesc('id')->value('invoice_no');
        $seq  = $last ? ((int) substr($last, -6)) + 1 : 1;

        return 'INV-' . date('Ymd') . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);
    }
}
