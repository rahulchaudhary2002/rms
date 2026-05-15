<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRoleAssignment;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AccessControlService
{
    private const CACHE_TTL = 300;

    private const SCOPE_TYPES = [
        'global',
        'central_warehouse',
        'outlet',
        'outlet_warehouse',
        'outlet_department',
        'department_warehouse',
    ];

    public function userHasPermission(
        User $user,
        string $permissionSlug,
        string $scopeType = 'global',
        ?int $outletId = null,
        ?int $warehouseId = null
    ): bool {
        $permission = $this->findPermission($permissionSlug);

        if (! $permission) {
            return false;
        }

        if ($this->hasDenyOverride($user, $permission->id, $scopeType, $outletId, $warehouseId)) {
            return false;
        }

        if ($this->hasAllowOverride($user, $permission->id, $scopeType, $outletId, $warehouseId)) {
            return true;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->roleGrantsPermission($user, $permission->id, $scopeType, $outletId, $warehouseId);
    }

    public function userCanAccessResource(
        User $user,
        string $permissionSlug,
        string $resourceType,
        int $resourceId
    ): bool {
        $permission = $this->findPermission($permissionSlug);

        if (! $permission) {
            return false;
        }

        $resourcePerms = $user->resourcePermissions()
            ->where('permission_id', $permission->id)
            ->where('resource_type', $resourceType)
            ->where('resource_id', $resourceId)
            ->where('is_active', true)
            ->get();

        if ($resourcePerms->isEmpty()) {
            return false;
        }

        if ($resourcePerms->contains('effect', 'deny')) {
            return false;
        }

        return $resourcePerms->contains('effect', 'allow');
    }

    public function getUserPermissions(
        User $user,
        string $scopeType = 'global',
        ?int $outletId = null,
        ?int $warehouseId = null
    ): array {
        $cacheKey = $this->permissionCacheKey($user->id, $scopeType, $outletId, $warehouseId);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $scopeType, $outletId, $warehouseId) {
            return $this->resolveUserPermissions($user, $scopeType, $outletId, $warehouseId);
        });
    }

    public function getUserRoles(
        User $user,
        string $scopeType = 'global',
        ?int $outletId = null,
        ?int $warehouseId = null
    ): Collection {
        $query = UserRoleAssignment::with('role.permissions')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $warehouseId));

        return $query->get()->pluck('role')->filter()->values();
    }

    public function clearUserPermissionCache(User $user): void
    {
        Cache::forget($this->permissionCacheKey($user->id, 'global', null, null));

        $scopeSetKey = "user_permission_scope_keys:{$user->id}";
        $keys = Cache::get($scopeSetKey, []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::forget($scopeSetKey);
    }

    /**
     * Resolves the currently selected scope from the session.
     *
     * @return array{type: string, outlet_id: int|null, warehouse_id: int|null}
     */
    public function resolveSessionScope(Request $request): array
    {
        $scopeType = (string) $request->session()->get('current_scope_type', 'global');
        $nodeId    = $request->session()->get('current_node_id');
        $outletId  = $request->session()->get('current_outlet_id');

        if ($scopeType === 'warehouse' && $nodeId) {
            return [
                'type'         => 'warehouse',
                'outlet_id'    => $outletId ? (int) $outletId : null,
                'warehouse_id' => (int) $nodeId,
            ];
        }

        if ($scopeType === 'outlet' && $outletId) {
            return [
                'type'         => 'outlet',
                'outlet_id'    => (int) $outletId,
                'warehouse_id' => null,
            ];
        }

        return ['type' => 'global', 'outlet_id' => null, 'warehouse_id' => null];
    }

    /**
     * Applies a WHERE condition so only records relevant to the given scope are returned.
     */
    public function applyScopeFilter(Builder|\Illuminate\Database\Eloquent\Relations\Relation $query, array $scope): Builder|\Illuminate\Database\Eloquent\Relations\Relation
    {
        return $query->where(function ($q) use ($scope) {
            $q->where('scope_type', 'global');

            if ($scope['type'] === 'outlet' && ($scope['outlet_id'] ?? null) !== null) {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('outlet_id', $scope['outlet_id']));
            } elseif ($scope['type'] === 'warehouse') {
                if (($scope['outlet_id'] ?? null) !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('outlet_id', $scope['outlet_id']));
                }
                if (($scope['warehouse_id'] ?? null) !== null) {
                    $q->orWhere(fn ($q2) => $q2
                        ->whereIn('scope_type', ['outlet_warehouse', 'central_warehouse', 'department_warehouse'])
                        ->where('warehouse_id', $scope['warehouse_id']));
                }
            }
        });
    }

    public function getActorMaxScopeLevel(User $actor): string
    {
        if ($this->isSuperAdmin($actor)) {
            return 'global';
        }

        $scopeTypes = UserRoleAssignment::where('user_role_assignments.user_id', $actor->id)
            ->where('user_role_assignments.is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->pluck('scope_type');

        if ($scopeTypes->contains('global')) {
            return 'global';
        }

        if ($scopeTypes->intersect(['outlet', 'outlet_department'])->isNotEmpty()) {
            return 'outlet';
        }

        return 'warehouse';
    }

    /**
     * @return array{outlet_ids: int[], warehouse_ids: int[]}|null
     */
    public function getActorAssignedScopeIds(User $actor): ?array
    {
        if ($this->isSuperAdmin($actor)) {
            return null;
        }

        $assignments = UserRoleAssignment::where('user_role_assignments.user_id', $actor->id)
            ->where('user_role_assignments.is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->get(['scope_type', 'outlet_id', 'warehouse_id']);

        if ($assignments->contains('scope_type', 'global')) {
            return null;
        }

        return [
            'outlet_ids'    => $assignments->whereNotNull('outlet_id')->pluck('outlet_id')->unique()->values()->all(),
            'warehouse_ids' => $assignments->whereNotNull('warehouse_id')->pluck('warehouse_id')->unique()->values()->all(),
        ];
    }

    public function getActorMinRank(User $actor): ?int
    {
        if ($this->isSuperAdmin($actor)) {
            return null;
        }

        $rank = UserRoleAssignment::where('user_role_assignments.user_id', $actor->id)
            ->where('user_role_assignments.is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->join('roles', 'roles.id', '=', 'user_role_assignments.role_id')
            ->min('roles.rank');

        return $rank !== null ? (int) $rank : null;
    }

    public function getActorPermissionIds(User $actor): ?array
    {
        if ($this->isSuperAdmin($actor)) {
            return null;
        }

        $roleIds = UserRoleAssignment::where('user_role_assignments.user_id', $actor->id)
            ->where('user_role_assignments.is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->pluck('user_role_assignments.role_id');

        return DB::table('role_permissions')
            ->whereIn('role_id', $roleIds)
            ->pluck('permission_id')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array{outlet: int[], warehouse: int[]}|null
     */
    public function resolveAllowedScopes(User $actor): ?array
    {
        $hasGlobalRole = $this->isSuperAdmin($actor)
            || UserRoleAssignment::where('user_id', $actor->id)
                ->where('is_active', true)
                ->where('scope_type', 'global')
                ->whereHas('role', fn ($q) => $q->where('is_active', true))
                ->exists();

        if ($hasGlobalRole) {
            return null;
        }

        $assignments = UserRoleAssignment::where('user_id', $actor->id)
            ->where('is_active', true)
            ->where('scope_type', '!=', 'global')
            ->get(['scope_type', 'outlet_id', 'warehouse_id']);

        return [
            'outlet'    => $assignments->whereNotNull('outlet_id')->pluck('outlet_id')->unique()->values()->toArray(),
            'warehouse' => $assignments->whereNotNull('warehouse_id')->pluck('warehouse_id')->unique()->values()->toArray(),
        ];
    }

    /**
     * @return string[]
     */
    public function resolveAllowedScopeTypes(User $actor): array
    {
        return match ($this->getActorMaxScopeLevel($actor)) {
            'global' => self::SCOPE_TYPES,
            'outlet' => ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse'],
            default  => ['outlet_warehouse', 'central_warehouse', 'department_warehouse'],
        };
    }

    public function applyUserScopeFilter(Builder $query, array $scope): Builder
    {
        if ($scope['type'] === 'global') {
            return $query;
        }

        return $query->where(function ($q) use ($scope) {
            $q->whereDoesntHave('roleAssignments', fn ($q2) => $q2->where('is_active', true));

            $q->orWhereHas('roleAssignments', function ($q2) use ($scope) {
                $q2->where('is_active', true)->where(function ($q3) use ($scope) {
                    $q3->where('scope_type', 'global');

                    if ($scope['type'] === 'outlet' && ($scope['outlet_id'] ?? null) !== null) {
                        $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'outlet')->where('outlet_id', $scope['outlet_id']));
                    } elseif ($scope['type'] === 'warehouse') {
                        if (($scope['outlet_id'] ?? null) !== null) {
                            $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'outlet')->where('outlet_id', $scope['outlet_id']));
                        }
                        if (($scope['warehouse_id'] ?? null) !== null) {
                            $q3->orWhere(fn ($q4) => $q4
                                ->whereIn('scope_type', ['outlet_warehouse', 'central_warehouse', 'department_warehouse'])
                                ->where('warehouse_id', $scope['warehouse_id']));
                        }
                    }
                });
            });
        });
    }

    public function clearRoleUsersCache(Role $role): void
    {
        $role->userRoleAssignments()->with('user')->get()
            ->each(fn ($assignment) => $this->clearUserPermissionCache($assignment->user));
    }

    public function authorizeRoleAssignment(
        User $actor,
        Role $targetRole,
        string $targetScopeType,
        ?int $targetOutletId,
        ?int $targetWarehouseId
    ): void {
        if (! $targetRole->is_active) {
            throw new AuthorizationException('Role is inactive.');
        }

        if (! $targetRole->is_assignable) {
            throw new AuthorizationException('This role cannot be assigned.');
        }

        if ($this->isSuperAdmin($actor)) {
            return;
        }

        $actorAssignment = UserRoleAssignment::with('role')
            ->where('user_role_assignments.user_id', $actor->id)
            ->where('user_role_assignments.is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->join('roles', 'roles.id', '=', 'user_role_assignments.role_id')
            ->orderBy('roles.rank')
            ->select('user_role_assignments.*')
            ->first();

        $actorRole = $actorAssignment?->role;

        if (! $actorRole) {
            throw new AuthorizationException('You do not have a role that allows assigning roles.');
        }

        if ($targetRole->rank <= $actorRole->rank) {
            throw new AuthorizationException('You cannot assign an equal or higher-ranked role.');
        }

        if ($actorAssignment->scope_type !== 'global' && $actorAssignment->scope_type !== $targetScopeType) {
            throw new AuthorizationException('Invalid role assignment scope.');
        }

        if ($actorAssignment->outlet_id !== null && $actorAssignment->outlet_id !== $targetOutletId) {
            throw new AuthorizationException('You cannot assign a role outside your outlet scope.');
        }

        if ($actorAssignment->warehouse_id !== null && $actorAssignment->warehouse_id !== $targetWarehouseId) {
            throw new AuthorizationException('You cannot assign a role outside your warehouse scope.');
        }
    }

    public function assertActorCanManageRole(User $actor, Role $role): void
    {
        $actorMinRank = $this->getActorMinRank($actor);

        if ($actorMinRank !== null && $role->rank <= $actorMinRank) {
            abort(403, 'You cannot manage this role.');
        }
    }

    public function assertActorCanManagePermission(User $actor, int $permissionId): void
    {
        $actorPermissionIds = $this->getActorPermissionIds($actor);

        if ($actorPermissionIds !== null && ! in_array($permissionId, $actorPermissionIds)) {
            abort(403, 'You can only manage permissions assigned to your own roles.');
        }
    }

    public function getScopeTypesConfig(): array
    {
        return collect(config('access_control.scope_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values()->all();
    }

    public function getResourceTypesConfig(): array
    {
        return collect(config('access_control.resource_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values()->all();
    }

    public function isSuperAdmin(User $user): bool
    {
        if ($user->is_superadmin) {
            return true;
        }

        return UserRoleAssignment::where('user_id', $user->id)
            ->where('scope_type', 'global')
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('slug', 'super-admin')->where('is_active', true))
            ->exists();
    }

    public function resolveSessionConstrainedScopeProps(User $actor, array $sessionScope): array
    {
        $baseScopeTypes = $this->resolveAllowedScopeTypes($actor);
        $baseScopes     = $this->resolveAllowedScopes($actor);

        if ($sessionScope['type'] === 'outlet') {
            $outletId = (int) $sessionScope['outlet_id'];

            $allowedScopeTypes = array_values(array_intersect($baseScopeTypes, ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse']));

            $warehouseIds = DB::table('warehouses')
                ->where('outlet_id', $outletId)
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->toArray();

            $allowedScopes = $baseScopes === null
                ? ['outlet' => [$outletId], 'warehouse' => $warehouseIds]
                : [
                    'outlet'    => in_array($outletId, $baseScopes['outlet'], true) ? [$outletId] : [],
                    'warehouse' => array_values(array_intersect($warehouseIds, $baseScopes['warehouse'])),
                ];
        } elseif ($sessionScope['type'] === 'warehouse') {
            $warehouseId = (int) $sessionScope['warehouse_id'];

            $allowedScopeTypes = array_values(array_intersect($baseScopeTypes, ['outlet_warehouse', 'central_warehouse', 'department_warehouse']));
            $allowedScopes     = ['outlet' => [], 'warehouse' => [$warehouseId]];
        } else {
            $allowedScopeTypes = $baseScopeTypes;
            $allowedScopes     = $baseScopes;
        }

        return [
            'allowedScopes'     => $allowedScopes,
            'allowedScopeTypes' => $allowedScopeTypes,
            'scopeTypes'        => $this->getScopeTypesConfig(),
        ];
    }

    public function assertActorCanMutateScopedRecord(User $actor, string $scopeType, ?int $outletId, ?int $warehouseId = null): void
    {
        if ($this->hasGlobalScopeRole($actor)) {
            return;
        }

        $allowedScopes = $this->resolveAllowedScopes($actor);

        if ($allowedScopes === null) {
            return;
        }

        if ($scopeType === 'global') {
            abort(403, 'You cannot manage global-scope records.');
        }

        if ($outletId !== null && in_array($outletId, $allowedScopes['outlet'], true)) {
            return;
        }

        if ($warehouseId !== null && in_array($warehouseId, $allowedScopes['warehouse'], true)) {
            return;
        }

        if ($warehouseId !== null && $outletId !== null && in_array($outletId, $allowedScopes['outlet'], true)) {
            return;
        }

        abort(403, 'This record is outside your scope.');
    }

    public function hasGlobalScopeRole(User $user): bool
    {
        if ($user->is_superadmin || $this->isSuperAdmin($user)) {
            return true;
        }

        return UserRoleAssignment::where('user_id', $user->id)
            ->where('scope_type', 'global')
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('level', 'global')->where('is_active', true))
            ->exists();
    }

    private function resolveUserPermissions(User $user, string $scopeType, ?int $outletId, ?int $warehouseId): array
    {
        $permissions = [];

        $roles = $this->getUserRoles($user, $scopeType, $outletId, $warehouseId);
        foreach ($roles as $role) {
            foreach ($role->permissions as $permission) {
                if ($permission->is_active) {
                    $permissions[$permission->slug] = true;
                }
            }
        }

        $overrides = $user->permissionOverrides()
            ->with('permission')
            ->where('is_active', true)
            ->whereHas('permission', fn ($q) => $q->where('is_active', true))
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $warehouseId))
            ->get();

        foreach ($overrides->where('effect', 'allow') as $override) {
            $permissions[$override->permission->slug] = true;
        }

        foreach ($overrides->where('effect', 'deny') as $override) {
            $permissions[$override->permission->slug] = false;
        }

        if ($this->isSuperAdmin($user)) {
            $allPermissions = Permission::where('is_active', true)->pluck('slug');
            foreach ($allPermissions as $slug) {
                if (! isset($permissions[$slug]) || $permissions[$slug] !== false) {
                    $permissions[$slug] = true;
                }
            }
        }

        return $permissions;
    }

    private function hasDenyOverride(User $user, int $permissionId, string $scopeType, ?int $outletId, ?int $warehouseId): bool
    {
        return $user->permissionOverrides()
            ->where('permission_id', $permissionId)
            ->where('effect', 'deny')
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $warehouseId))
            ->exists();
    }

    private function hasAllowOverride(User $user, int $permissionId, string $scopeType, ?int $outletId, ?int $warehouseId): bool
    {
        return $user->permissionOverrides()
            ->where('permission_id', $permissionId)
            ->where('effect', 'allow')
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $warehouseId))
            ->exists();
    }

    private function roleGrantsPermission(User $user, int $permissionId, string $scopeType, ?int $outletId, ?int $warehouseId): bool
    {
        return UserRoleAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $warehouseId))
            ->whereHas('role', function ($q) use ($permissionId) {
                $q->where('is_active', true)
                    ->whereHas('permissions', fn ($q2) => $q2->where('permissions.id', $permissionId)->where('is_active', true));
            })
            ->exists();
    }

    private function applyScopeCondition(\Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder $query, string $scopeType, ?int $outletId, ?int $warehouseId): void
    {
        if ($scopeType === 'global') {
            $query->where('scope_type', 'global');
            return;
        }

        $query->where(function ($q) use ($outletId, $warehouseId) {
            $q->where('scope_type', 'global');

            if ($outletId !== null) {
                $q->orWhere(fn ($q2) => $q2->whereIn('scope_type', ['outlet', 'outlet_department'])->where('outlet_id', $outletId));
            }

            if ($warehouseId !== null) {
                $q->orWhere(fn ($q2) => $q2
                    ->whereIn('scope_type', ['outlet_warehouse', 'central_warehouse', 'department_warehouse'])
                    ->where('warehouse_id', $warehouseId));
            }
        });
    }

    private function findPermission(string $slug): ?Permission
    {
        return Permission::where('slug', $slug)->where('is_active', true)->first();
    }

    private function permissionCacheKey(int $userId, string $scopeType, ?int $outletId, ?int $warehouseId): string
    {
        $key = "user_permissions:{$userId}:{$scopeType}:o" . ($outletId ?? 'null') . ':w' . ($warehouseId ?? 'null');

        if ($scopeType !== 'global') {
            $scopeSetKey = "user_permission_scope_keys:{$userId}";
            $keys = Cache::get($scopeSetKey, []);
            if (! in_array($key, $keys)) {
                $keys[] = $key;
                Cache::put($scopeSetKey, $keys, self::CACHE_TTL * 2);
            }
        }

        return $key;
    }
}
