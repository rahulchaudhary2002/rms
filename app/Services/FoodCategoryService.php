<?php

namespace App\Services;

use App\Models\FoodCategory;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FoodCategoryService
{
    use PaginatesQuery;

    public function list(array $filters): array
    {
        $query = FoodCategory::with('parent:id,name')
            ->withCount('foods')
            ->when($filters['search'] !== '', fn ($b) => $b->where('name', 'like', '%'.$filters['search'].'%'))
            ->when($filters['parent_id'] !== '', fn ($b) => $b->where('parent_id', $filters['parent_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('sort_order')
            ->orderBy('name');

        $categories = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('categories', 'filters');
    }

    public function allForSelect(): \Illuminate\Database\Eloquent\Collection
    {
        return FoodCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);
    }

    public function find(int $id): FoodCategory
    {
        return FoodCategory::with(['parent:id,name', 'children:id,name,parent_id'])->findOrFail($id);
    }

    public function create(array $data): FoodCategory
    {
        if (($data['image'] ?? null) instanceof UploadedFile) {
            $data['image'] = $data['image']->store('food-categories', 'public');
        }

        return FoodCategory::create($data);
    }

    public function update(FoodCategory $category, array $data): void
    {
        if (($data['image'] ?? null) instanceof UploadedFile) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }

            $data['image'] = $data['image']->store('food-categories', 'public');
        } elseif ($data['remove_image'] ?? false) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }

            $data['image'] = null;
        }

        unset($data['remove_image']);

        $category->update($data);
    }

    public function delete(FoodCategory $category): void
    {
        $category->delete();
    }

    public function toggleStatus(FoodCategory $category): void
    {
        $category->update(['is_active' => ! $category->is_active]);
    }
}
