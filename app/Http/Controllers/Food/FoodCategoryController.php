<?php

namespace App\Http\Controllers\Food;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Category\StoreFoodCategoryRequest;
use App\Http\Requests\Food\Category\UpdateFoodCategoryRequest;
use App\Models\FoodCategory;
use App\Services\FoodCategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FoodCategoryController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private FoodCategoryService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters              = $this->extractFilters($request, ['search', 'parent_id', 'is_active', 'per_page']);
        $filters['parent_id'] = $filters['parent_id'] ?: '';

        $data                    = $this->service->list($filters);
        $data['parentCategories'] = $this->service->allForSelect();

        return Inertia::render('food/categories/index', $data);
    }

    public function create(): Response
    {
        return Inertia::render('food/categories/create', [
            'parentCategories' => $this->service->allForSelect(),
        ]);
    }

    public function store(StoreFoodCategoryRequest $request): RedirectResponse
    {
        $this->service->create(
            $request->validated() + ['is_active' => $request->boolean('is_active', true)]
        );

        return redirect($request->input('_redirect', route('food-categories.index')))
            ->with('success', 'Category created successfully.');
    }

    public function edit(FoodCategory $foodCategory): Response
    {
        return Inertia::render('food/categories/edit', [
            'category'         => $foodCategory->load('parent:id,name'),
            'parentCategories' => $this->service->allForSelect(),
        ]);
    }

    public function update(UpdateFoodCategoryRequest $request, FoodCategory $foodCategory): RedirectResponse
    {
        $this->service->update(
            $foodCategory,
            $request->validated() + ['is_active' => $request->boolean('is_active', true)]
        );

        return redirect()->route('food-categories.index')
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(FoodCategory $foodCategory): RedirectResponse
    {
        $this->service->delete($foodCategory);

        return redirect()->route('food-categories.index')
            ->with('success', 'Category deleted.');
    }

    public function toggleStatus(FoodCategory $foodCategory): RedirectResponse
    {
        $this->service->toggleStatus($foodCategory);

        return back()->with('success', 'Category status updated.');
    }
}
