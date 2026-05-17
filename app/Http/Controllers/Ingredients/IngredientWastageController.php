<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredients\IngredientWastage\StoreIngredientWastageRequest;
use App\Http\Requests\Ingredients\IngredientWastage\UpdateIngredientWastageRequest;
use App\Exceptions\InsufficientStockException;
use App\Models\IngredientWastage;
use App\Services\IngredientWastageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientWastageController extends Controller
{
    use ExtractsFilters;

    public function __construct(private IngredientWastageService $wastageService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'warehouse_id', 'status', 'reason', 'per_page']);

        return Inertia::render('ingredient-wastages/index',
            $this->wastageService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('ingredient-wastages/create',
            $this->wastageService->getCreateData());
    }

    public function store(StoreIngredientWastageRequest $request): RedirectResponse
    {
        $wastage = $this->wastageService->createWastage($request->validated(), $request->user()->id);

        return redirect()->route('ingredient-wastages.show', $wastage)
            ->with('success', 'Wastage record created successfully.');
    }

    public function show(IngredientWastage $ingredientWastage): Response
    {
        return Inertia::render('ingredient-wastages/show',
            $this->wastageService->getShowData($ingredientWastage));
    }

    public function edit(IngredientWastage $ingredientWastage): Response
    {
        return Inertia::render('ingredient-wastages/edit',
            $this->wastageService->getEditData($ingredientWastage));
    }

    public function update(UpdateIngredientWastageRequest $request, IngredientWastage $ingredientWastage): RedirectResponse
    {
        $this->wastageService->updateWastage($ingredientWastage, $request->validated());

        return redirect()->route('ingredient-wastages.show', $ingredientWastage)
            ->with('success', 'Wastage record updated successfully.');
    }

    public function destroy(IngredientWastage $ingredientWastage): RedirectResponse
    {
        $this->wastageService->deleteWastage($ingredientWastage);

        return redirect()->route('ingredient-wastages.index')
            ->with('success', 'Wastage record deleted successfully.');
    }

    public function approve(Request $request, IngredientWastage $ingredientWastage): RedirectResponse
    {
        try {
            $this->wastageService->approve($ingredientWastage, $request->user()->id);
        } catch (InsufficientStockException $e) {
            return back()->withErrors(['approve' => $e->getMessage()]);
        }

        return redirect()->route('ingredient-wastages.show', $ingredientWastage)
            ->with('success', 'Wastage approved. Stock has been deducted.');
    }

    public function cancel(Request $request, IngredientWastage $ingredientWastage): RedirectResponse
    {
        $this->wastageService->cancel($ingredientWastage);

        return back()->with('success', 'Wastage record cancelled.');
    }
}
