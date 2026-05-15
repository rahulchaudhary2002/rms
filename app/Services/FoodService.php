<?php

namespace App\Services;

use App\Models\Food;
use App\Models\FoodOutlet;
use App\Models\Outlet;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class FoodService
{
    use PaginatesQuery;

    public function list(array $filters, array $scope): array
    {
        $query = Food::with('category:id,name')
            ->withCount(['variants', 'recipes', 'images'])
            ->when($filters['search'] !== '', fn ($b) => $b->where(fn ($q) => $q
                ->where('name', 'like', '%'.$filters['search'].'%')
                ->orWhere('sku', 'like', '%'.$filters['search'].'%')))
            ->when($filters['category_id'] !== '', fn ($b) => $b->where('food_category_id', $filters['category_id']))
            ->when($filters['item_type'] !== '', fn ($b) => $b->where('item_type', $filters['item_type']))
            ->when($filters['food_type'] !== '', fn ($b) => $b->where('food_type', $filters['food_type']))
            ->when($filters['outlet_id'] !== '', fn ($b) => $b->whereHas('outlets', fn ($q) => $q->where('outlet_id', $filters['outlet_id'])))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('sort_order')
            ->orderByDesc('created_at');

        $foods = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('foods', 'filters');
    }

    public function find(int $id, ?array $scope = null): Food
    {
        $outletId = $scope ? $this->outletIdFromScope($scope) : null;

        return Food::with([
            'category:id,name',
            'outlets' => fn ($q) => $q->when($outletId !== null, fn ($b) => $b->where('outlet_id', $outletId)),
            'outlets.outlet:id,name',
            'variants.outletSettings' => fn ($q) => $q->when($outletId !== null, fn ($b) => $b->where('outlet_id', $outletId)),
            'variants.outletSettings.outlet:id,name',
            'foodAddonGroups.addonGroup.addons',
            'allRecipes.ingredient:id,name',
            'allRecipes.unit:id,name,short_name',
            'allRecipes.variant:id,name',
            'availabilitySchedules' => fn ($q) => $q->when(
                $outletId !== null,
                fn ($b) => $b->where(fn ($inner) => $inner->whereNull('outlet_id')->orWhere('outlet_id', $outletId)),
            ),
            'availabilitySchedules.outlet:id,name',
            'images',
            'comboItems.food:id,name,item_type',
            'comboItems.foodVariant:id,name',
            'comboItems.comboFoodVariant:id,name',
        ])->findOrFail($id);
    }

    public function create(array $data): Food
    {
        return DB::transaction(function () use ($data) {
            $food = Food::create([
                'food_category_id'  => $data['food_category_id'] ?? null,
                'name'              => $data['name'],
                'slug'              => $data['slug'] ?? null,
                'sku'               => $data['sku'] ?? null,
                'short_description' => $data['short_description'] ?? null,
                'description'       => $data['description'] ?? null,
                'food_type'         => $data['food_type'] ?? null,
                'item_type'         => $data['item_type'],
                'base_price'        => $data['base_price'] ?? 0,
                'has_variants'      => $data['has_variants'] ?? false,
                'has_addons'        => $data['has_addons'] ?? false,
                'is_recipe_enabled' => $data['is_recipe_enabled'] ?? false,
                'is_taxable'        => $data['is_taxable'] ?? true,
                'is_discountable'   => $data['is_discountable'] ?? true,
                'is_featured'       => $data['is_featured'] ?? false,
                'is_active'         => $data['is_active'] ?? true,
                'preparation_time'  => $data['preparation_time'] ?? null,
                'sort_order'        => $data['sort_order'] ?? 0,
            ]);

            return $food;
        });
    }

    public function update(Food $food, array $data): void
    {
        $food->update([
            'food_category_id'  => $data['food_category_id'] ?? null,
            'name'              => $data['name'],
            'sku'               => $data['sku'] ?? null,
            'short_description' => $data['short_description'] ?? null,
            'description'       => $data['description'] ?? null,
            'food_type'         => $data['food_type'] ?? null,
            'item_type'         => $data['item_type'],
            'base_price'        => $data['base_price'] ?? 0,
            'has_variants'      => $data['has_variants'] ?? false,
            'has_addons'        => $data['has_addons'] ?? false,
            'is_recipe_enabled' => $data['is_recipe_enabled'] ?? false,
            'is_taxable'        => $data['is_taxable'] ?? true,
            'is_discountable'   => $data['is_discountable'] ?? true,
            'is_featured'       => $data['is_featured'] ?? false,
            'is_active'         => $data['is_active'] ?? true,
            'preparation_time'  => $data['preparation_time'] ?? null,
            'sort_order'        => $data['sort_order'] ?? 0,
        ]);
    }

    public function delete(Food $food): void
    {
        $food->delete();
    }

    public function toggleStatus(Food $food): void
    {
        $food->update(['is_active' => ! $food->is_active]);
    }

    public function toggleFeatured(Food $food): void
    {
        $food->update(['is_featured' => ! $food->is_featured]);
    }

    public function upsertOutletPrice(Food $food, int $outletId, array $data): FoodOutlet
    {
        return FoodOutlet::updateOrCreate(
            ['food_id' => $food->id, 'outlet_id' => $outletId],
            [
                'price'        => $data['price'] ?? null,
                'is_available' => $data['is_available'] ?? true,
                'is_active'    => $data['is_active'] ?? true,
            ]
        );
    }

    public function scopeOutlets(array $scope): \Illuminate\Database\Eloquent\Collection
    {
        $outletId = $this->outletIdFromScope($scope);

        if ($outletId !== null) {
            return Outlet::where('id', $outletId)->get(['id', 'name']);
        }

        return Outlet::orderBy('name')->get(['id', 'name']);
    }

    private function outletIdFromScope(array $scope): ?int
    {
        if ($scope['type'] === 'outlet') {
            return (int) $scope['scope_id'];
        }

        if ($scope['type'] === 'warehouse') {
            return $scope['outlet_id'] !== null ? (int) $scope['outlet_id'] : null;
        }

        return null;
    }
}
