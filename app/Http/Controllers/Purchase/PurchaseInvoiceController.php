<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StorePurchaseInvoiceRequest;
use App\Http\Requests\Purchase\UpdatePurchaseInvoiceRequest;
use App\Models\PurchaseInvoice;
use App\Services\Purchase\PurchaseInvoiceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PurchaseInvoiceController extends Controller
{
    use ExtractsFilters;

    public function __construct(private PurchaseInvoiceService $invoiceService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'supplier_id', 'status', 'per_page']);

        return Inertia::render('purchase-invoices/index',
            $this->invoiceService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('purchase-invoices/create',
            $this->invoiceService->getCreateData());
    }

    public function store(StorePurchaseInvoiceRequest $request): RedirectResponse
    {
        $invoice = $this->invoiceService->createInvoice($request->validated(), $request->user()->id);

        return redirect()->route('purchase-invoices.show', $invoice)
            ->with('success', 'Purchase invoice created successfully.');
    }

    public function show(PurchaseInvoice $purchaseInvoice): Response
    {
        return Inertia::render('purchase-invoices/show',
            $this->invoiceService->getShowData($purchaseInvoice));
    }

    public function edit(PurchaseInvoice $purchaseInvoice): Response
    {
        return Inertia::render('purchase-invoices/edit',
            $this->invoiceService->getEditData($purchaseInvoice));
    }

    public function update(UpdatePurchaseInvoiceRequest $request, PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        $this->invoiceService->updateInvoice($purchaseInvoice, $request->validated());

        return redirect()->route('purchase-invoices.show', $purchaseInvoice)
            ->with('success', 'Purchase invoice updated successfully.');
    }

    public function destroy(PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        $this->invoiceService->deleteInvoice($purchaseInvoice);

        return redirect()->route('purchase-invoices.index')
            ->with('success', 'Purchase invoice deleted successfully.');
    }

    public function cancel(PurchaseInvoice $purchaseInvoice): RedirectResponse
    {
        try {
            $this->invoiceService->cancel($purchaseInvoice);
        } catch (RuntimeException $e) {
            return back()->withErrors(['cancel' => $e->getMessage()]);
        }

        return back()->with('success', 'Purchase invoice cancelled.');
    }
}
