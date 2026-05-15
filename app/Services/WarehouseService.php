<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\OutletDepartment;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\Concerns\PaginatesQuery;

class WarehouseService
{
    use PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(array $filters): array
    {
        $query = Warehouse::with(['outlet', 'department'])
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

        $warehouseList = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $outlets     = Outlet::orderBy('name')->get(['id', 'name']);
        $departments = OutletDepartment::orderBy('name')->get(['id', 'outlet_id', 'name']);

        return compact('warehouseList', 'outlets', 'departments', 'filters');
    }

    public function getCreateData(): array
    {
        $outlets     = Outlet::orderBy('name')->get(['id', 'name']);
        $departments = OutletDepartment::orderBy('name')->get(['id', 'outlet_id', 'name']);

        return compact('outlets', 'departments');
    }

    public function getEditData(Warehouse $warehouse): array
    {
        $outlets     = Outlet::orderBy('name')->get(['id', 'name']);
        $departments = OutletDepartment::orderBy('name')->get(['id', 'outlet_id', 'name']);

        return compact('warehouse', 'outlets', 'departments');
    }

    public function createWarehouse(User $actor, array $data): Warehouse
    {
        if (! $this->accessControl->isSuperAdmin($actor) && ! $this->accessControl->userHasPermission($actor, 'warehouses-create')) {
            abort(403, 'You do not have permission to create warehouses.');
        }

        if (! $this->accessControl->hasGlobalScopeRole($actor) && ! empty($data['outlet_id'])) {
            $allowedScopes = $this->accessControl->resolveAllowedScopes($actor);

            if ($allowedScopes !== null && ! in_array((int) $data['outlet_id'], $allowedScopes['outlet'], true)) {
                abort(403, 'You cannot create a warehouse in this outlet.');
            }
        }

        return Warehouse::create($this->prepareData($data));
    }

    public function updateWarehouse(Warehouse $warehouse, array $data): void
    {
        $warehouse->update($this->prepareData($data));
    }

    public function deleteWarehouse(Warehouse $warehouse): void
    {
        $warehouse->delete();
    }

    public function toggleActive(Warehouse $warehouse, bool $isActive): void
    {
        $warehouse->update(['is_active' => $isActive]);
    }

    private function prepareData(array $data): array
    {
        $data['outlet_id']            = $data['outlet_id'] ?: null;
        $data['outlet_department_id'] = $data['outlet_department_id'] ?: null;

        return $data;
    }
}
