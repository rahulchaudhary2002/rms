<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientWastage;
use App\Models\IngredientWastageItem;
use App\Models\Warehouse;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class IngredientWastageService
{
    use PaginatesQuery;

    public function __construct(private IngredientInventoryService $inventoryService) {}

    public function getIndexData(array $filters, array $scope = []): array
    {
        $warehouseIds = $scope ? $this->warehouseIdsForScope($scope) : null;

        $query = IngredientWastage::with(['warehouse', 'createdBy'])
            ->when($warehouseIds !== null, fn ($b) => $b->whereIn('warehouse_id', $warehouseIds))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $b->where('wastage_no', 'like', '%'.$filters['search'].'%');
            })
            ->when($filters['warehouse_id'] !== '', fn ($b) => $b->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->when($filters['reason'] !== '', fn ($b) => $b->where('reason', $filters['reason']))
            ->orderByDesc('wastage_date')
            ->orderByDesc('id');

        $wastages   = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $warehouses = $warehouseIds !== null
            ? Warehouse::whereIn('id', $warehouseIds)->orderBy('name')->get(['id', 'name'])
            : Warehouse::orderBy('name')->get(['id', 'name']);

        return compact('wastages', 'warehouses', 'filters');
    }

    public function getCreateData(string $warehouseId = '', array $scope = []): array
    {
        $warehouseIds       = $scope ? $this->warehouseIdsForScope($scope) : null;
        $defaultWarehouseId = $scope ? $this->defaultWarehouseId($scope) : '';
        $resolvedId         = $warehouseId !== '' ? $warehouseId : $defaultWarehouseId;

        $warehouses  = $this->scopedWarehouses($warehouseIds);
        $ingredients = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        $stockByIngredient = [];
        if ($resolvedId !== '') {
            $stockByIngredient = \App\Models\WarehouseIngredientStock::where('warehouse_id', $resolvedId)
                ->get(['ingredient_id', 'quantity', 'average_cost'])
                ->keyBy('ingredient_id')
                ->map(fn ($s) => ['quantity' => $s->quantity, 'average_cost' => $s->average_cost])
                ->all();
        }

        return compact('warehouses', 'ingredients', 'stockByIngredient', 'defaultWarehouseId');
    }

    public function getEditData(IngredientWastage $wastage, array $scope = []): array
    {
        $wastage->load(['items.ingredient.baseUnit', 'items.batch', 'warehouse']);

        $warehouseIds = $scope ? $this->warehouseIdsForScope($scope) : null;
        $warehouses   = $this->scopedWarehouses($warehouseIds);
        $ingredients  = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        return compact('wastage', 'warehouses', 'ingredients');
    }

    private function scopedWarehouses(?array $warehouseIds)
    {
        $q = Warehouse::where('is_active', true)->orderBy('name');
        if ($warehouseIds !== null) {
            $q->whereIn('id', $warehouseIds);
        }
        return $q->get(['id', 'name']);
    }

    public function getShowData(IngredientWastage $wastage): array
    {
        $wastage->load([
            'items.ingredient.baseUnit',
            'items.batch',
            'warehouse',
            'createdBy',
            'approvedBy',
        ]);

        return compact('wastage');
    }

    public function createWastage(array $data, int $userId): IngredientWastage
    {
        return DB::transaction(function () use ($data, $userId) {
            $wastage = IngredientWastage::create([
                'wastage_no'   => $this->generateWastageNo(),
                'warehouse_id' => $data['warehouse_id'],
                'wastage_date' => $data['wastage_date'],
                'reason'       => $data['reason'],
                'status'       => 'draft',
                'remarks'      => $data['remarks'] ?? null,
                'created_by'   => $userId,
            ]);

            $this->syncItems($wastage, $data['items']);

            return $wastage;
        });
    }

    public function updateWastage(IngredientWastage $wastage, array $data): void
    {
        $this->ensureEditable($wastage);

        DB::transaction(function () use ($wastage, $data) {
            $wastage->update([
                'warehouse_id' => $data['warehouse_id'],
                'wastage_date' => $data['wastage_date'],
                'reason'       => $data['reason'],
                'remarks'      => $data['remarks'] ?? null,
            ]);

            $wastage->items()->delete();
            $this->syncItems($wastage, $data['items']);
        });
    }

    public function deleteWastage(IngredientWastage $wastage): void
    {
        $this->ensureEditable($wastage);
        $wastage->delete();
    }

    public function approve(IngredientWastage $wastage, int $userId): void
    {
        if ($wastage->status !== 'draft') {
            throw new RuntimeException('Only draft wastages can be approved.');
        }

        $wastage->load('items.ingredient');

        DB::transaction(function () use ($wastage, $userId) {
            $warehouse = $wastage->warehouse ?? Warehouse::findOrFail($wastage->warehouse_id);

            foreach ($wastage->items as $item) {
                $stock    = $this->inventoryService->getCurrentStock($warehouse, $item->ingredient);
                $unitCost = (float) $stock->average_cost;

                $this->inventoryService->decreaseStock($warehouse, $item->ingredient, [
                    'transaction_type' => 'wastage',
                    'quantity'         => (float) $item->quantity,
                    'unit_cost'        => $unitCost,
                    'batch_id'         => $item->ingredient_batch_id,
                    'reference_type'   => IngredientWastage::class,
                    'reference_id'     => $wastage->id,
                    'created_by'       => $userId,
                ]);

                $item->update([
                    'unit_cost'  => $unitCost,
                    'total_cost' => (float) $item->quantity * $unitCost,
                ]);
            }

            $wastage->update([
                'status'      => 'approved',
                'approved_by' => $userId,
                'approved_at' => now(),
            ]);
        });
    }

    public function cancel(IngredientWastage $wastage): void
    {
        if ($wastage->status !== 'draft') {
            throw new RuntimeException('Only draft wastages can be cancelled.');
        }

        $wastage->update(['status' => 'cancelled']);
    }

    // -------------------------------------------------------------------------

    private function syncItems(IngredientWastage $wastage, array $items): void
    {
        foreach ($items as $item) {
            IngredientWastageItem::create([
                'ingredient_wastage_id' => $wastage->id,
                'ingredient_id'         => $item['ingredient_id'],
                'ingredient_batch_id'   => $item['ingredient_batch_id'] ?? null,
                'quantity'              => $item['quantity'],
            ]);
        }
    }

    private function ensureEditable(IngredientWastage $wastage): void
    {
        if ($wastage->status !== 'draft') {
            throw new RuntimeException('Only draft wastages can be edited or deleted.');
        }
    }

    private function generateWastageNo(): string
    {
        $prefix   = 'WST-'.now()->format('Ym').'-';
        $last     = IngredientWastage::where('wastage_no', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('wastage_no');
        $sequence = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix.str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
