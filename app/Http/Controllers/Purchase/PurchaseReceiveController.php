<?php

namespace App\Http\Controllers\Purchase;

use App\Exceptions\InsufficientStockException;
use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StorePurchaseReceiveRequest;
use App\Http\Requests\Purchase\UpdatePurchaseReceiveRequest;
use App\Models\PurchaseReceive;
use App\Services\Purchase\PurchaseReceiveService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PurchaseReceiveController extends Controller
{
    use ExtractsFilters;

    public function __construct(private PurchaseReceiveService $receiveService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'supplier_id', 'warehouse_id', 'status', 'per_page']);

        return Inertia::render('purchase-receives/index',
            $this->receiveService->getIndexData($filters));
    }

    public function create(Request $request): Response
    {
        return Inertia::render('purchase-receives/create',
            $this->receiveService->getCreateData($request->string('purchase_order_id', '')->toString() ?: null));
    }

    public function store(StorePurchaseReceiveRequest $request): RedirectResponse
    {
        try {
            $receive = $this->receiveService->createReceive($request->validated(), $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['receive' => $e->getMessage()])->withInput();
        }

        return redirect()->route('purchase-receives.show', $receive)
            ->with('success', 'Purchase receive created successfully.');
    }

    public function show(PurchaseReceive $purchaseReceive): Response
    {
        return Inertia::render('purchase-receives/show',
            $this->receiveService->getShowData($purchaseReceive));
    }

    public function edit(PurchaseReceive $purchaseReceive): Response
    {
        return Inertia::render('purchase-receives/edit',
            $this->receiveService->getEditData($purchaseReceive));
    }

    public function update(UpdatePurchaseReceiveRequest $request, PurchaseReceive $purchaseReceive): RedirectResponse
    {
        try {
            $this->receiveService->updateReceive($purchaseReceive, $request->validated());
        } catch (RuntimeException $e) {
            return back()->withErrors(['receive' => $e->getMessage()])->withInput();
        }

        return redirect()->route('purchase-receives.show', $purchaseReceive)
            ->with('success', 'Purchase receive updated successfully.');
    }

    public function destroy(PurchaseReceive $purchaseReceive): RedirectResponse
    {
        $this->receiveService->deleteReceive($purchaseReceive);

        return redirect()->route('purchase-receives.index')
            ->with('success', 'Purchase receive deleted successfully.');
    }

    public function post(Request $request, PurchaseReceive $purchaseReceive): RedirectResponse
    {
        try {
            $this->receiveService->post($purchaseReceive, $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['post' => $e->getMessage()]);
        }

        return redirect()->route('purchase-receives.show', $purchaseReceive)
            ->with('success', 'Purchase receive posted. Stock has been updated.');
    }

    public function cancel(PurchaseReceive $purchaseReceive): RedirectResponse
    {
        try {
            $this->receiveService->cancel($purchaseReceive);
        } catch (RuntimeException $e) {
            return back()->withErrors(['cancel' => $e->getMessage()]);
        }

        return back()->with('success', 'Purchase receive cancelled.');
    }
}
