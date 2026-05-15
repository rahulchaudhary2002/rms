<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\User;
use App\Models\UserPermissionOverride;
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

        $query = UserPermissionOverride::with(['user', 'permission', 'assignedBy'])
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

        return array_merge(compact('users', 'permissions'), $this->resolveScopeProps($actor, $scope));
    }

    public function save(User $actor, array $data): void
    {
        $this->accessControl->assertActorCanManagePermission($actor, (int) $data['permission_id']);

        DB::transaction(function () use ($actor, $data) {
            UserPermissionOverride::updateOrCreate(
                [
                    'user_id'       => $data['user_id'],
                    'permission_id' => $data['permission_id'],
                    'scope_type'    => $data['scope_type'],
                    'scope_id'      => $data['scope_type'] === 'global' ? null : $data['scope_id'],
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

    public function toggleActive(UserPermissionOverride $override, bool $isActive): void
    {
        /** @var \App\Models\User $actor */
        /** @var \App\Models\User $actor */
        $actor = Auth::user();
        $this->accessControl->assertActorCanMutateScopedRecord($actor, $override->scope_type, $override->scope_id);
        $override->update(['is_active' => $isActive]);
        /** @var \App\Models\User $overrideUser */
        $overrideUser = $override->user()->first();
        $this->accessControl->clearUserPermissionCache($overrideUser);
    }

    public function remove(UserPermissionOverride $override): void
    {
        /** @var \App\Models\User $actor */
        /** @var \App\Models\User $actor */
        $actor = Auth::user();
        $this->accessControl->assertActorCanMutateScopedRecord($actor, $override->scope_type, $override->scope_id);
        /** @var \App\Models\User $user */
        $user = $override->user()->first();
        $override->delete();
        $this->accessControl->clearUserPermissionCache($user);
    }

}
