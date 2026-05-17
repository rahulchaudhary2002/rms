<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientStockAdjustment;
use App\Models\IngredientStockAdjustmentItem;
use App\Models\Warehouse;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class IngredientStockAdjustmentService
{
    use PaginatesQuery;

    public function __construct(private IngredientInventoryService $inventoryService) {}

    public function getIndexData(array $filters): array
    {
        $query = IngredientStockAdjustment::with(['warehouse', 'createdBy'])
            ->when($filters['search'] !== '', fn ($b) => $b->where('adjustment_no', 'like', '%'.$filters['search'].'%'))
            ->when($filters['warehouse_id'] !== '', fn ($b) => $b->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->orderByDesc('adjustment_date')
            ->orderByDesc('id');

        $adjustments = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $warehouses  = Warehouse::orderBy('name')->get(['id', 'name']);

        return compact('adjustments', 'warehouses', 'filters');
    }

    public function getCreateData(string $warehouseId = ''): array
    {
        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        // Pre-load current stock for a selected warehouse so the UI can populate system_quantity
        $stockByIngredient = [];
        if ($warehouseId !== '') {
            $stockByIngredient = \App\Models\WarehouseIngredientStock::where('warehouse_id', $warehouseId)
                ->get(['ingredient_id', 'quantity', 'average_cost'])
                ->keyBy('ingredient_id')
                ->map(fn ($s) => ['quantity' => $s->quantity, 'average_cost' => $s->average_cost])
                ->all();
        }

        return compact('warehouses', 'ingredients', 'stockByIngredient');
    }

    public function getEditData(IngredientStockAdjustment $adjustment): array
    {
        $adjustment->load(['items.ingredient.baseUnit', 'items.batch', 'warehouse']);

        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        $stockByIngredient = \App\Models\WarehouseIngredientStock::where('warehouse_id', $adjustment->warehouse_id)
            ->get(['ingredient_id', 'quantity', 'average_cost'])
            ->keyBy('ingredient_id')
            ->map(fn ($s) => ['quantity' => $s->quantity, 'average_cost' => $s->average_cost])
            ->all();

        return compact('adjustment', 'warehouses', 'ingredients', 'stockByIngredient');
    }

    public function getShowData(IngredientStockAdjustment $adjustment): array
    {
        $adjustment->load([
            'items.ingredient.baseUnit',
            'items.batch',
            'warehouse',
            'createdBy',
            'approvedBy',
        ]);

        return compact('adjustment');
    }

    public function createAdjustment(array $data, int $userId): IngredientStockAdjustment
    {
        return DB::transaction(function () use ($data, $userId) {
            $adjustment = IngredientStockAdjustment::create([
                'adjustment_no'   => $this->generateAdjustmentNo(),
                'warehouse_id'    => $data['warehouse_id'],
                'adjustment_date' => $data['adjustment_date'],
                'status'          => 'draft',
                'reason'          => $data['reason'] ?? null,
                'created_by'      => $userId,
            ]);

            $this->syncItems($adjustment, $data['items']);

            return $adjustment;
        });
    }

    public function updateAdjustment(IngredientStockAdjustment $adjustment, array $data): void
    {
        $this->ensureEditable($adjustment);

        DB::transaction(function () use ($adjustment, $data) {
            $adjustment->update([
                'warehouse_id'    => $data['warehouse_id'],
                'adjustment_date' => $data['adjustment_date'],
                'reason'          => $data['reason'] ?? null,
            ]);

            $adjustment->items()->delete();
            $this->syncItems($adjustment, $data['items']);
        });
    }

    public function deleteAdjustment(IngredientStockAdjustment $adjustment): void
    {
        $this->ensureEditable($adjustment);
        $adjustment->delete();
    }

    public function approve(IngredientStockAdjustment $adjustment, int $userId): void
    {
        if ($adjustment->status !== 'draft') {
            throw new RuntimeException('Only draft adjustments can be approved.');
        }

        $adjustment->load('items.ingredient');

        DB::transaction(function () use ($adjustment, $userId) {
            $warehouse = $adjustment->warehouse ?? Warehouse::findOrFail($adjustment->warehouse_id);

            foreach ($adjustment->items as $item) {
                $diff = (float) $item->difference_quantity;

                if ($diff === 0.0) {
                    continue;
                }

                if ($diff > 0) {
                    $this->inventoryService->increaseStock($warehouse, $item->ingredient, [
                        'transaction_type' => 'adjustment_in',
                        'quantity'         => $diff,
                        'unit_cost'        => (float) $item->unit_cost,
                        'batch_id'         => $item->ingredient_batch_id,
                        'reference_type'   => IngredientStockAdjustment::class,
                        'reference_id'     => $adjustment->id,
                        'created_by'       => $userId,
                    ]);
                } else {
                    $this->inventoryService->decreaseStock($warehouse, $item->ingredient, [
                        'transaction_type' => 'adjustment_out',
                        'quantity'         => abs($diff),
                        'unit_cost'        => (float) $item->unit_cost,
                        'batch_id'         => $item->ingredient_batch_id,
                        'reference_type'   => IngredientStockAdjustment::class,
                        'reference_id'     => $adjustment->id,
                        'created_by'       => $userId,
                    ]);
                }
            }

            $adjustment->update([
                'status'      => 'approved',
                'approved_by' => $userId,
                'approved_at' => now(),
            ]);
        });
    }

    public function cancel(IngredientStockAdjustment $adjustment): void
    {
        if ($adjustment->status !== 'draft') {
            throw new RuntimeException('Only draft adjustments can be cancelled.');
        }

        $adjustment->update(['status' => 'cancelled']);
    }

    // -------------------------------------------------------------------------

    private function syncItems(IngredientStockAdjustment $adjustment, array $items): void
    {
        $warehouse = Warehouse::findOrFail($adjustment->warehouse_id);

        foreach ($items as $item) {
            $ingredient = Ingredient::findOrFail($item['ingredient_id']);
            $stock      = $this->inventoryService->getCurrentStock($warehouse, $ingredient);

            $systemQty  = (float) $stock->quantity;
            $actualQty  = (float) $item['actual_quantity'];
            $diffQty    = $actualQty - $systemQty;
            $unitCost   = (float) $stock->average_cost;
            $diffValue  = $diffQty * $unitCost;

            IngredientStockAdjustmentItem::create([
                'ingredient_stock_adjustment_id' => $adjustment->id,
                'ingredient_id'                  => $ingredient->id,
                'ingredient_batch_id'            => $item['ingredient_batch_id'] ?? null,
                'system_quantity'                => $systemQty,
                'actual_quantity'                => $actualQty,
                'difference_quantity'            => $diffQty,
                'unit_cost'                      => $unitCost,
                'difference_value'               => $diffValue,
                'remarks'                        => $item['remarks'] ?? null,
            ]);
        }
    }

    private function ensureEditable(IngredientStockAdjustment $adjustment): void
    {
        if ($adjustment->status !== 'draft') {
            throw new RuntimeException('Only draft adjustments can be edited or deleted.');
        }
    }

    private function generateAdjustmentNo(): string
    {
        $prefix   = 'ADJ-'.now()->format('Ym').'-';
        $last     = IngredientStockAdjustment::where('adjustment_no', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('adjustment_no');
        $sequence = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix.str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
