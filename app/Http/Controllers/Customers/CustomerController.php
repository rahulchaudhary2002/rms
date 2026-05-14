<?php

namespace App\Http\Controllers\Customers;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\Customer\StoreCustomerRequest;
use App\Http\Requests\Customers\Customer\UpdateCustomerRequest;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    use ExtractsFilters;

    public function __construct(private CustomerService $customerService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'status', 'per_page']);
        $filters['status'] = $filters['status'] ?: 'all';

        return Inertia::render('customers/index',
            $this->customerService->list($filters));
    }

    public function create(): Response
    {
        return Inertia::render('customers/create');
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $this->customerService->create($request->validated());

        return redirect($request->input('_redirect', route('customers.index')))
            ->with('success', 'Customer created successfully.');
    }

    public function show(Customer $customer): Response
    {
        return Inertia::render('customers/show', [
            'customer' => $this->customerService->find($customer->id),
        ]);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('customers/edit', ['customer' => $customer]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $this->customerService->update($customer, $request->validated());

        return redirect()->route('customers.index')
            ->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $this->customerService->delete($customer);

        return redirect()->route('customers.index')
            ->with('success', 'Customer deleted successfully.');
    }

    public function toggleStatus(Customer $customer): RedirectResponse
    {
        $this->customerService->toggleStatus($customer);

        return redirect()->route('customers.index')
            ->with('success', 'Customer status updated.');
    }
}
