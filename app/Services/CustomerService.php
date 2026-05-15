<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerOutlet;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Carbon;

class CustomerService
{
    use PaginatesQuery;

    public function list(array $filters, array $scope): array
    {
        $outletId = $this->outletIdFromScope($scope);

        $query = Customer::query()
            ->withCount('customerOutlets')
            ->when($outletId !== null, fn ($b) => $b->whereHas('customerOutlets', fn ($q) => $q->where('outlet_id', $outletId)))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';

                $b->where(fn ($q) => $q
                    ->where('name', 'like', $search)
                    ->orWhere('phone', 'like', $search)
                    ->orWhere('email', 'like', $search));
            })
            ->when($filters['status'] === 'active', fn ($b) => $b->where('is_active', true))
            ->when($filters['status'] === 'inactive', fn ($b) => $b->where('is_active', false))
            ->latest();

        $customers = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('customers', 'filters');
    }

    public function find(int $id, array $scope): Customer
    {
        $outletId = $this->outletIdFromScope($scope);

        $query = Customer::with(['customerOutlets.outlet:id,name'])
            ->withCount('customerOutlets')
            ->when($outletId !== null, fn ($b) => $b->whereHas('customerOutlets', fn ($q) => $q->where('outlet_id', $outletId)));

        return $query->findOrFail($id);
    }

    public function assertInScope(Customer $customer, array $scope): void
    {
        $outletId = $this->outletIdFromScope($scope);

        if ($outletId !== null && ! $customer->customerOutlets()->where('outlet_id', $outletId)->exists()) {
            abort(403, 'Customer is not in your current scope.');
        }
    }

    private function outletIdFromScope(array $scope): ?int
    {
        if ($scope['type'] === 'outlet') {
            return $scope['scope_id'];
        }

        if ($scope['type'] === 'warehouse') {
            return $scope['outlet_id'];
        }

        return null;
    }

    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    public function update(Customer $customer, array $data): void
    {
        $customer->update($data);
    }

    public function delete(Customer $customer): void
    {
        $customer->delete();
    }

    public function toggleStatus(Customer $customer): void
    {
        $customer->update(['is_active' => ! $customer->is_active]);
    }

    public function attachOutlet(Customer $customer, int $outletId): CustomerOutlet
    {
        return CustomerOutlet::firstOrCreate([
            'customer_id' => $customer->id,
            'outlet_id'   => $outletId,
        ]);
    }

    public function updateOutletVisit(Customer $customer, int $outletId): CustomerOutlet
    {
        $now = Carbon::now();
        $customerOutlet = $this->attachOutlet($customer, $outletId);

        $customerOutlet->forceFill([
            'first_visited_at' => $customerOutlet->first_visited_at ?? $now,
            'last_visited_at'  => $now,
            'visit_count'      => $customerOutlet->visit_count + 1,
        ])->save();

        return $customerOutlet;
    }
}
