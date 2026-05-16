<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\OutletDepartment;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRoleAssignment;
use App\Models\Warehouse;
use App\Services\Concerns\InteractsWithScope;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserRoleAssignmentService
{
    use InteractsWithScope, PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(User $actor, array $filters, array $scope): array
    {
        $actorMinRank = $this->accessControl->getActorMinRank($actor);

        $query = UserRoleAssignment::with(['user', 'role', 'outlet', 'department', 'warehouse', 'assignedBy'])
            ->where('user_id', '!=', $actor->id)
            ->whereHas('user', fn ($q) => $q->where('is_superadmin', false))
            ->when($actorMinRank !== null, fn ($b) => $b->whereHas('role', fn ($q) => $q->where('rank', '>', $actorMinRank)));

        if ($scope['type'] !== 'global') {
            $this->accessControl->applyScopeFilter($query, $scope);
        }

        $query->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->whereHas('user', fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['user_id'] !== '', fn ($b) => $b->where('user_id', $filters['user_id']))
            ->when($filters['role_id'] !== '', fn ($b) => $b->where('role_id', $filters['role_id']))
            ->when($filters['scope_type'] !== '', fn ($b) => $b->where('scope_type', $filters['scope_type']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderByDesc('created_at');

        $assignments = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $users = User::where('is_superadmin', false)
            ->where('id', '!=', $actor->id)
            ->orderBy('name')->get(['id', 'name', 'email']);

        $roles = Role::where('is_active', true)
            ->when($actorMinRank !== null, fn ($q) => $q->where('rank', '>', $actorMinRank))
            ->orderBy('name')->get(['id', 'name', 'slug', 'level']);

        return compact('assignments', 'users', 'roles', 'filters');
    }

    public function getCreateData(User $actor, array $scope): array
    {
        $actorMinRank = $this->accessControl->getActorMinRank($actor);

        $users = $this->accessControl->applyUserScopeFilter(
            User::where('is_superadmin', false)->where('id', '!=', $actor->id),
            $scope
        )->orderBy('name')->get(['id', 'name', 'email']);

        $allowedLevels = match ($scope['type']) {
            'central_warehouse'    => ['central_warehouse'],
            'outlet'               => ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse'],
            'outlet_warehouse'     => ['outlet_warehouse'],
            'outlet_department'    => ['outlet_department', 'department_warehouse'],
            'department_warehouse' => ['department_warehouse'],
            default                => array_keys(config('access_control.scope_types', [])),
        };

        $roles = Role::where('is_active', true)
            ->when($actorMinRank !== null, fn ($q) => $q->where('rank', '>', $actorMinRank))
            ->whereIn('level', $allowedLevels)
            ->orderBy('name')->get(['id', 'name', 'slug', 'level']);

        $isGlobal    = $this->accessControl->hasGlobalScopeRole($actor);
        $outlets     = Outlet::orderBy('name')->get(['id', 'name']);
        $departments = OutletDepartment::orderBy('name')->get(['id', 'outlet_id', 'name']);
        $warehouses  = Warehouse::when(! $isGlobal, fn ($q) => $q->where('type', '!=', 'central'))
            ->orderBy('name')->get(['id', 'outlet_id', 'outlet_department_id', 'name', 'type']);

        return array_merge(
            compact('users', 'roles', 'outlets', 'departments', 'warehouses'),
            $this->resolveScopeProps($actor, $scope),
            ['currentScope' => $this->buildCurrentScope($scope)],
        );
    }

    public function assign(User $actor, array $data): void
    {
        $targetRole   = Role::findOrFail($data['role_id']);
        $outletId     = !empty($data['outlet_id']) ? (int) $data['outlet_id'] : null;
        $departmentId = !empty($data['outlet_department_id']) ? (int) $data['outlet_department_id'] : null;
        $warehouseId  = !empty($data['warehouse_id']) ? (int) $data['warehouse_id'] : null;

        $this->accessControl->authorizeRoleAssignment(
            $actor,
            $targetRole,
            $data['scope_type'],
            $outletId,
            $departmentId,
            $warehouseId,
        );

        DB::transaction(function () use ($actor, $data, $outletId, $warehouseId) {
            UserRoleAssignment::firstOrCreate(
                [
                    'user_id'              => $data['user_id'],
                    'role_id'              => $data['role_id'],
                    'scope_type'           => $data['scope_type'],
                    'outlet_id'            => $outletId,
                    'outlet_department_id' => !empty($data['outlet_department_id']) ? (int) $data['outlet_department_id'] : null,
                    'warehouse_id'         => $warehouseId,
                ],
                [
                    'is_active'   => $data['is_active'] ?? true,
                    'assigned_by' => $actor->id,
                    'starts_at'   => !empty($data['starts_at']) ? $data['starts_at'] : null,
                    'ends_at'     => !empty($data['ends_at']) ? $data['ends_at'] : null,
                ]
            );
        });

        $this->accessControl->clearUserPermissionCache(User::findOrFail($data['user_id']));
    }

    public function toggleActive(UserRoleAssignment $assignment, bool $isActive): void
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();
        $this->accessControl->assertActorCanMutateScopedRecord($actor, $assignment->scope_type, $assignment->outlet_id, $assignment->outlet_department_id, $assignment->warehouse_id);
        $assignment->update(['is_active' => $isActive]);
        /** @var \App\Models\User $assignmentUser */
        $assignmentUser = $assignment->user()->first();
        $this->accessControl->clearUserPermissionCache($assignmentUser);
    }

    public function remove(UserRoleAssignment $assignment): void
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();
        $this->accessControl->assertActorCanMutateScopedRecord($actor, $assignment->scope_type, $assignment->outlet_id, $assignment->outlet_department_id, $assignment->warehouse_id);
        /** @var \App\Models\User $user */
        $user = $assignment->user()->first();
        $assignment->delete();
        $this->accessControl->clearUserPermissionCache($user);
    }
}
