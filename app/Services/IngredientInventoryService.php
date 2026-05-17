<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Models\IngredientInventoryTransaction;
use App\Models\Warehouse;
use App\Models\WarehouseIngredientStock;
use App\Exceptions\InsufficientStockException;
use Illuminate\Support\Facades\DB;

class IngredientInventoryService
{
    /**
     * Increase stock for a warehouse ingredient.
     *
     * All quantities must already be in the ingredient's base unit before calling this method.
     *
     * @param  array{
     *     transaction_type: string,
     *     quantity: float,
     *     unit_cost?: float,
     *     batch_id?: int|null,
     *     reference_type?: string|null,
     *     reference_id?: int|null,
     *     remarks?: string|null,
     *     created_by?: int|null,
     * } $data
     */
    public function increaseStock(
        Warehouse $warehouse,
        Ingredient $ingredient,
        array $data,
    ): IngredientInventoryTransaction {
        return DB::transaction(function () use ($warehouse, $ingredient, $data) {
            $quantity  = (float) $data['quantity'];
            $unitCost  = (float) ($data['unit_cost'] ?? 0);
            $totalCost = $quantity * $unitCost;

            $stock = $this->resolveStock($warehouse->id, $ingredient->id);

            $newQuantity = (float) $stock->quantity + $quantity;

            // Recalculate weighted average cost
            $previousValue = (float) $stock->stock_value;
            $newValue      = $previousValue + $totalCost;
            $averageCost   = $newQuantity > 0 ? $newValue / $newQuantity : $unitCost;

            $stock->update([
                'quantity'     => $newQuantity,
                'average_cost' => $averageCost,
                'stock_value'  => $newValue,
            ]);

            // Increase available_quantity on the batch when a batch is specified
            if (! empty($data['batch_id'])) {
                IngredientBatch::where('id', $data['batch_id'])
                    ->lockForUpdate()
                    ->firstOrFail()
                    ->increment('available_quantity', $quantity);
            }

            return $this->createTransaction($warehouse, $ingredient, array_merge($data, [
                'quantity_in'   => $quantity,
                'quantity_out'  => 0,
                'balance_after' => $newQuantity,
                'unit_cost'     => $unitCost,
                'total_cost'    => $totalCost,
            ]));
        });
    }

    /**
     * Decrease stock for a warehouse ingredient.
     *
     * All quantities must already be in the ingredient's base unit before calling this method.
     *
     * @param  array{
     *     transaction_type: string,
     *     quantity: float,
     *     unit_cost?: float,
     *     batch_id?: int|null,
     *     reference_type?: string|null,
     *     reference_id?: int|null,
     *     remarks?: string|null,
     *     created_by?: int|null,
     * } $data
     */
    public function decreaseStock(
        Warehouse $warehouse,
        Ingredient $ingredient,
        array $data,
    ): IngredientInventoryTransaction {
        return DB::transaction(function () use ($warehouse, $ingredient, $data) {
            $quantity  = (float) $data['quantity'];
            $unitCost  = (float) ($data['unit_cost'] ?? 0);
            $totalCost = $quantity * $unitCost;

            $stock = $this->resolveStock($warehouse->id, $ingredient->id);

            if ((float) $stock->quantity < $quantity) {
                throw new InsufficientStockException(
                    $ingredient->name,
                    $warehouse->name,
                    (float) $stock->quantity,
                    $quantity,
                );
            }

            $newQuantity = (float) $stock->quantity - $quantity;
            $newValue    = max(0, (float) $stock->stock_value - $totalCost);
            $averageCost = $newQuantity > 0 ? $newValue / $newQuantity : 0;

            $stock->update([
                'quantity'     => $newQuantity,
                'average_cost' => $averageCost,
                'stock_value'  => $newValue,
            ]);

            // Reduce available_quantity on the batch when a batch is specified
            if (! empty($data['batch_id'])) {
                IngredientBatch::where('id', $data['batch_id'])
                    ->lockForUpdate()
                    ->firstOrFail()
                    ->decrement('available_quantity', $quantity);
            }

            return $this->createTransaction($warehouse, $ingredient, array_merge($data, [
                'quantity_in'   => 0,
                'quantity_out'  => $quantity,
                'balance_after' => $newQuantity,
                'unit_cost'     => $unitCost,
                'total_cost'    => $totalCost,
            ]));
        });
    }

