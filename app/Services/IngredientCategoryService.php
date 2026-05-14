<?php

namespace App\Services;

use App\Models\IngredientCategory;
use App\Services\Concerns\PaginatesQuery;

class IngredientCategoryService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = IngredientCategory::with('parent')
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('code', 'like', $search));
            })
            ->when($filters['parent_id'] !== '', fn ($b) => $b->where('parent_id', $filters['parent_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $categories = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $parents = IngredientCategory::whereNull('parent_id')->orderBy('name')->get(['id', 'name']);

        return compact('categories', 'parents', 'filters');
    }

    public function getCreateData(): array
    {
        $categories = IngredientCategory::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']);

        return compact('categories');
    }

    public function getEditData(IngredientCategory $category): array
    {
        $categories = IngredientCategory::where('is_active', true)
            ->where('id', '!=', $category->id)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return compact('category', 'categories');
    }

    public function createCategory(array $data): IngredientCategory
    {
        if (empty($data['slug'])) {
            unset($data['slug']);
        }

        return IngredientCategory::create($data);
    }

    public function updateCategory(IngredientCategory $category, array $data): void
    {
        if (empty($data['slug'])) {
            unset($data['slug']);
        }

        $category->update($data);
    }

    public function deleteCategory(IngredientCategory $category): void
    {
        abort_if(
            $category->children()->exists(),
            422,
            'Cannot delete category while it has child categories.'
        );

        abort_if(
            $category->ingredients()->exists(),
            422,
            'Cannot delete category while it has ingredients.'
        );

        $category->delete();
    }

    public function toggleActive(IngredientCategory $category, bool $isActive): void
    {
        $category->update(['is_active' => $isActive]);
    }

}
