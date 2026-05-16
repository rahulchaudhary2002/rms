<?php

namespace App\Services;

use App\Models\Permission;
use App\Services\AccessControlService;
use App\Services\Concerns\PaginatesQuery;

class PermissionService
{
    use PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(array $filters, string $currentScopeType = 'global'): array
    {
        $allowedLevels = $this->accessControl->resolveAllowedLevelsForScope($currentScopeType);

        $query = Permission::query()
            ->when($allowedLevels !== null, fn ($b) => $b->whereIn('level', $allowedLevels))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('slug', 'like', $search));
            })
            ->when($filters['module'] !== '', fn ($b) => $b->where('module', $filters['module']))
            ->when($filters['action'] !== '', fn ($b) => $b->where('action', $filters['action']))
            ->when($filters['level'] !== '', fn ($b) => $b->where('level', $filters['level']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('module')
            ->orderBy('action');

        $permissions = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $modules = Permission::distinct()->orderBy('module')->pluck('module');
        $actions = Permission::distinct()->orderBy('action')->pluck('action');

        return compact('permissions', 'modules', 'actions', 'filters');
    }

    public function createPermission(array $data): void
    {
        Permission::create($data);
    }

    public function updatePermission(Permission $permission, array $data): void
    {
        abort_if($permission->is_system, 403, 'System permissions cannot be modified.');

        $permission->update($data);
    }

    public function deletePermission(Permission $permission): void
    {
        abort_if($permission->is_system, 403, 'System permissions cannot be deleted.');

        $permission->delete();
    }
}
