<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientStockAdjustment;
use App\Models\IngredientStockCount;
use App\Models\IngredientStockCountItem;
use App\Models\Warehouse;
use App\Models\WarehouseIngredientStock;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class IngredientStockCountService
{
    use PaginatesQuery;

    public function __construct(private IngredientStockAdjustmentService $adjustmentService) {}

    public function getIndexData(array $filters): array
    {
        $query = IngredientStockCount::with(['warehouse', 'createdBy'])
            ->when($filters['search'] !== '', fn ($b) => $b->where('count_no', 'like', '%'.$filters['search'].'%'))
            ->when($filters['warehouse_id'] !== '', fn ($b) => $b->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->orderByDesc('count_date')
            ->orderByDesc('id');

        $counts     = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $warehouses = Warehouse::orderBy('name')->get(['id', 'name']);

        return compact('counts', 'warehouses', 'filters');
    }

    public function getCreateData(string $warehouseId = ''): array
    {
        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        $stockByIngredient = [];
        if ($warehouseId !== '') {
            $stockByIngredient = WarehouseIngredientStock::where('warehouse_id', $warehouseId)
                ->get(['ingredient_id', 'quantity', 'average_cost'])
                ->keyBy('ingredient_id')
                ->map(fn ($s) => ['quantity' => $s->quantity, 'average_cost' => $s->average_cost])
                ->all();
        }

        return compact('warehouses', 'ingredients', 'stockByIngredient');
    }

    public function getEditData(IngredientStockCount $count): array
    {
        $count->load(['items.ingredient.baseUnit', 'items.batch', 'warehouse']);

        $warehouses  = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $ingredients = Ingredient::with('baseUnit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'base_unit_id']);

        $stockByIngredient = WarehouseIngredientStock::where('warehouse_id', $count->warehouse_id)
            ->get(['ingredient_id', 'quantity', 'average_cost'])
            ->keyBy('ingredient_id')
            ->map(fn ($s) => ['quantity' => $s->quantity, 'average_cost' => $s->average_cost])
            ->all();

        return compact('count', 'warehouses', 'ingredients', 'stockByIngredient');
    }

    public function getShowData(IngredientStockCount $count): array
    {
        $count->load([
            'items.ingredient.baseUnit',
            'items.batch',
            'warehouse',
            'createdBy',
            'completedBy',
        ]);

        return compact('count');
    }

    public function createCount(array $data, int $userId): IngredientStockCount
    {
        return DB::transaction(function () use ($data, $userId) {
            $count = IngredientStockCount::create([
                'count_no'     => $this->generateCountNo(),
                'warehouse_id' => $data['warehouse_id'],
                'count_date'   => $data['count_date'],
                'status'       => 'draft',
                'remarks'      => $data['remarks'] ?? null,
                'created_by'   => $userId,
            ]);

            $this->syncItems($count, $data['items']);

            return $count;
        });
    }

    public function updateCount(IngredientStockCount $count, array $data): void
    {
        $this->ensureEditable($count);

        DB::transaction(function () use ($count, $data) {
            if ($count->status === 'draft') {
                $count->update([
                    'warehouse_id' => $data['warehouse_id'],
                    'count_date'   => $data['count_date'],
                    'remarks'      => $data['remarks'] ?? null,
                ]);

                $count->items()->delete();
                $this->syncItems($count, $data['items']);
            } else {
                // Counting phase: update counted_quantity per item by ID
                $count->update(['remarks' => $data['remarks'] ?? null]);

                foreach ($data['items'] as $itemData) {
                    if (empty($itemData['id'])) {
                        continue;
                    }

                    $item = $count->items()->find($itemData['id']);
                    if (! $item) {
                        continue;
                    }

                    $countedQty  = (float) ($itemData['counted_quantity'] ?? 0);
                    $diffQty     = $countedQty - (float) $item->system_quantity;

                    $item->update([
                        'counted_quantity'    => $countedQty,
                        'difference_quantity' => $diffQty,
                        'remarks'             => $itemData['remarks'] ?? null,
                    ]);
                }
            }
        });
    }

    public function deleteCount(IngredientStockCount $count): void
    {
        if (! in_array($count->status, ['draft', 'cancelled'])) {
            throw new RuntimeException('Only draft or cancelled counts can be deleted.');
        }

        $count->delete();
    }

    public function startCounting(IngredientStockCount $count): void
    {
        if ($count->status !== 'draft') {
            throw new RuntimeException('Only draft counts can be started.');
        }

        if ($count->items()->count() === 0) {
            throw new RuntimeException('Add at least one item before starting the count.');
        }

        $count->update(['status' => 'counting']);
    }

    public function complete(IngredientStockCount $count, int $userId): void
    {
        if ($count->status !== 'counting') {
            throw new RuntimeException('Only counting-phase counts can be completed.');
        }

        $count->update([
            'status'       => 'completed',
            'completed_by' => $userId,
            'completed_at' => now(),
        ]);
    }

    public function generateAdjustment(IngredientStockCount $count, int $userId): IngredientStockAdjustment
    {
        if ($count->status !== 'completed') {
            throw new RuntimeException('Only completed counts can generate an adjustment.');
        }

        $count->load('items');

        $itemsWithDiff = $count->items->filter(fn ($i) => (float) $i->difference_quantity !== 0.0);

        if ($itemsWithDiff->isEmpty()) {
            throw new RuntimeException('No differences found. All counted quantities match system quantities.');
        }

        $adjustmentData = [
            'warehouse_id'    => $count->warehouse_id,
            'adjustment_date' => now()->toDateString(),
            'reason'          => "Generated from Stock Count {$count->count_no}",
            'items'           => $itemsWithDiff->values()->map(fn ($item) => [
                'ingredient_id'       => $item->ingredient_id,
                'ingredient_batch_id' => $item->ingredient_batch_id,
                'actual_quantity'     => (string) $item->counted_quantity,
                'remarks'             => $item->remarks,
            ])->all(),
        ];

        return $this->adjustmentService->createAdjustment($adjustmentData, $userId);
    }

    public function markAdjusted(IngredientStockCount $count): void
    {
        if ($count->status !== 'completed') {
            throw new RuntimeException('Only completed counts can be marked as adjusted.');
        }

        $count->update(['status' => 'adjusted']);
    }

    public function cancel(IngredientStockCount $count): void
    {
        if (! in_array($count->status, ['draft', 'counting'])) {
            throw new RuntimeException('Only draft or counting-phase counts can be cancelled.');
        }

        $count->update(['status' => 'cancelled']);
    }

    // -------------------------------------------------------------------------

    private function syncItems(IngredientStockCount $count, array $items): void
    {
        $warehouse = Warehouse::findOrFail($count->warehouse_id);

        foreach ($items as $item) {
            $ingredient = Ingredient::findOrFail($item['ingredient_id']);

            $stock      = WarehouseIngredientStock::where('warehouse_id', $warehouse->id)
                ->where('ingredient_id', $ingredient->id)
                ->first();

            $systemQty   = $stock ? (float) $stock->quantity : 0.0;
            $countedQty  = isset($item['counted_quantity']) && $item['counted_quantity'] !== '' && $item['counted_quantity'] !== null
                ? (float) $item['counted_quantity']
                : $systemQty;
            $diffQty     = $countedQty - $systemQty;

            IngredientStockCountItem::create([
                'ingredient_stock_count_id' => $count->id,
                'ingredient_id'             => $ingredient->id,
                'ingredient_batch_id'       => $item['ingredient_batch_id'] ?? null,
                'system_quantity'           => $systemQty,
                'counted_quantity'          => $countedQty,
                'difference_quantity'       => $diffQty,
                'remarks'                   => $item['remarks'] ?? null,
            ]);
        }
    }

    private function ensureEditable(IngredientStockCount $count): void
    {
        if (! in_array($count->status, ['draft', 'counting'])) {
            throw new RuntimeException('Only draft or counting-phase counts can be edited.');
        }
    }

    private function generateCountNo(): string
    {
        $prefix   = 'CNT-'.now()->format('Ym').'-';
        $last     = IngredientStockCount::where('count_no', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('count_no');
        $sequence = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix.str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
