<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredients\IngredientCategory\StoreIngredientCategoryRequest;
use App\Http\Requests\Ingredients\IngredientCategory\UpdateIngredientCategoryRequest;
use App\Http\Requests\Ingredients\ToggleActiveRequest;
use App\Models\IngredientCategory;
use App\Services\IngredientCategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientCategoryController extends Controller
{
    use ExtractsFilters;

    public function __construct(private IngredientCategoryService $categoryService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'parent_id', 'is_active', 'per_page']);

        return Inertia::render('ingredient-categories/index',
            $this->categoryService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('ingredient-categories/create',
            $this->categoryService->getCreateData());
    }

    public function store(StoreIngredientCategoryRequest $request): RedirectResponse
    {
        $this->categoryService->createCategory($request->validated());

        return redirect($request->input('_redirect', route('ingredient-categories.index')))
            ->with('success', 'Ingredient category created successfully.');
    }

    public function edit(IngredientCategory $ingredientCategory): Response
    {
        return Inertia::render('ingredient-categories/edit',
            $this->categoryService->getEditData($ingredientCategory));
    }

    public function update(UpdateIngredientCategoryRequest $request, IngredientCategory $ingredientCategory): RedirectResponse
    {
        $this->categoryService->updateCategory($ingredientCategory, $request->validated());

        return redirect()->route('ingredient-categories.index')
            ->with('success', 'Ingredient category updated successfully.');
    }

    public function destroy(IngredientCategory $ingredientCategory): RedirectResponse
    {
        $this->categoryService->deleteCategory($ingredientCategory);

        return redirect()->route('ingredient-categories.index')
            ->with('success', 'Ingredient category deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, IngredientCategory $ingredientCategory): RedirectResponse
    {
        $this->categoryService->toggleActive($ingredientCategory, $request->boolean('is_active'));

        return redirect()->route('ingredient-categories.index')
            ->with('success', 'Ingredient category status updated.');
    }
}
