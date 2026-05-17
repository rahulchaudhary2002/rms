<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StoreSupplierPaymentRequest;
use App\Models\SupplierPayment;
use App\Services\Purchase\SupplierPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SupplierPaymentController extends Controller
{
    use ExtractsFilters;

    public function __construct(private SupplierPaymentService $paymentService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'supplier_id', 'payment_method', 'per_page']);

        return Inertia::render('supplier-payments/index',
            $this->paymentService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('supplier-payments/create',
            $this->paymentService->getCreateData());
    }

    public function store(StoreSupplierPaymentRequest $request): RedirectResponse
    {
        try {
            $payment = $this->paymentService->createPayment($request->validated(), $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['payment' => $e->getMessage()])->withInput();
        }

        return redirect()->route('supplier-payments.show', $payment)
            ->with('success', 'Payment recorded successfully.');
    }

    public function show(SupplierPayment $supplierPayment): Response
    {
        return Inertia::render('supplier-payments/show',
            $this->paymentService->getShowData($supplierPayment));
    }

    public function destroy(SupplierPayment $supplierPayment): RedirectResponse
    {
        $this->paymentService->deletePayment($supplierPayment);

        return redirect()->route('supplier-payments.index')
            ->with('success', 'Payment deleted successfully.');
    }

    public function invoices(Request $request): JsonResponse
    {
        $supplierId = $request->integer('supplier_id');
        $invoices   = $this->paymentService->getInvoicesForSupplier($supplierId);

        return response()->json($invoices);
    }
}
