<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class RoleService
{
    use PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    // ─── Roles ────────────────────────────────────────────────────────────────

    public function getRolesIndexData(User $actor, array $filters): array
    {
        $actorMinRank = $this->accessControl->getActorMinRank($actor);

        $query = Role::query()
            ->withCount(['permissions', 'userRoleAssignments'])
            ->when($actorMinRank !== null, fn ($b) => $b->where('rank', '>', $actorMinRank))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('slug', 'like', $search));
            })
            ->when($filters['level'] !== '', fn ($b) => $b->where('level', $filters['level']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $roles = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('roles', 'filters');
    }

    public function getRoleShowData(User $actor, Role $role): array
    {
        $this->accessControl->assertActorCanManageRole($actor, $role);

        $role->load('permissions');

        $actorPermissionIds = $this->accessControl->getActorPermissionIds($actor);

        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')
            ->get(['id', 'name', 'slug', 'module', 'action', 'level']);

        return compact('role', 'permissions');
    }

    public function updateRole(Role $role, array $data): void
    {
        abort_if($role->is_system, 403, 'System roles cannot be modified.');

        $role->update($data);
        $this->accessControl->clearRoleUsersCache($role);
    }

    public function deleteRole(Role $role): void
    {
        abort_if($role->is_system, 403, 'System roles cannot be deleted.');

        $this->accessControl->clearRoleUsersCache($role);
        $role->delete();
    }

    // ─── Role Permissions ─────────────────────────────────────────────────────

    public function getRolePermissionsIndexData(User $actor, array $filters): array
    {
        $actorMinRank       = $this->accessControl->getActorMinRank($actor);
        $actorPermissionIds = $this->accessControl->getActorPermissionIds($actor);

        $query = Role::with(['permissions' => function ($q) use ($actorPermissionIds) {
            $q->when($actorPermissionIds !== null, fn ($q2) => $q2->whereIn('permissions.id', $actorPermissionIds))
              ->orderBy('module')->orderBy('action');
        }])
            ->withCount(['permissions' => fn ($q) => $q->when(
                $actorPermissionIds !== null,
                fn ($q2) => $q2->whereIn('permissions.id', $actorPermissionIds)
            )])
            ->when($actorMinRank !== null, fn ($b) => $b->where('rank', '>', $actorMinRank))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('slug', 'like', $search));
            })
            ->when($filters['level'] !== '', fn ($b) => $b->where('level', $filters['level']))
            ->orderBy('name');

        $roles = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')
            ->get(['id', 'name', 'slug', 'module', 'action', 'level']);

        return compact('roles', 'permissions', 'filters');
    }

    public function assignPermissionsToRole(User $actor, Role $role, array $permissionIds): void
    {
        $this->accessControl->assertActorCanManageRole($actor, $role);

        $actorPermissionIds = $this->accessControl->getActorPermissionIds($actor);

        if ($actorPermissionIds !== null) {
            $permissionIds = array_values(array_intersect($permissionIds, $actorPermissionIds));
        }

        DB::transaction(fn () => $role->permissions()->syncWithoutDetaching($permissionIds));

        $this->accessControl->clearRoleUsersCache($role);
    }

    public function removePermissionFromRole(User $actor, Role $role, int $permissionId): void
    {
        $this->accessControl->assertActorCanManageRole($actor, $role);
        $this->accessControl->assertActorCanManagePermission($actor, $permissionId);

        DB::transaction(fn () => $role->permissions()->detach($permissionId));

        $this->accessControl->clearRoleUsersCache($role);
    }
}
