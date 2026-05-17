<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Models\IngredientStockTransfer;
use App\Models\IngredientStockTransferItem;
use App\Models\Warehouse;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class IngredientStockTransferService
{
    use PaginatesQuery;

    public function __construct(private IngredientInventoryService $inventoryService) {}

    public function getIndexData(array $filters): array
    {
        $query = IngredientStockTransfer::with(['fromWarehouse', 'toWarehouse', 'requestedBy'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where('transfer_no', 'like', $search);
            })
            ->when($filters['from_warehouse_id'] !== '', fn ($b) => $b->where('from_warehouse_id', $filters['from_warehouse_id']))
            ->when($filters['to_warehouse_id'] !== '', fn ($b) => $b->where('to_warehouse_id', $filters['to_warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->orderByDesc('transfer_date')
            ->orderByDesc('id');

        $transfers  = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $warehouses = Warehouse::orderBy('name')->get(['id', 'name']);

        return compact('transfers', 'warehouses', 'filters');
    }

    public function getCreateData(): array
    {
        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        return compact('warehouses', 'ingredients');
    }

    public function getEditData(IngredientStockTransfer $transfer): array
    {
        $transfer->load(['items.ingredient.baseUnit', 'items.batch', 'fromWarehouse', 'toWarehouse']);

        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        return compact('transfer', 'warehouses', 'ingredients');
    }

    public function getShowData(IngredientStockTransfer $transfer): array
    {
        $transfer->load([
            'items.ingredient.baseUnit',
            'items.batch',
            'fromWarehouse',
            'toWarehouse',
            'requestedBy',
            'approvedBy',
            'dispatchedBy',
            'receivedBy',
        ]);

        return compact('transfer');
    }

    public function createTransfer(array $data, int $userId): IngredientStockTransfer
    {
        return DB::transaction(function () use ($data, $userId) {
            $transfer = IngredientStockTransfer::create([
                'transfer_no'       => $this->generateTransferNo(),
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id'   => $data['to_warehouse_id'],
                'transfer_date'     => $data['transfer_date'],
                'status'            => 'draft',
                'remarks'           => $data['remarks'] ?? null,
                'requested_by'      => $userId,
            ]);

            $this->syncItems($transfer, $data['items']);

            return $transfer;
        });
    }

    public function updateTransfer(IngredientStockTransfer $transfer, array $data): void
    {
        $this->ensureEditable($transfer);

        DB::transaction(function () use ($transfer, $data) {
            $transfer->update([
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id'   => $data['to_warehouse_id'],
                'transfer_date'     => $data['transfer_date'],
                'remarks'           => $data['remarks'] ?? null,
            ]);

            $transfer->items()->delete();
            $this->syncItems($transfer, $data['items']);
        });
    }

    public function deleteTransfer(IngredientStockTransfer $transfer): void
    {
        $this->ensureEditable($transfer);
        $transfer->delete();
    }

    public function submit(IngredientStockTransfer $transfer): void
    {
        if ($transfer->status !== 'draft') {
            throw new RuntimeException('Only draft transfers can be submitted.');
        }

        $transfer->update(['status' => 'requested']);
    }

    public function approve(IngredientStockTransfer $transfer, int $userId): void
    {
        if ($transfer->status !== 'requested') {
            throw new RuntimeException('Only requested transfers can be approved.');
        }

        $transfer->update([
            'status'      => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }

    public function dispatch(IngredientStockTransfer $transfer, array $data, int $userId): void
    {
        if ($transfer->status !== 'approved') {
            throw new RuntimeException('Only approved transfers can be dispatched.');
        }

        $transfer->load('items.ingredient');

        $itemsById = $transfer->items->keyBy('id');

        DB::transaction(function () use ($transfer, $data, $userId, $itemsById) {
            $fromWarehouse = $transfer->fromWarehouse ?? Warehouse::findOrFail($transfer->from_warehouse_id);

            foreach ($data['items'] as $inputItem) {
                $item = $itemsById->get($inputItem['id'])
                    ?? throw new RuntimeException("Transfer item [{$inputItem['id']}] not found.");

                $dispatchedQty = (float) $inputItem['dispatched_quantity'];
                $batchId       = $inputItem['ingredient_batch_id'] ?? $item->ingredient_batch_id;

                $stock = $this->inventoryService->getCurrentStock(
                    $fromWarehouse,
                    $item->ingredient,
                );

                $unitCost  = (float) $stock->average_cost;
                $totalCost = $dispatchedQty * $unitCost;

                $this->inventoryService->decreaseStock($fromWarehouse, $item->ingredient, [
                    'transaction_type' => 'transfer_out',
                    'quantity'         => $dispatchedQty,
                    'unit_cost'        => $unitCost,
                    'batch_id'         => $batchId,
                    'reference_type'   => IngredientStockTransfer::class,
                    'reference_id'     => $transfer->id,
                    'created_by'       => $userId,
                ]);

                $item->update([
                    'ingredient_batch_id' => $batchId,
                    'dispatched_quantity' => $dispatchedQty,
                    'unit_cost'           => $unitCost,
                    'total_cost'          => $totalCost,
                ]);
            }

            $transfer->update([
                'status'         => 'dispatched',
                'dispatched_by'  => $userId,
                'dispatched_at'  => now(),
            ]);
        });
    }

    public function receive(IngredientStockTransfer $transfer, array $data, int $userId): void
    {
        if (! in_array($transfer->status, ['dispatched', 'partially_received'], true)) {
            throw new RuntimeException('Only dispatched transfers can be received.');
        }

        $transfer->load('items.ingredient');

        $itemsById = $transfer->items->keyBy('id');

        DB::transaction(function () use ($transfer, $data, $userId, $itemsById) {
            $toWarehouse = $transfer->toWarehouse ?? Warehouse::findOrFail($transfer->to_warehouse_id);

            foreach ($data['items'] as $inputItem) {
                $item         = $itemsById->get($inputItem['id'])
                    ?? throw new RuntimeException("Transfer item [{$inputItem['id']}] not found.");
                $receivedQty  = (float) $inputItem['received_quantity'];

                if ($receivedQty <= 0) {
                    continue;
                }

                $batch = $this->inventoryService->createBatch($toWarehouse, $item->ingredient, [
                    'batch_no'          => $inputItem['batch_no'] ?? null,
                    'received_quantity' => $receivedQty,
                    'unit_cost'         => (float) $item->unit_cost,
                    'expiry_date'       => $inputItem['expiry_date'] ?? null,
                    'source_type'       => IngredientStockTransfer::class,
                    'source_id'         => $transfer->id,
                ]);

                $this->inventoryService->increaseStock($toWarehouse, $item->ingredient, [
                    'transaction_type' => 'transfer_in',
                    'quantity'         => $receivedQty,
                    'unit_cost'        => (float) $item->unit_cost,
                    'batch_id'         => $batch->id,
                    'reference_type'   => IngredientStockTransfer::class,
                    'reference_id'     => $transfer->id,
                    'created_by'       => $userId,
                ]);

                $item->update([
                    'received_quantity' => (float) $item->received_quantity + $receivedQty,
                ]);
            }

            $transfer->refresh();

            $allReceived = $transfer->items->every(
                fn ($i) => (float) $i->received_quantity >= (float) $i->dispatched_quantity
            );

            $transfer->update([
                'status'      => $allReceived ? 'received' : 'partially_received',
                'received_by' => $userId,
                'received_at' => now(),
            ]);
        });
    }

    public function cancel(IngredientStockTransfer $transfer): void
    {
        if (in_array($transfer->status, ['dispatched', 'partially_received', 'received'], true)) {
            throw new RuntimeException('Dispatched or received transfers cannot be cancelled.');
        }

        $transfer->update(['status' => 'cancelled']);
    }

    // -------------------------------------------------------------------------

    private function syncItems(IngredientStockTransfer $transfer, array $items): void
    {
        foreach ($items as $item) {
            IngredientStockTransferItem::create([
                'ingredient_stock_transfer_id' => $transfer->id,
                'ingredient_id'                => $item['ingredient_id'],
                'ingredient_batch_id'          => $item['ingredient_batch_id'] ?? null,
                'requested_quantity'           => $item['requested_quantity'],
                'remarks'                      => $item['remarks'] ?? null,
            ]);
        }
    }

    private function ensureEditable(IngredientStockTransfer $transfer): void
    {
        if (! in_array($transfer->status, ['draft', 'requested'], true)) {
            throw new RuntimeException('Only draft or requested transfers can be edited.');
        }
    }

    private function generateTransferNo(): string
    {
        $prefix  = 'TRF-'.now()->format('Ym').'-';
        $last    = IngredientStockTransfer::where('transfer_no', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('transfer_no');

        $sequence = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix.str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
