<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\OutletDepartment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\Concerns\InteractsWithScope;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\Hash;

class UserService
{
    use InteractsWithScope, PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(User $actor, array $filters, array $scope): array
    {
        $query = $this->accessControl->applyUserScopeFilter(
            User::query()
                ->where('is_superadmin', false)
                ->where('id', '!=', $actor->id),
            $scope
        )
            ->withCount(['roleAssignments', 'permissionOverrides'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['verified'] === 'true', fn ($b) => $b->whereNotNull('email_verified_at'))
            ->when($filters['verified'] === 'false', fn ($b) => $b->whereNull('email_verified_at'))
            ->orderBy('name');

        $users = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('users', 'filters');
    }

    public function getShowData(User $actor, User $user, array $scope): array
    {
        $actorMinRank        = $this->accessControl->getActorMinRank($actor);
        $actorPermissionIds  = $this->accessControl->getActorPermissionIds($actor);
        $actorAssignedScopes = $this->accessControl->getActorAssignedScopeIds($actor);

        $user->load([
            'roleAssignments' => function ($q) use ($scope) {
                $q->with(['role', 'assignedBy', 'outlet', 'department', 'warehouse']);
                if ($scope['type'] !== 'global') {
                    $this->accessControl->applyScopeFilter($q, $scope);
                }
            },
            'permissionOverrides' => function ($q) use ($actorPermissionIds, $scope) {
                $q->with(['permission', 'assignedBy', 'outlet', 'department', 'warehouse']);
                if ($actorPermissionIds !== null) {
                    $q->whereIn('permission_id', $actorPermissionIds);
                }
                if ($scope['type'] !== 'global') {
                    $this->accessControl->applyScopeFilter($q, $scope);
                }
            },
            'resourcePermissions' => function ($q) use ($actorPermissionIds, $actorAssignedScopes, $scope) {
                $q->with(['permission', 'assignedBy']);
                if ($actorPermissionIds !== null) {
                    $q->whereIn('permission_id', $actorPermissionIds);
                }
                if ($actorAssignedScopes !== null) {
                    $q->where(function ($q2) use ($actorAssignedScopes) {
                        $q2->where(function ($q3) use ($actorAssignedScopes) {
                            $q3->where('resource_type', 'outlet')
                               ->when(! empty($actorAssignedScopes['outlet_ids']), fn ($q4) => $q4->whereIn('resource_id', $actorAssignedScopes['outlet_ids']), fn ($q4) => $q4->whereRaw('1 = 0'));
                        });
                        $q2->orWhere(function ($q3) use ($actorAssignedScopes) {
                            $q3->where('resource_type', 'warehouse')
                               ->when(! empty($actorAssignedScopes['warehouse_ids']), fn ($q4) => $q4->whereIn('resource_id', $actorAssignedScopes['warehouse_ids']), fn ($q4) => $q4->whereRaw('1 = 0'));
                        });
                        $q2->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                    });
                }
                if ($scope['type'] !== 'global') {
                    $q->where(function ($q2) use ($scope) {
                        if ($scope['type'] === 'outlet') {
                            $q2->where(fn ($q3) => $q3->where('resource_type', 'outlet')->where('resource_id', $scope['outlet_id']));
                            $q2->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                        } elseif ($scope['type'] === 'warehouse') {
                            $q2->where(fn ($q3) => $q3->where('resource_type', 'warehouse')->where('resource_id', $scope['warehouse_id']));
                            if ($scope['outlet_id'] !== null) {
                                $q2->orWhere(fn ($q3) => $q3->where('resource_type', 'outlet')->where('resource_id', $scope['outlet_id']));
                            }
                            $q2->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                        }
                    });
                }
            },
        ]);

        $allowedLevels = match ($scope['type']) {
            'outlet'     => ['outlet', 'department', 'warehouse'],
            'department' => ['department', 'warehouse'],
            'warehouse'  => ['warehouse'],
            default      => array_keys(config('access_control.scope_types', [])),
        };

        $roles = Role::where('is_active', true)
            ->when($actorMinRank !== null, fn ($q) => $q->where('rank', '>', $actorMinRank))
            ->whereIn('level', $allowedLevels)
            ->orderBy('name')->get(['id', 'name', 'slug', 'level']);

        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);

        $isGlobal    = $this->accessControl->hasGlobalScopeRole($actor);
        $outlets     = Outlet::orderBy('name')->get(['id', 'name']);
        $departments = OutletDepartment::orderBy('name')->get(['id', 'outlet_id', 'name']);
        $warehouses  = Warehouse::when(! $isGlobal, fn ($q) => $q->where('type', '!=', 'central'))
            ->orderBy('name')->get(['id', 'outlet_id', 'outlet_department_id', 'name', 'type']);

        $allowedResourceIds = $this->resolveSessionConstrainedResourceIds($actorAssignedScopes, $scope);

        return array_merge(
            compact('user', 'roles', 'permissions', 'outlets', 'departments', 'warehouses'),
            $this->resolveScopeProps($actor, $scope),
            $this->resolveResourceProps($actor, $allowedResourceIds),
        );
    }

    public function createUser(array $data): User
    {
        return User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
    }

    public function updateUser(User $user, array $data): void
    {
        $user->name  = $data['name'];
        $user->email = $data['email'];

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
    }

    public function deleteUser(User $user, User $actor): void
    {
        abort_if($user->id === $actor->id, 403, 'You cannot delete your own account.');

        $user->delete();
    }

}
