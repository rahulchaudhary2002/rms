<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Models\UserRoleAssignment;
use App\Services\Concerns\InteractsWithScope;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class UserRoleAssignmentService
{
    use InteractsWithScope, PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(User $actor, array $filters, array $scope): array
    {
        $actorMinRank = $this->accessControl->getActorMinRank($actor);

        $query = UserRoleAssignment::with(['user', 'role', 'assignedBy'])
            ->where('user_id', '!=', $actor->id)
            ->whereHas('user', fn ($q) => $q->where('is_superadmin', false))
            ->when($actorMinRank !== null, fn ($b) => $b->whereHas('role', fn ($q) => $q->where('rank', '>', $actorMinRank)));

        $this->accessControl->applyScopeFilter($query, $scope);

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

        $roles = Role::where('is_active', true)
            ->when($actorMinRank !== null, fn ($q) => $q->where('rank', '>', $actorMinRank))
            ->orderBy('name')->get(['id', 'name', 'slug', 'level']);

        return array_merge(compact('users', 'roles'), $this->resolveScopeProps($actor));
    }

    public function assign(User $actor, array $data): void
    {
        $targetRole = Role::findOrFail($data['role_id']);

        $this->accessControl->authorizeRoleAssignment(
            $actor,
            $targetRole,
            $data['scope_type'],
            $data['scope_type'] === 'global' ? null : (int) $data['scope_id'],
        );

        DB::transaction(function () use ($actor, $data) {
            UserRoleAssignment::firstOrCreate(
                [
                    'user_id'    => $data['user_id'],
                    'role_id'    => $data['role_id'],
                    'scope_type' => $data['scope_type'],
                    'scope_id'   => $data['scope_type'] === 'global' ? null : $data['scope_id'],
                ],
                [
                    'is_active'   => $data['is_active'] ?? true,
                    'assigned_by' => $actor->id,
                ]
            );
        });

        $this->accessControl->clearUserPermissionCache(User::findOrFail($data['user_id']));
    }

    public function toggleActive(UserRoleAssignment $assignment, bool $isActive): void
    {
        $assignment->update(['is_active' => $isActive]);
        $this->accessControl->clearUserPermissionCache($assignment->user);
    }

    public function remove(UserRoleAssignment $assignment): void
    {
        $user = $assignment->user;
        $assignment->delete();
        $this->accessControl->clearUserPermissionCache($user);
    }

}
