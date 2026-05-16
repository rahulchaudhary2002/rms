<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientCategory;
use App\Models\Unit;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class IngredientService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = Ingredient::with(['ingredientCategory', 'baseUnit', 'defaultPurchaseUnit', 'defaultUsageUnit'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q
                    ->where('name', 'like', $search)
                    ->orWhere('code', 'like', $search)
                    ->orWhere('barcode', 'like', $search));
            })
            ->when($filters['ingredient_category_id'] !== '', fn ($b) => $b->where('ingredient_category_id', $filters['ingredient_category_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $ingredients = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $categories = IngredientCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('ingredients', 'categories', 'filters');
    }

    public function getCreateData(): array
    {
        $categories = IngredientCategory::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']);
        $units      = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name', 'type']);

        return compact('categories', 'units');
    }

    public function getEditData(Ingredient $ingredient): array
    {
        $categories = IngredientCategory::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']);
        $units      = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name', 'type']);

        return compact('ingredient', 'categories', 'units');
    }

    public function createIngredient(array $data): Ingredient
    {
        $data = $this->prepareData($data);

        if (($data['image'] ?? null) instanceof UploadedFile) {
            $data['image'] = $data['image']->store('ingredients', 'public');
        }

        return Ingredient::create($data);
    }

    public function updateIngredient(Ingredient $ingredient, array $data): void
    {
        $data = $this->prepareData($data);

        if (($data['image'] ?? null) instanceof UploadedFile) {
            if ($ingredient->image) {
                Storage::disk('public')->delete($ingredient->image);
            }

            $data['image'] = $data['image']->store('ingredients', 'public');
        } elseif ($data['remove_image'] ?? false) {
            if ($ingredient->image) {
                Storage::disk('public')->delete($ingredient->image);
            }

            $data['image'] = null;
        }

        unset($data['remove_image']);

        $ingredient->update($data);
    }

    public function deleteIngredient(Ingredient $ingredient): void
    {
        if ($ingredient->image) {
            Storage::disk('public')->delete($ingredient->image);
        }

        $ingredient->delete();
    }

    public function toggleActive(Ingredient $ingredient, bool $isActive): void
    {
        $ingredient->update(['is_active' => $isActive]);
    }

    private function prepareData(array $data): array
    {
        if (empty($data['slug'])) {
            unset($data['slug']);
        }

        if (! empty($data['track_expiry'])) {
            $data['is_perishable'] = true;
        }

        return $data;
    }
}
