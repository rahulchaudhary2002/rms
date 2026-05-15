<?php

namespace App\Services;

use App\Models\Food;
use App\Models\FoodVariant;
use App\Models\FoodVariantOutlet;

class FoodVariantService
{
    public function create(Food $food, array $data): FoodVariant
    {
        if ($data['is_default'] ?? false) {
            $food->variants()->update(['is_default' => false]);
        }

        return FoodVariant::create(array_merge($data, ['food_id' => $food->id]));
    }

    public function update(FoodVariant $variant, array $data): void
    {
        if (($data['is_default'] ?? false) && ! $variant->is_default) {
            $variant->food->variants()->where('id', '!=', $variant->id)->update(['is_default' => false]);
        }

        $variant->update($data);
    }

    public function delete(FoodVariant $variant): void
    {
        $variant->delete();
    }

    public function toggleStatus(FoodVariant $variant): void
    {
        $variant->update(['is_active' => ! $variant->is_active]);
    }

    public function upsertOutletPrice(FoodVariant $variant, int $outletId, array $data): FoodVariantOutlet
    {
        return FoodVariantOutlet::updateOrCreate(
            ['food_variant_id' => $variant->id, 'outlet_id' => $outletId],
            [
                'price'        => $data['price'] ?? null,
                'is_available' => $data['is_available'] ?? true,
                'is_active'    => $data['is_active'] ?? true,
            ]
        );
    }
}
