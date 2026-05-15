<?php

namespace App\Services;

use App\Models\Food;
use App\Models\FoodComboItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FoodComboService
{
    public function getComboItems(Food $comboFood, ?int $comboVariantId = null): \Illuminate\Database\Eloquent\Collection
    {
        return FoodComboItem::with([
            'food:id,name,item_type',
            'foodVariant:id,name',
            'comboFoodVariant:id,name',
        ])
            ->where('combo_food_id', $comboFood->id)
            ->where('combo_food_variant_id', $comboVariantId)
            ->get();
    }

    public function addComboItem(Food $comboFood, array $data): FoodComboItem
    {
        $this->validateComboItem($comboFood, $data);

        return FoodComboItem::updateOrCreate(
            [
                'combo_food_id'         => $comboFood->id,
                'combo_food_variant_id' => $data['combo_food_variant_id'] ?? null,
                'food_id'               => $data['food_id'],
                'food_variant_id'       => $data['food_variant_id'] ?? null,
            ],
            ['quantity' => $data['quantity'] ?? 1]
        );
    }

    public function updateComboItem(FoodComboItem $item, array $data): void
    {
        $this->validateComboItem($item->comboFood, $data, $item);

        $item->update([
            'combo_food_variant_id' => $data['combo_food_variant_id'] ?? null,
            'food_id'               => $data['food_id'],
            'food_variant_id'       => $data['food_variant_id'] ?? null,
            'quantity'              => $data['quantity'] ?? 1,
        ]);
    }

    public function removeComboItem(FoodComboItem $item): void
    {
        $item->delete();
    }

    public function syncComboItems(Food $comboFood, ?int $comboVariantId, array $items): void
    {
        DB::transaction(function () use ($comboFood, $comboVariantId, $items) {
            FoodComboItem::where('combo_food_id', $comboFood->id)
                ->where('combo_food_variant_id', $comboVariantId)
                ->delete();

            foreach ($items as $item) {
                $this->validateComboItem($comboFood, array_merge($item, ['combo_food_variant_id' => $comboVariantId]));

                FoodComboItem::create([
                    'combo_food_id'         => $comboFood->id,
                    'combo_food_variant_id' => $comboVariantId,
                    'food_id'               => $item['food_id'],
                    'food_variant_id'       => $item['food_variant_id'] ?? null,
                    'quantity'              => $item['quantity'] ?? 1,
                ]);
            }
        });
    }

    public function validateComboItem(Food $comboFood, array $data, ?FoodComboItem $ignoreItem = null): void
    {
        if ($comboFood->item_type !== 'combo') {
            throw ValidationException::withMessages([
                'combo_food_id' => 'Only combo type foods can have combo items.',
            ]);
        }

        $foodId = $data['food_id'] ?? null;

        if ($foodId == $comboFood->id) {
            throw ValidationException::withMessages([
                'food_id' => 'A combo cannot contain itself.',
            ]);
        }

        $comboVariantId = $data['combo_food_variant_id'] ?? null;

        if ($comboVariantId !== null) {
            $variantBelongsToCombo = \App\Models\FoodVariant::where('id', $comboVariantId)
                ->where('food_id', $comboFood->id)
                ->exists();

            if (! $variantBelongsToCombo) {
                throw ValidationException::withMessages([
                    'combo_food_variant_id' => 'The selected combo variant does not belong to this combo food.',
                ]);
            }
        }

        $childVariantId = $data['food_variant_id'] ?? null;

        if ($childVariantId !== null && $foodId !== null) {
            $childVariantBelongs = \App\Models\FoodVariant::where('id', $childVariantId)
                ->where('food_id', $foodId)
                ->exists();

            if (! $childVariantBelongs) {
                throw ValidationException::withMessages([
                    'food_variant_id' => 'The selected food variant does not belong to the selected food.',
                ]);
            }
        }
    }
}
