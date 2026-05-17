<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientStockOut;
use App\Models\IngredientStockOutItem;
use App\Models\Warehouse;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class IngredientStockOutService
{
    use PaginatesQuery;

    public function __construct(private IngredientInventoryService $inventoryService) {}

    public function getIndexData(array $filters, array $scope = []): array
    {
        $warehouseIds = $scope ? $this->warehouseIdsForScope($scope) : null;

        $query = IngredientStockOut::with(['warehouse', 'createdBy'])
            ->when($warehouseIds !== null, fn ($b) => $b->whereIn('warehouse_id', $warehouseIds))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $b->where('stock_out_no', 'like', '%'.$filters['search'].'%');
            })
            ->when($filters['warehouse_id'] !== '', fn ($b) => $b->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->when($filters['purpose'] !== '', fn ($b) => $b->where('purpose', $filters['purpose']))
            ->orderByDesc('stock_out_date')
            ->orderByDesc('id');

        $stockOuts  = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $warehouses = $warehouseIds !== null
            ? Warehouse::whereIn('id', $warehouseIds)->orderBy('name')->get(['id', 'name'])
            : Warehouse::orderBy('name')->get(['id', 'name']);

        return compact('stockOuts', 'warehouses', 'filters');
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

    public function getEditData(IngredientStockOut $stockOut, array $scope = []): array
    {
        $stockOut->load(['items.ingredient.baseUnit', 'items.batch', 'warehouse']);

        $warehouseIds = $scope ? $this->warehouseIdsForScope($scope) : null;
        $warehouses   = $this->scopedWarehouses($warehouseIds);
        $ingredients  = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        return compact('stockOut', 'warehouses', 'ingredients');
    }

    private function scopedWarehouses(?array $warehouseIds)
    {
        $q = Warehouse::where('is_active', true)->orderBy('name');
        if ($warehouseIds !== null) {
            $q->whereIn('id', $warehouseIds);
        }
        return $q->get(['id', 'name']);
    }

    public function getShowData(IngredientStockOut $stockOut): array
    {
        $stockOut->load([
            'items.ingredient.baseUnit',
            'items.batch',
            'warehouse',
            'createdBy',
            'approvedBy',
        ]);

        return compact('stockOut');
    }

    public function createStockOut(array $data, int $userId): IngredientStockOut
    {
        return DB::transaction(function () use ($data, $userId) {
            $stockOut = IngredientStockOut::create([
                'stock_out_no'   => $this->generateStockOutNo(),
                'warehouse_id'   => $data['warehouse_id'],
                'stock_out_date' => $data['stock_out_date'],
                'purpose'        => $data['purpose'],
                'status'         => 'draft',
                'remarks'        => $data['remarks'] ?? null,
                'created_by'     => $userId,
            ]);

            $this->syncItems($stockOut, $data['items']);

            return $stockOut;
        });
    }

    public function updateStockOut(IngredientStockOut $stockOut, array $data): void
    {
        $this->ensureEditable($stockOut);

        DB::transaction(function () use ($stockOut, $data) {
            $stockOut->update([
                'warehouse_id'   => $data['warehouse_id'],
                'stock_out_date' => $data['stock_out_date'],
                'purpose'        => $data['purpose'],
                'remarks'        => $data['remarks'] ?? null,
            ]);

            $stockOut->items()->delete();
            $this->syncItems($stockOut, $data['items']);
        });
    }

    public function deleteStockOut(IngredientStockOut $stockOut): void
    {
        $this->ensureEditable($stockOut);
        $stockOut->delete();
    }

    public function approve(IngredientStockOut $stockOut, int $userId): void
    {
        if ($stockOut->status !== 'draft') {
            throw new RuntimeException('Only draft stock outs can be approved.');
        }

        $stockOut->load('items.ingredient');

        DB::transaction(function () use ($stockOut, $userId) {
            $warehouse = $stockOut->warehouse ?? Warehouse::findOrFail($stockOut->warehouse_id);

            foreach ($stockOut->items as $item) {
                $stock    = $this->inventoryService->getCurrentStock($warehouse, $item->ingredient);
                $unitCost = (float) $stock->average_cost;

                $this->inventoryService->decreaseStock($warehouse, $item->ingredient, [
                    'transaction_type' => 'stock_out',
                    'quantity'         => (float) $item->quantity,
                    'unit_cost'        => $unitCost,
                    'batch_id'         => $item->ingredient_batch_id,
                    'reference_type'   => IngredientStockOut::class,
                    'reference_id'     => $stockOut->id,
                    'created_by'       => $userId,
                ]);

                $item->update([
                    'unit_cost'  => $unitCost,
                    'total_cost' => (float) $item->quantity * $unitCost,
                ]);
            }

            $stockOut->update([
                'status'      => 'approved',
                'approved_by' => $userId,
                'approved_at' => now(),
            ]);
        });
    }

    public function cancel(IngredientStockOut $stockOut): void
    {
        if ($stockOut->status !== 'draft') {
            throw new RuntimeException('Only draft stock outs can be cancelled.');
        }

        $stockOut->update(['status' => 'cancelled']);
    }

    // -------------------------------------------------------------------------

    private function syncItems(IngredientStockOut $stockOut, array $items): void
    {
        foreach ($items as $item) {
            IngredientStockOutItem::create([
                'ingredient_stock_out_id' => $stockOut->id,
                'ingredient_id'           => $item['ingredient_id'],
                'ingredient_batch_id'     => $item['ingredient_batch_id'] ?? null,
                'quantity'                => $item['quantity'],
            ]);
        }
    }

    private function ensureEditable(IngredientStockOut $stockOut): void
    {
        if ($stockOut->status !== 'draft') {
            throw new RuntimeException('Only draft stock outs can be edited or deleted.');
        }
    }

    private function generateStockOutNo(): string
    {
        $prefix   = 'STO-'.now()->format('Ym').'-';
        $last     = IngredientStockOut::where('stock_out_no', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('stock_out_no');
        $sequence = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix.str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
