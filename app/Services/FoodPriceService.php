<?php

namespace App\Services;

use App\Models\Addon;
use App\Models\Food;
use App\Models\FoodVariant;

class FoodPriceService
{
    public function resolve(Food $food, ?int $outletId, ?int $variantId = null): string
    {
        if ($variantId !== null) {
            return $this->resolveVariantPrice($food, $outletId, $variantId);
        }

        return $this->resolveBasePrice($food, $outletId);
    }

    public function resolveBasePrice(Food $food, ?int $outletId): string
    {
        if ($outletId !== null) {
            $outletPrice = $food->outlets()
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->value('price');

            if ($outletPrice !== null) {
                return (string) $outletPrice;
            }
        }

        return (string) $food->base_price;
    }

    public function resolveVariantPrice(Food $food, ?int $outletId, int $variantId): string
    {
        $variant = $food->variants()->find($variantId);

        if (! $variant) {
            return $this->resolveBasePrice($food, $outletId);
        }

        if ($outletId !== null) {
            $variantOutletPrice = $variant->outletSettings()
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->value('price');

            if ($variantOutletPrice !== null) {
                return (string) $variantOutletPrice;
            }
        }

        if ((float) $variant->price > 0) {
            return (string) $variant->price;
        }

        return $this->resolveBasePrice($food, $outletId);
    }

    public function resolveAddonPrice(Addon $addon): string
    {
        return (string) $addon->price;
    }

    public function calculateTotal(Food $food, ?int $outletId, ?int $variantId, array $addonIds = []): string
    {
        $base = (float) $this->resolve($food, $outletId, $variantId);

        $addonsTotal = 0.0;

        if (! empty($addonIds)) {
            $addonsTotal = Addon::whereIn('id', $addonIds)
                ->where('is_active', true)
                ->sum('price');
        }

        return number_format($base + $addonsTotal, 2, '.', '');
    }

    public function isAvailable(Food $food, ?int $outletId): bool
    {
        if (! $food->is_active) {
            return false;
        }

        if ($outletId !== null) {
            $outletSetting = $food->outlets()
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->first();

            if ($outletSetting !== null) {
                return (bool) $outletSetting->is_available;
            }
        }

        return true;
    }

    public function isVariantAvailable(FoodVariant $variant, ?int $outletId): bool
    {
        if (! $variant->is_active) {
            return false;
        }

        if ($outletId !== null) {
            $outletSetting = $variant->outletSettings()
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->first();

            if ($outletSetting !== null) {
                return (bool) $outletSetting->is_available;
            }
        }

        return true;
    }
}
