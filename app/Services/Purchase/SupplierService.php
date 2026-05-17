<?php

namespace App\Services\Purchase;

use App\Models\Supplier;
use App\Services\Concerns\PaginatesQuery;

class SupplierService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = Supplier::query()
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%' . $filters['search'] . '%';
                $b->where(fn ($q) => $q
                    ->where('name', 'like', $search)
                    ->orWhere('code', 'like', $search)
                    ->orWhere('phone', 'like', $search)
                    ->orWhere('email', 'like', $search)
                );
            })
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === '1'))
            ->orderBy('name');

        $suppliers = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('suppliers', 'filters');
    }

    public function createSupplier(array $data): Supplier
    {
        return Supplier::create($data);
    }

    public function updateSupplier(Supplier $supplier, array $data): void
    {
        $supplier->update($data);
    }

    public function deleteSupplier(Supplier $supplier): void
    {
        $supplier->delete();
    }

    public function toggleActive(Supplier $supplier, bool $isActive): void
    {
        $supplier->update(['is_active' => $isActive]);
    }
}
