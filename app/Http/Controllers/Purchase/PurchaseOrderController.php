<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StorePurchaseOrderRequest;
use App\Http\Requests\Purchase\UpdatePurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Services\Purchase\PurchaseOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    use ExtractsFilters;

    public function __construct(private PurchaseOrderService $orderService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'supplier_id', 'warehouse_id', 'status', 'per_page']);

        return Inertia::render('purchase-orders/index',
            $this->orderService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('purchase-orders/create',
            $this->orderService->getCreateData());
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $order = $this->orderService->createOrder($request->validated(), $request->user()->id);

        return redirect()->route('purchase-orders.show', $order)
            ->with('success', 'Purchase order created successfully.');
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        return Inertia::render('purchase-orders/show',
            $this->orderService->getShowData($purchaseOrder));
    }

    public function edit(PurchaseOrder $purchaseOrder): Response
    {
        return Inertia::render('purchase-orders/edit',
            $this->orderService->getEditData($purchaseOrder));
    }

    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->orderService->updateOrder($purchaseOrder, $request->validated());

        return redirect()->route('purchase-orders.show', $purchaseOrder)
            ->with('success', 'Purchase order updated successfully.');
    }

    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->orderService->deleteOrder($purchaseOrder);

        return redirect()->route('purchase-orders.index')
            ->with('success', 'Purchase order deleted successfully.');
    }

    public function approve(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->orderService->approve($purchaseOrder, $request->user()->id);

        return back()->with('success', 'Purchase order approved.');
    }

    public function cancel(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->orderService->cancel($purchaseOrder);

        return back()->with('success', 'Purchase order cancelled.');
    }
}
