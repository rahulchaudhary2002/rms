<?php

namespace App\Services;

use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\FoodAddonGroup;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class AddonGroupService
{
    use PaginatesQuery;

    public function list(array $filters): array
    {
        $query = AddonGroup::withCount('addons')
            ->when($filters['search'] !== '', fn ($b) => $b->where('name', 'like', '%'.$filters['search'].'%'))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('sort_order')
            ->orderBy('name');

        $addonGroups = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('addonGroups', 'filters');
    }

    public function allForSelect(): \Illuminate\Database\Eloquent\Collection
    {
        return AddonGroup::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function find(int $id): AddonGroup
    {
        return AddonGroup::with(['addons.recipes.ingredient:id,name', 'addons.recipes.unit:id,name,short_name'])
            ->findOrFail($id);
    }

    public function create(array $data): AddonGroup
    {
        return AddonGroup::create($data);
    }

    public function update(AddonGroup $group, array $data): void
    {
        $group->update($data);
    }

    public function delete(AddonGroup $group): void
    {
        $group->delete();
    }

    public function toggleStatus(AddonGroup $group): void
    {
        $group->update(['is_active' => ! $group->is_active]);
    }

    public function listAddons(array $filters): array
    {
        $query = Addon::with('group:id,name')
            ->when($filters['search'] !== '', fn ($b) => $b->where('name', 'like', '%'.$filters['search'].'%'))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $addons = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('addons', 'filters');
    }

    public function findAddon(int $id): Addon
    {
        return Addon::with(['group:id,name,is_required,min_select,max_select,is_active,sort_order', 'recipes.ingredient:id,name', 'recipes.unit:id,name,short_name'])
            ->findOrFail($id);
    }

    public function createAddon(array $data): Addon
    {
        return Addon::create($data);
    }

    public function updateAddon(Addon $addon, array $data): void
    {
        $addon->update($data);
    }

    public function deleteAddon(Addon $addon): void
    {
        $addon->delete();
    }

    public function toggleAddonStatus(Addon $addon): void
    {
        $addon->update(['is_active' => ! $addon->is_active]);
    }

    public function attachToFood(int $foodId, int $groupId): FoodAddonGroup
    {
        return FoodAddonGroup::firstOrCreate([
            'food_id'       => $foodId,
            'addon_group_id' => $groupId,
        ]);
    }

    public function detachFromFood(int $foodId, int $groupId): void
    {
        FoodAddonGroup::where('food_id', $foodId)
            ->where('addon_group_id', $groupId)
            ->delete();
    }

    public function syncFoodAddonGroups(int $foodId, array $groupIds): void
    {
        DB::transaction(function () use ($foodId, $groupIds) {
            FoodAddonGroup::where('food_id', $foodId)->delete();

            foreach (array_unique($groupIds) as $groupId) {
                FoodAddonGroup::create([
                    'food_id'        => $foodId,
                    'addon_group_id' => $groupId,
                ]);
            }
        });
    }
}
