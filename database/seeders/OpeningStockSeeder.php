<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Warehouse;
use App\Models\WarehouseIngredientStock;
use App\Models\IngredientBatch;
use App\Models\IngredientInventoryTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OpeningStockSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser  = User::where('is_superadmin', true)->first() ?? User::first();
        $warehouses = Warehouse::all()->keyBy('code');
        $ingredients = Ingredient::with('baseUnit')->get()->keyBy('code');

        if (! $adminUser || $warehouses->isEmpty() || $ingredients->isEmpty()) {
            $this->command->warn('Skipping OpeningStockSeeder: missing users, warehouses, or ingredients.');
            return;
        }

        /**
         * Opening stock entries: [warehouse_code, ingredient_code, quantity, unit_cost]
         */
        $entries = [
            // Central Warehouse
            ['CW-MAIN', 'VEG-001', 50000,  0.003],  // Tomato 50kg
            ['CW-MAIN', 'VEG-002', 30000,  0.002],  // Onion 30kg
            ['CW-MAIN', 'VEG-003', 40000,  0.0015], // Potato 40kg
            ['CW-MAIN', 'VEG-004', 5000,   0.008],  // Garlic 5kg
            ['CW-MAIN', 'VEG-005', 3000,   0.006],  // Ginger 3kg
            ['CW-MAIN', 'MEA-001', 20000,  0.012],  // Chicken 20kg
            ['CW-MAIN', 'MEA-002', 15000,  0.015],  // Beef 15kg
            ['CW-MAIN', 'DAI-001', 50000,  0.0012], // Milk 50L
            ['CW-MAIN', 'DAI-002', 10000,  0.010],  // Butter 10kg
            ['CW-MAIN', 'DAI-005', 500,    0.15],   // Eggs 500 pcs
            ['CW-MAIN', 'SPI-001', 20000,  0.0005], // Salt 20kg
            ['CW-MAIN', 'SPI-002', 5000,   0.020],  // Black Pepper 5kg
            ['CW-MAIN', 'GRN-001', 100000, 0.0018], // Basmati Rice 100kg
            ['CW-MAIN', 'GRN-002', 50000,  0.0014], // Flour 50kg
            ['CW-MAIN', 'OIL-001', 50000,  0.0015], // Sunflower Oil 50L
            ['CW-MAIN', 'OIL-002', 20000,  0.008],  // Olive Oil 20L
            ['CW-MAIN', 'SAU-001', 10000,  0.003],  // Ketchup 10L
            ['CW-MAIN', 'SAU-002', 8000,   0.005],  // Mayo 8L
            ['CW-MAIN', 'BEV-001', 100000, 0.0008], // Water 100L
            ['CW-MAIN', 'BEV-003', 50000,  0.001],  // Cola 50L
        ];

        foreach ($entries as [$warehouseCode, $ingredientCode, $quantity, $unitCost]) {
            $warehouse  = $warehouses->get($warehouseCode);
            $ingredient = $ingredients->get($ingredientCode);

            if (! $warehouse || ! $ingredient) {
                continue;
            }

            // Skip if opening stock already recorded for this ingredient+warehouse
            $alreadyExists = IngredientInventoryTransaction::where('warehouse_id', $warehouse->id)
                ->where('ingredient_id', $ingredient->id)
                ->where('transaction_type', 'opening_stock')
                ->exists();

            if ($alreadyExists) {
                continue;
            }

            DB::transaction(function () use ($warehouse, $ingredient, $quantity, $unitCost, $adminUser) {
                $totalCost = $quantity * $unitCost;

                // Create batch
                $batch = IngredientBatch::create([
                    'ingredient_id'     => $ingredient->id,
                    'warehouse_id'      => $warehouse->id,
                    'received_quantity' => $quantity,
                    'available_quantity' => 0, // increaseStock will update this
                    'unit_cost'         => $unitCost,
                    'total_cost'        => $totalCost,
                    'is_closed'         => false,
                ]);

                // Update warehouse stock
                $stock = WarehouseIngredientStock::lockForUpdate()->firstOrCreate(
                    ['warehouse_id' => $warehouse->id, 'ingredient_id' => $ingredient->id],
                    ['quantity' => 0, 'average_cost' => 0]
                );

                $newQty        = (float) $stock->quantity + $quantity;
                $newValue      = ((float) $stock->quantity * (float) $stock->average_cost) + $totalCost;
                $newAvgCost    = $newQty > 0 ? $newValue / $newQty : $unitCost;

                $stock->update([
                    'quantity'     => $newQty,
                    'average_cost' => $newAvgCost,
                ]);

                // Update batch available_quantity
                $batch->increment('available_quantity', $quantity);

                // Record transaction
                IngredientInventoryTransaction::create([
                    'ingredient_id'      => $ingredient->id,
                    'warehouse_id'       => $warehouse->id,
                    'ingredient_batch_id' => $batch->id,
                    'transaction_type'   => 'opening_stock',
                    'quantity_in'        => $quantity,
                    'quantity_out'       => 0,
                    'balance_after'      => $newQty,
                    'unit_cost'          => $unitCost,
                    'total_cost'         => $totalCost,
                    'created_by'         => $adminUser->id,
                ]);
            });
        }
    }
}
