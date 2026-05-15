<?php

namespace App\Http\Controllers\Food;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Food\StoreFoodRequest;
use App\Http\Requests\Food\Food\UpdateFoodRequest;
use App\Models\Food;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Services\AccessControlService;
use App\Services\AddonGroupService;
use App\Services\FoodCategoryService;
use App\Services\FoodService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FoodController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AccessControlService $accessControl,
        private FoodService $service,
        private FoodCategoryService $categoryService,
        private AddonGroupService $addonGroupService,
    ) {}

    public function index(Request $request): Response
    {
        $filters                  = $this->extractFilters($request, ['search', 'category_id', 'item_type', 'food_type', 'outlet_id', 'is_active', 'per_page']);
        $filters['category_id']   = $filters['category_id'] ?: '';
        $filters['item_type']     = $filters['item_type'] ?: '';
        $filters['food_type']     = $filters['food_type'] ?: '';
        $scope                    = $this->accessControl->resolveSessionScope($request);

        $data               = $this->service->list($filters, $scope);
        $data['scopeOutlets']    = $this->service->scopeOutlets($scope);
        $data['categories'] = $this->categoryService->allForSelect();

        return Inertia::render('food/index', $data);
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('food/create', [
            'categories'  => $this->categoryService->allForSelect(),
            'scopeOutlets' => $this->service->scopeOutlets($scope),
        ]);
    }

    public function store(StoreFoodRequest $request): RedirectResponse
    {
        $food = $this->service->create(
            $request->validated() + ['is_active' => $request->boolean('is_active', true)]
        );

        return redirect($request->input('_redirect', route('foods.edit', $food)))
            ->with('success', 'Food item created successfully.');
    }

    public function show(Request $request, Food $food): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('food/show', [
            'food'         => $this->service->find($food->id, $scope),
            'categories'   => $this->categoryService->allForSelect(),
            'scopeOutlets' => $this->service->scopeOutlets($scope),
            'ingredients'  => Ingredient::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'units'        => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']),
            'allFoods'     => Food::where('is_active', true)->orderBy('name')->get(['id', 'name', 'item_type']),
            'addonGroups'  => $this->addonGroupService->allForSelect(),
        ]);
    }

    public function edit(Request $request, Food $food): Response
    {
        return Inertia::render('food/edit', [
            'food'       => $this->service->find($food->id),
            'categories' => $this->categoryService->allForSelect(),
        ]);
    }

    public function update(UpdateFoodRequest $request, Food $food): RedirectResponse
    {
        $this->service->update(
            $food,
            $request->validated() + ['is_active' => $request->boolean('is_active', true)]
        );

        return redirect()->route('foods.show', $food)
            ->with('success', 'Food item updated successfully.');
    }

    public function destroy(Food $food): RedirectResponse
    {
        $this->service->delete($food);

        return redirect()->route('foods.index')
            ->with('success', 'Food item deleted.');
    }

    public function toggleStatus(Food $food): RedirectResponse
    {
        $this->service->toggleStatus($food);

        return back()->with('success', 'Food status updated.');
    }

    public function toggleFeatured(Food $food): RedirectResponse
    {
        $this->service->toggleFeatured($food);

        return back()->with('success', 'Featured status updated.');
    }
}
