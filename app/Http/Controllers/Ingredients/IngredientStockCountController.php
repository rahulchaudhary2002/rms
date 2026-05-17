<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredients\IngredientStockCount\StoreIngredientStockCountRequest;
use App\Http\Requests\Ingredients\IngredientStockCount\UpdateIngredientStockCountRequest;
use App\Models\IngredientStockCount;
use App\Services\IngredientStockCountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientStockCountController extends Controller
{
    use ExtractsFilters;

    public function __construct(private IngredientStockCountService $countService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'warehouse_id', 'status', 'per_page']);

        return Inertia::render('ingredient-stock-counts/index',
            $this->countService->getIndexData($filters));
    }

    public function create(Request $request): Response
    {
        return Inertia::render('ingredient-stock-counts/create',
            $this->countService->getCreateData($request->string('warehouse_id')->toString()));
    }

    public function store(StoreIngredientStockCountRequest $request): RedirectResponse
    {
        $count = $this->countService->createCount($request->validated(), $request->user()->id);

        return redirect()->route('ingredient-stock-counts.show', $count)
            ->with('success', 'Stock count created successfully.');
    }

    public function show(IngredientStockCount $ingredientStockCount): Response
    {
        return Inertia::render('ingredient-stock-counts/show',
            $this->countService->getShowData($ingredientStockCount));
    }

    public function edit(IngredientStockCount $ingredientStockCount): Response
    {
        return Inertia::render('ingredient-stock-counts/edit',
            $this->countService->getEditData($ingredientStockCount));
    }

    public function update(UpdateIngredientStockCountRequest $request, IngredientStockCount $ingredientStockCount): RedirectResponse
    {
        $this->countService->updateCount($ingredientStockCount, $request->validated());

        return redirect()->route('ingredient-stock-counts.show', $ingredientStockCount)
            ->with('success', 'Stock count updated successfully.');
    }

    public function destroy(IngredientStockCount $ingredientStockCount): RedirectResponse
    {
        $this->countService->deleteCount($ingredientStockCount);

        return redirect()->route('ingredient-stock-counts.index')
            ->with('success', 'Stock count deleted successfully.');
    }

    public function startCounting(Request $request, IngredientStockCount $ingredientStockCount): RedirectResponse
    {
        $this->countService->startCounting($ingredientStockCount);

        return redirect()->route('ingredient-stock-counts.show', $ingredientStockCount)
            ->with('success', 'Stock count started. Enter counted quantities.');
    }

    public function complete(Request $request, IngredientStockCount $ingredientStockCount): RedirectResponse
    {
        $this->countService->complete($ingredientStockCount, $request->user()->id);

        return redirect()->route('ingredient-stock-counts.show', $ingredientStockCount)
            ->with('success', 'Stock count completed successfully.');
    }

    public function generateAdjustment(Request $request, IngredientStockCount $ingredientStockCount): RedirectResponse
    {
        $adjustment = $this->countService->generateAdjustment($ingredientStockCount, $request->user()->id);

        return redirect()->route('ingredient-stock-adjustments.show', $adjustment)
            ->with('success', 'Adjustment draft created from stock count. Review and approve to apply stock changes.');
    }

    public function markAdjusted(IngredientStockCount $ingredientStockCount): RedirectResponse
    {
        $this->countService->markAdjusted($ingredientStockCount);

        return redirect()->route('ingredient-stock-counts.show', $ingredientStockCount)
            ->with('success', 'Stock count marked as adjusted.');
    }

    public function cancel(IngredientStockCount $ingredientStockCount): RedirectResponse
    {
        $this->countService->cancel($ingredientStockCount);

        return back()->with('success', 'Stock count cancelled.');
    }
}
