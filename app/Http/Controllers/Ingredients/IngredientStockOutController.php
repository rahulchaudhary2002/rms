<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredients\IngredientStockOut\StoreIngredientStockOutRequest;
use App\Http\Requests\Ingredients\IngredientStockOut\UpdateIngredientStockOutRequest;
use App\Exceptions\InsufficientStockException;
use App\Models\IngredientStockOut;
use App\Services\AccessControlService;
use App\Services\IngredientStockOutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientStockOutController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private IngredientStockOutService $stockOutService,
        private AccessControlService $accessControl,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'warehouse_id', 'status', 'purpose', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('ingredient-stock-outs/index',
            $this->stockOutService->getIndexData($filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);
        return Inertia::render('ingredient-stock-outs/create',
            $this->stockOutService->getCreateData($request->string('warehouse_id', '')->toString(), $scope));
    }

    public function store(StoreIngredientStockOutRequest $request): RedirectResponse
    {
        $stockOut = $this->stockOutService->createStockOut($request->validated(), $request->user()->id);

        return redirect()->route('ingredient-stock-outs.show', $stockOut)
            ->with('success', 'Stock out record created successfully.');
    }

    public function show(IngredientStockOut $ingredientStockOut): Response
    {
        return Inertia::render('ingredient-stock-outs/show',
            $this->stockOutService->getShowData($ingredientStockOut));
    }

    public function edit(Request $request, IngredientStockOut $ingredientStockOut): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);
        return Inertia::render('ingredient-stock-outs/edit',
            $this->stockOutService->getEditData($ingredientStockOut, $scope));
    }

    public function update(UpdateIngredientStockOutRequest $request, IngredientStockOut $ingredientStockOut): RedirectResponse
    {
        $this->stockOutService->updateStockOut($ingredientStockOut, $request->validated());

        return redirect()->route('ingredient-stock-outs.show', $ingredientStockOut)
            ->with('success', 'Stock out record updated successfully.');
    }

    public function destroy(IngredientStockOut $ingredientStockOut): RedirectResponse
    {
        $this->stockOutService->deleteStockOut($ingredientStockOut);

        return redirect()->route('ingredient-stock-outs.index')
            ->with('success', 'Stock out record deleted successfully.');
    }

    public function approve(Request $request, IngredientStockOut $ingredientStockOut): RedirectResponse
    {
        try {
            $this->stockOutService->approve($ingredientStockOut, $request->user()->id);
        } catch (InsufficientStockException $e) {
            return back()->withErrors(['approve' => $e->getMessage()]);
        }

        return redirect()->route('ingredient-stock-outs.show', $ingredientStockOut)
            ->with('success', 'Stock out approved. Stock has been deducted.');
    }

    public function cancel(Request $request, IngredientStockOut $ingredientStockOut): RedirectResponse
    {
        $this->stockOutService->cancel($ingredientStockOut);

        return back()->with('success', 'Stock out record cancelled.');
    }
}
