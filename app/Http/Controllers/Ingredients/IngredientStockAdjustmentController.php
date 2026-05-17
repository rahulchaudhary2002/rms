<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredients\IngredientStockAdjustment\StoreIngredientStockAdjustmentRequest;
use App\Http\Requests\Ingredients\IngredientStockAdjustment\UpdateIngredientStockAdjustmentRequest;
use App\Exceptions\InsufficientStockException;
use App\Models\IngredientStockAdjustment;
use App\Services\AccessControlService;
use App\Services\IngredientStockAdjustmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientStockAdjustmentController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private IngredientStockAdjustmentService $adjustmentService,
        private AccessControlService $accessControl,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'warehouse_id', 'status', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('ingredient-stock-adjustments/index',
            $this->adjustmentService->getIndexData($filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);
        return Inertia::render('ingredient-stock-adjustments/create',
            $this->adjustmentService->getCreateData($request->string('warehouse_id')->toString(), $scope));
    }

    public function store(StoreIngredientStockAdjustmentRequest $request): RedirectResponse
    {
        $adjustment = $this->adjustmentService->createAdjustment($request->validated(), $request->user()->id);

        return redirect()->route('ingredient-stock-adjustments.show', $adjustment)
            ->with('success', 'Stock adjustment created successfully.');
    }

    public function show(IngredientStockAdjustment $ingredientStockAdjustment): Response
    {
        return Inertia::render('ingredient-stock-adjustments/show',
            $this->adjustmentService->getShowData($ingredientStockAdjustment));
    }

    public function edit(Request $request, IngredientStockAdjustment $ingredientStockAdjustment): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);
        return Inertia::render('ingredient-stock-adjustments/edit',
            $this->adjustmentService->getEditData($ingredientStockAdjustment, $scope));
    }

    public function update(UpdateIngredientStockAdjustmentRequest $request, IngredientStockAdjustment $ingredientStockAdjustment): RedirectResponse
    {
        $this->adjustmentService->updateAdjustment($ingredientStockAdjustment, $request->validated());

        return redirect()->route('ingredient-stock-adjustments.show', $ingredientStockAdjustment)
            ->with('success', 'Stock adjustment updated successfully.');
    }

    public function destroy(IngredientStockAdjustment $ingredientStockAdjustment): RedirectResponse
    {
        $this->adjustmentService->deleteAdjustment($ingredientStockAdjustment);

        return redirect()->route('ingredient-stock-adjustments.index')
            ->with('success', 'Stock adjustment deleted successfully.');
    }

    public function approve(Request $request, IngredientStockAdjustment $ingredientStockAdjustment): RedirectResponse
    {
        try {
            $this->adjustmentService->approve($ingredientStockAdjustment, $request->user()->id);
        } catch (InsufficientStockException $e) {
            return back()->withErrors(['approve' => $e->getMessage()]);
        }

        return redirect()->route('ingredient-stock-adjustments.show', $ingredientStockAdjustment)
            ->with('success', 'Adjustment approved. Stock has been updated.');
    }

    public function cancel(Request $request, IngredientStockAdjustment $ingredientStockAdjustment): RedirectResponse
    {
        $this->adjustmentService->cancel($ingredientStockAdjustment);

        return back()->with('success', 'Stock adjustment cancelled.');
    }
}