    /**
     * Create a new ingredient batch.
     *
     * All quantities must already be in the ingredient's base unit.
     *
     * @param  array{
     *     batch_no?: string|null,
     *     received_quantity: float,
     *     unit_cost?: float,
     *     manufactured_date?: string|null,
     *     expiry_date?: string|null,
     *     source_type?: string|null,
     *     source_id?: int|null,
     * } $data
     */
    public function createBatch(
        Warehouse $warehouse,
        Ingredient $ingredient,
        array $data,
    ): IngredientBatch {
        $receivedQuantity = (float) $data['received_quantity'];
        $unitCost         = (float) ($data['unit_cost'] ?? 0);

        return IngredientBatch::create([
            'ingredient_id'      => $ingredient->id,
            'warehouse_id'       => $warehouse->id,
            'batch_no'           => $data['batch_no'] ?? null,
            'received_quantity'  => $receivedQuantity,
            'available_quantity' => 0,
            'unit_cost'          => $unitCost,
            'total_cost'         => $receivedQuantity * $unitCost,
            'manufactured_date'  => $data['manufactured_date'] ?? null,
            'expiry_date'        => $data['expiry_date'] ?? null,
            'source_type'        => $data['source_type'] ?? null,
            'source_id'          => $data['source_id'] ?? null,
            'is_closed'          => false,
        ]);
    }

    /**
     * Write a single ledger entry.
     *
     * Called internally by increaseStock / decreaseStock. Can also be called
     * directly when a transaction must be recorded without touching stock totals
     * (e.g. correction records written by a supervisor process).
     *
     * @param  array{
     *     transaction_type: string,
     *     quantity_in: float,
     *     quantity_out: float,
     *     balance_after: float,
     *     unit_cost?: float,
     *     total_cost?: float,
     *     batch_id?: int|null,
     *     reference_type?: string|null,
     *     reference_id?: int|null,
     *     remarks?: string|null,
     *     created_by?: int|null,
     * } $data
     */
    public function createTransaction(
        Warehouse $warehouse,
        Ingredient $ingredient,
        array $data,
    ): IngredientInventoryTransaction {
        return IngredientInventoryTransaction::create([
            'ingredient_id'       => $ingredient->id,
            'warehouse_id'        => $warehouse->id,
            'ingredient_batch_id' => $data['batch_id'] ?? null,
            'transaction_type'    => $data['transaction_type'],
            'quantity_in'         => $data['quantity_in'],
            'quantity_out'        => $data['quantity_out'],
            'balance_after'       => $data['balance_after'],
            'unit_cost'           => $data['unit_cost'] ?? 0,
            'total_cost'          => $data['total_cost'] ?? 0,
            'reference_type'      => $data['reference_type'] ?? null,
            'reference_id'        => $data['reference_id'] ?? null,
            'remarks'             => $data['remarks'] ?? null,
            'created_by'          => $data['created_by'] ?? null,
        ]);
    }

    /**
     * Return the current stock record for a warehouse + ingredient pair.
     */
    public function getCurrentStock(Warehouse $warehouse, Ingredient $ingredient): WarehouseIngredientStock
    {
        return $this->resolveStock($warehouse->id, $ingredient->id);
    }

    // -------------------------------------------------------------------------

    private function resolveStock(int $warehouseId, int $ingredientId): WarehouseIngredientStock
    {
        return WarehouseIngredientStock::lockForUpdate()->firstOrCreate(
            ['warehouse_id' => $warehouseId, 'ingredient_id' => $ingredientId],
            ['quantity' => 0, 'average_cost' => 0, 'stock_value' => 0],
        );
    }
}
