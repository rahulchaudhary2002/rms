<?php

namespace App\Services;

use App\Models\Addon;
use App\Models\AddonRecipe;
use App\Models\Food;
use App\Models\FoodRecipe;
use App\Models\FoodVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FoodRecipeService
{
    public function syncFoodRecipes(Food $food, array $recipes, ?int $variantId = null): void
    {
        DB::transaction(function () use ($food, $recipes, $variantId) {
            FoodRecipe::where('food_id', $food->id)
                ->where('food_variant_id', $variantId)
                ->delete();

            foreach ($recipes as $recipe) {
                FoodRecipe::create([
                    'food_id'          => $food->id,
                    'food_variant_id'  => $variantId,
                    'ingredient_id'    => $recipe['ingredient_id'],
                    'unit_id'          => $recipe['unit_id'],
                    'quantity'         => $recipe['quantity'],
                    'wastage_quantity' => $recipe['wastage_quantity'] ?? 0,
                    'is_active'        => $recipe['is_active'] ?? true,
                ]);
            }
        });
    }

    public function upsertFoodRecipe(Food $food, array $data, ?int $variantId = null): FoodRecipe
    {
        return FoodRecipe::updateOrCreate(
            [
                'food_id'         => $food->id,
                'food_variant_id' => $variantId,
                'ingredient_id'   => $data['ingredient_id'],
                'unit_id'         => $data['unit_id'],
            ],
            [
                'quantity'         => $data['quantity'],
                'wastage_quantity' => $data['wastage_quantity'] ?? 0,
                'is_active'        => $data['is_active'] ?? true,
            ]
        );
    }

    public function deleteFoodRecipe(FoodRecipe $recipe): void
    {
        $recipe->delete();
    }

    public function syncAddonRecipes(Addon $addon, array $recipes): void
    {
        DB::transaction(function () use ($addon, $recipes) {
            AddonRecipe::where('addon_id', $addon->id)->delete();

            foreach ($recipes as $recipe) {
                AddonRecipe::create([
                    'addon_id'         => $addon->id,
                    'ingredient_id'    => $recipe['ingredient_id'],
                    'unit_id'          => $recipe['unit_id'],
                    'quantity'         => $recipe['quantity'],
                    'wastage_quantity' => $recipe['wastage_quantity'] ?? 0,
                    'is_active'        => $recipe['is_active'] ?? true,
                ]);
            }
        });
    }

    public function upsertAddonRecipe(Addon $addon, array $data): AddonRecipe
    {
        return AddonRecipe::updateOrCreate(
            [
                'addon_id'      => $addon->id,
                'ingredient_id' => $data['ingredient_id'],
                'unit_id'       => $data['unit_id'],
            ],
            [
                'quantity'         => $data['quantity'],
                'wastage_quantity' => $data['wastage_quantity'] ?? 0,
                'is_active'        => $data['is_active'] ?? true,
            ]
        );
    }

    public function deleteAddonRecipe(AddonRecipe $recipe): void
    {
        $recipe->delete();
    }

    public function getDeductionData(Food $food, ?int $variantId, int $quantity = 1): array
    {
        $recipes = FoodRecipe::with(['ingredient:id,name', 'unit:id,name,short_name'])
            ->where('food_id', $food->id)
            ->where('food_variant_id', $variantId)
            ->where('is_active', true)
            ->get();

        if ($recipes->isEmpty() && $variantId !== null) {
            $recipes = FoodRecipe::with(['ingredient:id,name', 'unit:id,name,short_name'])
                ->where('food_id', $food->id)
                ->whereNull('food_variant_id')
                ->where('is_active', true)
                ->get();
        }

        return $recipes->map(fn ($r) => [
            'ingredient_id'    => $r->ingredient_id,
            'ingredient_name'  => $r->ingredient?->name,
            'unit_id'          => $r->unit_id,
            'unit_name'        => $r->unit?->short_name,
            'quantity'         => (float) $r->quantity * $quantity,
            'wastage_quantity' => (float) $r->wastage_quantity * $quantity,
        ])->all();
    }

    public function getComboDeductionData(Food $comboFood, ?int $comboVariantId, int $quantity = 1): array
    {
        $comboItems = $comboFood->comboItems()
            ->with(['food', 'foodVariant'])
            ->where('combo_food_variant_id', $comboVariantId)
            ->get();

        $deductions = [];

        foreach ($comboItems as $item) {
            $itemDeductions = $this->getDeductionData($item->food, $item->food_variant_id, $item->quantity * $quantity);
            $deductions = array_merge($deductions, $itemDeductions);
        }

        return $deductions;
    }

    public function validateVariantBelongsToFood(int $foodId, ?int $variantId): void
    {
        if ($variantId === null) {
            return;
        }

        $exists = \App\Models\FoodVariant::where('id', $variantId)
            ->where('food_id', $foodId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'food_variant_id' => 'The selected variant does not belong to this food.',
            ]);
        }
    }
}
