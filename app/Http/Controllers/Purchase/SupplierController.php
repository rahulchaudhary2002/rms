<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StoreSupplierRequest;
use App\Http\Requests\Purchase\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Services\Purchase\SupplierService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    use ExtractsFilters;

    public function __construct(private SupplierService $supplierService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'is_active', 'per_page']);

        return Inertia::render('suppliers/index',
            $this->supplierService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('suppliers/create');
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $supplier = $this->supplierService->createSupplier($request->validated());

        return redirect()->route('suppliers.show', $supplier)
            ->with('success', 'Supplier created successfully.');
    }

    public function show(Supplier $supplier): Response
    {
        return Inertia::render('suppliers/show', compact('supplier'));
    }

    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('suppliers/edit', compact('supplier'));
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $this->supplierService->updateSupplier($supplier, $request->validated());

        return redirect()->route('suppliers.show', $supplier)
            ->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $this->supplierService->deleteSupplier($supplier);

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier deleted successfully.');
    }

    public function toggleActive(Request $request, Supplier $supplier): RedirectResponse
    {
        $this->supplierService->toggleActive($supplier, (bool) $request->boolean('is_active'));

        return back()->with('success', 'Supplier status updated.');
    }
}
