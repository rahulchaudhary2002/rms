<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\OutletDepartment;
use App\Services\Concerns\PaginatesQuery;

class OutletDepartmentService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = OutletDepartment::with('outlet')
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q
                    ->where('name', 'like', $search)
                    ->orWhere('code', 'like', $search));
            })
            ->when($filters['outlet_id'] !== '', fn ($b) => $b->where('outlet_id', $filters['outlet_id']))
            ->when($filters['type'] !== '', fn ($b) => $b->where('type', $filters['type']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $departments = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $outlets = Outlet::orderBy('name')->get(['id', 'name']);

        return compact('departments', 'outlets', 'filters');
    }

    public function getCreateData(): array
    {
        $outlets = Outlet::orderBy('name')->get(['id', 'name']);

        return compact('outlets');
    }

    public function getEditData(OutletDepartment $department): array
    {
        $outlets = Outlet::orderBy('name')->get(['id', 'name']);

        return compact('department', 'outlets');
    }

    public function createDepartment(array $data): OutletDepartment
    {
        $data = $this->prepareData($data);

        return OutletDepartment::create($data);
    }

    public function updateDepartment(OutletDepartment $department, array $data): void
    {
        $data = $this->prepareData($data);

        $department->update($data);
    }

    public function deleteDepartment(OutletDepartment $department): void
    {
        $department->delete();
    }

    public function toggleActive(OutletDepartment $department, bool $isActive): void
    {
        $department->update(['is_active' => $isActive]);
    }

    private function prepareData(array $data): array
    {
        if (empty($data['code'])) {
            $data['code'] = null;
        }

        return $data;
    }
}
