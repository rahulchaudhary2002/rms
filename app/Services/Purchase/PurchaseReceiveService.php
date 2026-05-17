<?php

namespace App\Services\Purchase;

use App\Exceptions\InsufficientStockException;
use App\Models\Ingredient;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceive;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\IngredientInventoryService;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PurchaseReceiveService
{
    use PaginatesQuery;

    public function __construct(private IngredientInventoryService $inventoryService) {}

    public function getIndexData(array $filters): array
    {
        $query = PurchaseReceive::with(['supplier', 'warehouse', 'purchaseOrder'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%' . $filters['search'] . '%';
                $b->where('receive_no', 'like', $search);
            })
            ->when($filters['supplier_id'] !== '', fn ($b) => $b->where('supplier_id', $filters['supplier_id']))
            ->when($filters['warehouse_id'] !== '', fn ($b) => $b->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->orderByDesc('received_date')
            ->orderByDesc('id');

        $receives   = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $suppliers  = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('receives', 'suppliers', 'warehouses', 'filters');
    }

    public function getCreateData(?string $purchaseOrderId = null): array
    {
        $suppliers   = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'base_unit_id']);
        $units       = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']);
        $purchaseOrders = PurchaseOrder::with(['items.ingredient.baseUnit', 'items.unit'])
            ->whereIn('status', ['ordered', 'partially_received'])
            ->orderByDesc('order_date')
            ->get(['id', 'purchase_order_no', 'supplier_id', 'warehouse_id', 'status'])
            ->map(fn (PurchaseOrder $order) => $this->formatPurchaseOrderPrefill($order))
            ->values();

        $prefill = null;
        if ($purchaseOrderId) {
            $po = PurchaseOrder::with(['items.ingredient.baseUnit', 'items.unit'])->find($purchaseOrderId);
            if ($po) {
                $prefill = $this->formatPurchaseOrderPrefill($po);
            }
        }

        return compact('suppliers', 'warehouses', 'ingredients', 'units', 'purchaseOrders', 'prefill');
    }

    public function getEditData(PurchaseReceive $receive): array
    {
        $receive->load(['items.ingredient.baseUnit', 'items.unit', 'supplier', 'warehouse', 'purchaseOrder']);
        $createData = $this->getCreateData();

        return array_merge($createData, compact('receive'));
    }

    public function getShowData(PurchaseReceive $receive): array
    {
        $receive->load([
            'items.ingredient.baseUnit',
            'items.unit',
            'supplier',
            'warehouse',
            'purchaseOrder',
            'receivedBy',
            'postedBy',
        ]);

        return compact('receive');
    }

    public function createReceive(array $data, int $userId): PurchaseReceive
    {
        return DB::transaction(function () use ($data, $userId) {
            $data = $this->normalizeReceiveDataForPurchaseOrder($data);

            $receive = PurchaseReceive::create([
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'supplier_id'       => $data['supplier_id'],
                'warehouse_id'      => $data['warehouse_id'],
                'receive_no'        => $this->generateReceiveNo(),
                'received_date'     => $data['received_date'],
                'status'            => 'draft',
                'notes'             => $data['notes'] ?? null,
                'received_by'       => $userId,
            ]);

            $this->syncItems($receive, $data['items'] ?? []);

            return $receive;
        });
    }

    public function updateReceive(PurchaseReceive $receive, array $data): void
    {
        DB::transaction(function () use ($receive, $data) {
            $data = $this->normalizeReceiveDataForPurchaseOrder($data);

            $receive->update([
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'supplier_id'       => $data['supplier_id'],
                'warehouse_id'      => $data['warehouse_id'],
                'received_date'     => $data['received_date'],
                'notes'             => $data['notes'] ?? null,
            ]);

            $this->syncItems($receive, $data['items'] ?? []);
        });
    }

    public function deleteReceive(PurchaseReceive $receive): void
    {
        $receive->delete();
    }

    public function post(PurchaseReceive $receive, int $userId): void
    {
        if ($receive->status !== 'draft') {
            throw new RuntimeException('Only draft receives can be posted.');
        }

        DB::transaction(function () use ($receive, $userId) {
            $receive->load(['items.ingredient', 'warehouse']);
            $warehouse = $receive->warehouse;

            foreach ($receive->items as $item) {
                $ingredient = $item->ingredient;
                $accepted   = (float) $item->accepted_quantity;

                if ($accepted <= 0) {
                    continue;
                }

                $batch = null;
                if ($item->batch_no || $item->expiry_date) {
                    $batch = $this->inventoryService->createBatch($warehouse, $ingredient, [
                        'batch_no'           => $item->batch_no,
                        'received_quantity'  => $accepted,
                        'unit_cost'          => (float) $item->unit_price,
                        'manufactured_date'  => $item->manufactured_date?->toDateString(),
                        'expiry_date'        => $item->expiry_date?->toDateString(),
                        'source_type'        => PurchaseReceive::class,
                        'source_id'          => $receive->id,
                    ]);
                }

                $this->inventoryService->increaseStock($warehouse, $ingredient, [
                    'transaction_type' => 'purchase_receive',
                    'quantity'         => $accepted,
                    'unit_cost'        => (float) $item->unit_price,
                    'batch_id'         => $batch?->id,
                    'reference_type'   => PurchaseReceive::class,
                    'reference_id'     => $receive->id,
                    'remarks'          => "Purchase Receive: {$receive->receive_no}",
                    'created_by'       => $userId,
                ]);

                // Update received_quantity on the linked PO item
                if ($item->purchase_order_item_id) {
                    $item->purchaseOrderItem?->increment('received_quantity', $accepted);
                }
            }

            // Update purchase order status
            if ($receive->purchase_order_id) {
                $this->updatePurchaseOrderStatus($receive->purchase_order_id);
            }

            $receive->update([
                'status'    => 'posted',
                'posted_by' => $userId,
                'posted_at' => now(),
            ]);
        });
    }

    public function cancel(PurchaseReceive $receive): void
    {
        if ($receive->status !== 'draft') {
            throw new RuntimeException('Only draft receives can be cancelled.');
        }

        $receive->update(['status' => 'cancelled']);
    }

    private function syncItems(PurchaseReceive $receive, array $items): void
    {
        $receive->items()->delete();

        foreach ($items as $item) {
            $accepted  = (float) ($item['received_quantity'] ?? 0) - (float) ($item['rejected_quantity'] ?? 0);
            $lineTotal = $accepted * (float) ($item['unit_price'] ?? 0);

            $receive->items()->create([
                'purchase_order_item_id' => $item['purchase_order_item_id'] ?? null,
                'ingredient_id'          => $item['ingredient_id'],
                'unit_id'                => $item['unit_id'],
                'ordered_quantity'       => $item['ordered_quantity'] ?? 0,
                'received_quantity'      => $item['received_quantity'],
                'rejected_quantity'      => $item['rejected_quantity'] ?? 0,
                'accepted_quantity'      => max(0, $accepted),
                'unit_price'             => $item['unit_price'] ?? 0,
                'line_total'             => $lineTotal,
                'batch_no'               => $item['batch_no'] ?? null,
                'manufactured_date'      => $item['manufactured_date'] ?? null,
                'expiry_date'            => $item['expiry_date'] ?? null,
                'remarks'                => $item['remarks'] ?? null,
            ]);
        }
    }

    private function normalizeReceiveDataForPurchaseOrder(array $data): array
    {
        if (empty($data['purchase_order_id'])) {
            return $data;
        }

        $order = PurchaseOrder::with('items.ingredient')
            ->whereIn('status', ['ordered', 'partially_received'])
            ->lockForUpdate()
            ->find($data['purchase_order_id']);

        if (! $order) {
            throw new RuntimeException('Selected purchase order is not available for receiving.');
        }

        $data['supplier_id']  = $order->supplier_id;
        $data['warehouse_id'] = $order->warehouse_id;

        $orderItems = $order->items->keyBy('id');

        foreach ($data['items'] as &$item) {
            $orderItemId = $item['purchase_order_item_id'] ?? null;
            $orderItem   = $orderItemId ? $orderItems->get((int) $orderItemId) : null;

            if (! $orderItem) {
                throw new RuntimeException('Received items must belong to the selected purchase order.');
            }

            $accepted  = (float) ($item['received_quantity'] ?? 0) - (float) ($item['rejected_quantity'] ?? 0);
            $remaining = max(0, (float) $orderItem->quantity - (float) $orderItem->received_quantity);

            if ($accepted > $remaining + 0.0001) {
                $ingredientName = $orderItem->ingredient?->name ?? 'an item';
                throw new RuntimeException("Received quantity for {$ingredientName} exceeds the remaining purchase order quantity.");
            }

            $item['ingredient_id']    = $orderItem->ingredient_id;
            $item['unit_id']          = $orderItem->unit_id;
            $item['ordered_quantity'] = $remaining;
            $item['unit_price']       = $orderItem->unit_price;
        }
        unset($item);

        return $data;
    }

    private function formatPurchaseOrderPrefill(PurchaseOrder $order): array
    {
        return [
            'id'                => (string) $order->id,
            'purchase_order_id' => (string) $order->id,
            'purchase_order_no' => $order->purchase_order_no,
            'supplier_id'       => (string) $order->supplier_id,
            'warehouse_id'      => (string) $order->warehouse_id,
            'items'             => $order->items
                ->filter(fn ($item) => (float) $item->quantity > (float) $item->received_quantity)
                ->map(fn ($item) => [
                    'purchase_order_item_id' => (string) $item->id,
                    'ingredient_id'          => (string) $item->ingredient_id,
                    'unit_id'                => (string) $item->unit_id,
                    'ordered_quantity'       => (string) max(0, (float) $item->quantity - (float) $item->received_quantity),
                    'unit_price'             => (string) $item->unit_price,
                    'ingredient_name'        => $item->ingredient?->name ?? '',
                    'unit_name'              => $item->unit?->name ?? '',
                ])
                ->values()
                ->all(),
        ];
    }

    private function updatePurchaseOrderStatus(int $purchaseOrderId): void
    {
        $po = \App\Models\PurchaseOrder::with('items')->find($purchaseOrderId);
        if (! $po) {
            return;
        }

        $allReceived     = true;
        $anyReceived     = false;

        foreach ($po->items as $item) {
            if ((float) $item->received_quantity >= (float) $item->quantity) {
                $anyReceived = true;
            } else {
                $allReceived = false;
                if ((float) $item->received_quantity > 0) {
                    $anyReceived = true;
                }
            }
        }

        $newStatus = $allReceived ? 'received' : ($anyReceived ? 'partially_received' : $po->status);
        $po->update(['status' => $newStatus]);
    }

    private function generateReceiveNo(): string
    {
        $last = PurchaseReceive::withTrashed()->orderByDesc('id')->value('receive_no');
        $seq  = $last ? ((int) substr($last, -6)) + 1 : 1;

        return 'GRN-' . date('Ymd') . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);
    }
}
