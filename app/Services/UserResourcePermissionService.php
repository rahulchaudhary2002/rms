<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\User;
use App\Models\UserResourcePermission;
use App\Services\Concerns\InteractsWithScope;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class UserResourcePermissionService
{
    use InteractsWithScope, PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(User $actor, array $filters, array $scope): array
    {
        $actorPermissionIds  = $this->accessControl->getActorPermissionIds($actor);
        $actorAssignedScopes = $this->accessControl->getActorAssignedScopeIds($actor);

        $query = UserResourcePermission::with(['user', 'permission', 'assignedBy'])
            ->where('user_id', '!=', $actor->id)
            ->whereHas('user', fn ($q) => $q->where('is_superadmin', false))
            ->when($actorPermissionIds !== null, fn ($b) => $b->whereIn('permission_id', $actorPermissionIds))
            ->when($actorAssignedScopes !== null, function ($b) use ($actorAssignedScopes) {
                $b->where(function ($q) use ($actorAssignedScopes) {
                    $q->where(function ($q2) use ($actorAssignedScopes) {
                        $q2->where('resource_type', 'outlet')
                           ->when(
                               ! empty($actorAssignedScopes['outlet_ids']),
                               fn ($q3) => $q3->whereIn('resource_id', $actorAssignedScopes['outlet_ids']),
                               fn ($q3) => $q3->whereRaw('1 = 0')
                           );
                    });
                    $q->orWhere(function ($q2) use ($actorAssignedScopes) {
                        $q2->where('resource_type', 'warehouse')
                           ->when(
                               ! empty($actorAssignedScopes['warehouse_ids']),
                               fn ($q3) => $q3->whereIn('resource_id', $actorAssignedScopes['warehouse_ids']),
                               fn ($q3) => $q3->whereRaw('1 = 0')
                           );
                    });
                    $q->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                });
            })
            ->when($scope['type'] !== 'global', function ($b) use ($scope) {
                $b->where(function ($q) use ($scope) {
                    if ($scope['type'] === 'outlet') {
                        $q->where(fn ($q2) => $q2->where('resource_type', 'outlet')->where('resource_id', $scope['scope_id']));
                        $q->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                    } elseif ($scope['type'] === 'warehouse') {
                        $q->where(fn ($q2) => $q2->where('resource_type', 'warehouse')->where('resource_id', $scope['scope_id']));
                        if ($scope['outlet_id'] !== null) {
                            $q->orWhere(fn ($q2) => $q2->where('resource_type', 'outlet')->where('resource_id', $scope['outlet_id']));
                        }
                        $q->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                    }
                });
            })
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->whereHas('user', fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['user_id'] !== '', fn ($b) => $b->where('user_id', $filters['user_id']))
            ->when($filters['permission_id'] !== '', fn ($b) => $b->where('permission_id', $filters['permission_id']))
            ->when($filters['resource_type'] !== '', fn ($b) => $b->where('resource_type', $filters['resource_type']))
            ->when($filters['effect'] !== '', fn ($b) => $b->where('effect', $filters['effect']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderByDesc('created_at');

        $resourcePerms = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $users = User::where('is_superadmin', false)
            ->where('id', '!=', $actor->id)
            ->orderBy('name')->get(['id', 'name', 'email']);

        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);

        $resourceTypes = UserResourcePermission::distinct()->orderBy('resource_type')->pluck('resource_type');

        return compact('resourcePerms', 'users', 'permissions', 'resourceTypes', 'filters');
    }

    public function getCreateData(User $actor, array $scope): array
    {
        $actorPermissionIds  = $this->accessControl->getActorPermissionIds($actor);
        $actorAssignedScopes = $this->accessControl->getActorAssignedScopeIds($actor);

        $users = $this->accessControl->applyUserScopeFilter(
            User::where('is_superadmin', false)->where('id', '!=', $actor->id),
            $scope
        )->orderBy('name')->get(['id', 'name', 'email']);

        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);

        return array_merge(
            compact('users', 'permissions'),
            ['allowedScopes' => $this->accessControl->resolveAllowedScopes($actor)],
            $this->resolveResourceProps($actor, $actorAssignedScopes),
        );
    }

    public function save(User $actor, array $data): void
    {
        $this->accessControl->assertActorCanManagePermission($actor, (int) $data['permission_id']);

        DB::transaction(function () use ($actor, $data) {
            UserResourcePermission::updateOrCreate(
                [
                    'user_id'       => $data['user_id'],
                    'permission_id' => $data['permission_id'],
                    'resource_type' => $data['resource_type'],
                    'resource_id'   => $data['resource_id'],
                ],
                [
                    'effect'      => $data['effect'],
                    'reason'      => $data['reason'] ?? null,
                    'is_active'   => $data['is_active'] ?? true,
                    'assigned_by' => $actor->id,
                ]
            );
        });

        $this->accessControl->clearUserPermissionCache(User::findOrFail($data['user_id']));
    }

    public function toggleActive(UserResourcePermission $resourcePermission, bool $isActive): void
    {
        $resourcePermission->update(['is_active' => $isActive]);
        $this->accessControl->clearUserPermissionCache($resourcePermission->user);
    }

    public function remove(UserResourcePermission $resourcePermission): void
    {
        $user = $resourcePermission->user;
        $resourcePermission->delete();
        $this->accessControl->clearUserPermissionCache($user);
    }

}
