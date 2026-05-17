<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredients\IngredientStockTransfer\DispatchTransferRequest;
use App\Http\Requests\Ingredients\IngredientStockTransfer\ReceiveTransferRequest;
use App\Http\Requests\Ingredients\IngredientStockTransfer\StoreIngredientStockTransferRequest;
use App\Http\Requests\Ingredients\IngredientStockTransfer\UpdateIngredientStockTransferRequest;
use App\Exceptions\InsufficientStockException;
use App\Models\IngredientStockTransfer;
use App\Services\AccessControlService;
use App\Services\IngredientStockTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientStockTransferController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private IngredientStockTransferService $transferService,
        private AccessControlService $accessControl,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'from_warehouse_id', 'to_warehouse_id', 'status', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('ingredient-stock-transfers/index',
            $this->transferService->getIndexData($filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);
        return Inertia::render('ingredient-stock-transfers/create',
            $this->transferService->getCreateData($request->string('from_warehouse_id', '')->toString(), $scope));
    }

    public function store(StoreIngredientStockTransferRequest $request): RedirectResponse
    {
        $transfer = $this->transferService->createTransfer($request->validated(), $request->user()->id);

        return redirect()->route('ingredient-stock-transfers.show', $transfer)
            ->with('success', 'Stock transfer created successfully.');
    }

    public function show(IngredientStockTransfer $ingredientStockTransfer): Response
    {
        return Inertia::render('ingredient-stock-transfers/show',
            $this->transferService->getShowData($ingredientStockTransfer));
    }

    public function edit(Request $request, IngredientStockTransfer $ingredientStockTransfer): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);
        return Inertia::render('ingredient-stock-transfers/edit',
            $this->transferService->getEditData($ingredientStockTransfer, $scope));
    }

    public function update(UpdateIngredientStockTransferRequest $request, IngredientStockTransfer $ingredientStockTransfer): RedirectResponse
    {
        $this->transferService->updateTransfer($ingredientStockTransfer, $request->validated());

        return redirect()->route('ingredient-stock-transfers.show', $ingredientStockTransfer)
            ->with('success', 'Stock transfer updated successfully.');
    }

    public function destroy(IngredientStockTransfer $ingredientStockTransfer): RedirectResponse
    {
        $this->transferService->deleteTransfer($ingredientStockTransfer);

        return redirect()->route('ingredient-stock-transfers.index')
            ->with('success', 'Stock transfer deleted successfully.');
    }

    public function submit(Request $request, IngredientStockTransfer $ingredientStockTransfer): RedirectResponse
    {
        $this->transferService->submit($ingredientStockTransfer);

        return back()->with('success', 'Transfer submitted for approval.');
    }

    public function approve(Request $request, IngredientStockTransfer $ingredientStockTransfer): RedirectResponse
    {
        $this->transferService->approve($ingredientStockTransfer, $request->user()->id);

        return back()->with('success', 'Transfer approved.');
    }

    public function dispatch(DispatchTransferRequest $request, IngredientStockTransfer $ingredientStockTransfer): RedirectResponse
    {
        try {
            $this->transferService->dispatch($ingredientStockTransfer, $request->validated(), $request->user()->id);
        } catch (InsufficientStockException $e) {
            return back()->withErrors(['dispatch' => $e->getMessage()]);
        }

        return redirect()->route('ingredient-stock-transfers.show', $ingredientStockTransfer)
            ->with('success', 'Transfer dispatched. Stock has been deducted from the source warehouse.');
    }

    public function receive(ReceiveTransferRequest $request, IngredientStockTransfer $ingredientStockTransfer): RedirectResponse
    {
        $this->transferService->receive($ingredientStockTransfer, $request->validated(), $request->user()->id);

        return redirect()->route('ingredient-stock-transfers.show', $ingredientStockTransfer)
            ->with('success', 'Stock received into the destination warehouse.');
    }

    public function cancel(Request $request, IngredientStockTransfer $ingredientStockTransfer): RedirectResponse
    {
        $this->transferService->cancel($ingredientStockTransfer);

        return back()->with('success', 'Transfer cancelled.');
    }
}
