<?php

namespace App\Http\Controllers\Purchase;

use App\Exceptions\InsufficientStockException;
use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StorePurchaseReturnRequest;
use App\Http\Requests\Purchase\UpdatePurchaseReturnRequest;
use App\Models\PurchaseReturn;
use App\Services\Purchase\PurchaseReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PurchaseReturnController extends Controller
{
    use ExtractsFilters;

    public function __construct(private PurchaseReturnService $returnService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'supplier_id', 'warehouse_id', 'status', 'per_page']);

        return Inertia::render('purchase-returns/index',
            $this->returnService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('purchase-returns/create',
            $this->returnService->getCreateData());
    }

    public function store(StorePurchaseReturnRequest $request): RedirectResponse
    {
        $return = $this->returnService->createReturn($request->validated(), $request->user()->id);

        return redirect()->route('purchase-returns.show', $return)
            ->with('success', 'Purchase return created successfully.');
    }

    public function show(PurchaseReturn $purchaseReturn): Response
    {
        return Inertia::render('purchase-returns/show',
            $this->returnService->getShowData($purchaseReturn));
    }

    public function edit(PurchaseReturn $purchaseReturn): Response
    {
        return Inertia::render('purchase-returns/edit',
            $this->returnService->getEditData($purchaseReturn));
    }

    public function update(UpdatePurchaseReturnRequest $request, PurchaseReturn $purchaseReturn): RedirectResponse
    {
        $this->returnService->updateReturn($purchaseReturn, $request->validated());

        return redirect()->route('purchase-returns.show', $purchaseReturn)
            ->with('success', 'Purchase return updated successfully.');
    }

    public function destroy(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        $this->returnService->deleteReturn($purchaseReturn);

        return redirect()->route('purchase-returns.index')
            ->with('success', 'Purchase return deleted successfully.');
    }

    public function post(Request $request, PurchaseReturn $purchaseReturn): RedirectResponse
    {
        try {
            $this->returnService->post($purchaseReturn, $request->user()->id);
        } catch (InsufficientStockException $e) {
            return back()->withErrors(['post' => $e->getMessage()]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['post' => $e->getMessage()]);
        }

        return redirect()->route('purchase-returns.show', $purchaseReturn)
            ->with('success', 'Purchase return posted. Stock has been adjusted.');
    }

    public function cancel(PurchaseReturn $purchaseReturn): RedirectResponse
    {
        try {
            $this->returnService->cancel($purchaseReturn);
        } catch (RuntimeException $e) {
            return back()->withErrors(['cancel' => $e->getMessage()]);
        }

        return back()->with('success', 'Purchase return cancelled.');
    }
}
