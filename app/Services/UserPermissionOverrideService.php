<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\OutletDepartment;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserPermissionOverride;
use App\Models\Warehouse;
use App\Services\Concerns\InteractsWithScope;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserPermissionOverrideService
{
    use InteractsWithScope, PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(User $actor, array $filters, array $scope): array
    {
        $actorPermissionIds = $this->accessControl->getActorPermissionIds($actor);

        $query = UserPermissionOverride::with(['user', 'permission', 'outlet', 'department', 'warehouse', 'assignedBy'])
            ->where('user_id', '!=', $actor->id)
            ->whereHas('user', fn ($q) => $q->where('is_superadmin', false))
            ->when($actorPermissionIds !== null, fn ($b) => $b->whereIn('permission_id', $actorPermissionIds));

        $this->accessControl->applyScopeFilter($query, $scope);

        $query->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->whereHas('user', fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['user_id'] !== '', fn ($b) => $b->where('user_id', $filters['user_id']))
            ->when($filters['permission_id'] !== '', fn ($b) => $b->where('permission_id', $filters['permission_id']))
            ->when($filters['scope_type'] !== '', fn ($b) => $b->where('scope_type', $filters['scope_type']))
            ->when($filters['effect'] !== '', fn ($b) => $b->where('effect', $filters['effect']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderByDesc('created_at');

        $overrides = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $users = User::where('is_superadmin', false)
            ->where('id', '!=', $actor->id)
            ->orderBy('name')->get(['id', 'name', 'email']);

        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);

        return compact('overrides', 'users', 'permissions', 'filters');
    }

    public function getCreateData(User $actor, array $scope): array
    {
        $actorPermissionIds = $this->accessControl->getActorPermissionIds($actor);

        $users = $this->accessControl->applyUserScopeFilter(
            User::where('is_superadmin', false)->where('id', '!=', $actor->id),
            $scope
        )->orderBy('name')->get(['id', 'name', 'email']);

        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);

        $outlets     = Outlet::orderBy('name')->get(['id', 'name']);
        $departments = OutletDepartment::orderBy('name')->get(['id', 'outlet_id', 'name']);
        $warehouses  = Warehouse::orderBy('name')->get(['id', 'outlet_id', 'outlet_department_id', 'name', 'type']);

        return array_merge(
            compact('users', 'permissions', 'outlets', 'departments', 'warehouses'),
            $this->resolveScopeProps($actor, $scope)
        );
    }

    public function save(User $actor, array $data): void
    {
        $this->accessControl->assertActorCanManagePermission($actor, (int) $data['permission_id']);

        $outletId           = !empty($data['outlet_id']) ? (int) $data['outlet_id'] : null;
        $outletDepartmentId = !empty($data['outlet_department_id']) ? (int) $data['outlet_department_id'] : null;
        $warehouseId        = !empty($data['warehouse_id']) ? (int) $data['warehouse_id'] : null;

        DB::transaction(function () use ($actor, $data, $outletId, $outletDepartmentId, $warehouseId) {
            UserPermissionOverride::updateOrCreate(
                [
                    'user_id'              => $data['user_id'],
                    'permission_id'        => $data['permission_id'],
                    'scope_type'           => $data['scope_type'],
                    'outlet_id'            => $outletId,
                    'outlet_department_id' => $outletDepartmentId,
                    'warehouse_id'         => $warehouseId,
                ],
                [
                    'effect'      => $data['effect'],
                    'reason'      => $data['reason'] ?? null,
                    'is_active'   => $data['is_active'] ?? true,
                    'assigned_by' => $actor->id,
                    'starts_at'   => !empty($data['starts_at']) ? $data['starts_at'] : null,
                    'ends_at'     => !empty($data['ends_at']) ? $data['ends_at'] : null,
                ]
            );
        });

        $this->accessControl->clearUserPermissionCache(User::findOrFail($data['user_id']));
    }

    public function toggleActive(UserPermissionOverride $override, bool $isActive): void
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();
        $this->accessControl->assertActorCanMutateScopedRecord($actor, $override->scope_type, $override->outlet_id, $override->warehouse_id);
        $override->update(['is_active' => $isActive]);
        /** @var \App\Models\User $overrideUser */
        $overrideUser = $override->user()->first();
        $this->accessControl->clearUserPermissionCache($overrideUser);
    }

    public function remove(UserPermissionOverride $override): void
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();
        $this->accessControl->assertActorCanMutateScopedRecord($actor, $override->scope_type, $override->outlet_id, $override->warehouse_id);
        /** @var \App\Models\User $user */
        $user = $override->user()->first();
        $override->delete();
        $this->accessControl->clearUserPermissionCache($user);
    }

}
