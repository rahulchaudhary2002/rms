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
    private const CACHE_TTL = 300; // 5 minutes

    public function userHasPermission(
        User $user,
        string $permissionSlug,
        string $scopeType = 'global',
        ?int $scopeId = null
    ): bool {
        $permission = $this->findPermission($permissionSlug);

        if (! $permission) {
            return false;
        }

        // Resolve the parent outlet once so sub-methods don't each hit the DB.
        $parentOutletId = $scopeType === 'warehouse' ? $this->warehouseOutletId($scopeId) : null;

        // Explicit deny override wins everything
        if ($this->hasDenyOverride($user, $permission->id, $scopeType, $scopeId, $parentOutletId)) {
            return false;
        }

        // Explicit allow override grants access
        if ($this->hasAllowOverride($user, $permission->id, $scopeType, $scopeId, $parentOutletId)) {
            return true;
        }

        // Super admin bypass (after override checks so deny still wins)
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Role-based permission check
        return $this->roleGrantsPermission($user, $permission->id, $scopeType, $scopeId, $parentOutletId);
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

        // Deny wins
        if ($resourcePerms->contains('effect', 'deny')) {
            return false;
        }

        return $resourcePerms->contains('effect', 'allow');
    }

    public function getUserPermissions(
        User $user,
        string $scopeType = 'global',
        ?int $scopeId = null
    ): array {
        $cacheKey = $this->permissionCacheKey($user->id, $scopeType, $scopeId);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $scopeType, $scopeId) {
            return $this->resolveUserPermissions($user, $scopeType, $scopeId);
        });
    }

    public function getUserRoles(
        User $user,
        string $scopeType = 'global',
        ?int $scopeId = null
    ): Collection {
        $parentOutletId = $scopeType === 'warehouse' ? $this->warehouseOutletId($scopeId) : null;

        $query = UserRoleAssignment::with('role.permissions')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $scopeId, $parentOutletId));

        return $query->get()->pluck('role')->filter()->values();
    }

    public function clearUserPermissionCache(User $user): void
    {
        foreach (['global' => null] as $type => $id) {
            Cache::forget($this->permissionCacheKey($user->id, $type, $id));
        }

        // Clear outlet/warehouse scopes - we store a key set for this
        $scopeSetKey = "user_permission_scope_keys:{$user->id}";
        $keys = Cache::get($scopeSetKey, []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::forget($scopeSetKey);
    }

    /**
     * Resolves the currently selected scope from the session.
     * Returns ['type' => 'outlet'|'warehouse'|'global', 'scope_id' => int|null, 'outlet_id' => int|null]
     * where outlet_id is the parent outlet when type === 'warehouse'.
     *
     * @return array{type: string, scope_id: int|null, outlet_id: int|null}
     */
    public function resolveSessionScope(Request $request): array
    {
        $scopeType = (string) $request->session()->get('current_scope_type', 'global');
        $nodeId    = $request->session()->get('current_node_id');
        $outletId  = $request->session()->get('current_outlet_id');

        if ($scopeType === 'warehouse' && $nodeId) {
            return [
                'type'      => 'warehouse',
                'scope_id'  => (int) $nodeId,
                'outlet_id' => $outletId ? (int) $outletId : null,
            ];
        }

        if ($scopeType === 'outlet' && $outletId) {
            return [
                'type'      => 'outlet',
                'scope_id'  => (int) $outletId,
                'outlet_id' => null,
            ];
        }

        return ['type' => 'global', 'scope_id' => null, 'outlet_id' => null];
    }

    /**
     * Applies a WHERE condition to a query so only records relevant to the
     * given scope are returned (mirrors applyScopeCondition for public use).
     */
    public function applyScopeFilter(\Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Eloquent\Relations\Relation $query, array $scope): \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Eloquent\Relations\Relation
    {
        return $query->where(function ($q) use ($scope) {
            $q->where('scope_type', 'global');

            if ($scope['type'] === 'outlet') {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('scope_id', $scope['scope_id']));
            } elseif ($scope['type'] === 'warehouse') {
                if ($scope['outlet_id'] !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('scope_id', $scope['outlet_id']));
                }
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'warehouse')->where('scope_id', $scope['scope_id']));
            }
        });
    }

    /**
     * Returns the highest scope level the actor is authorized to work in.
     * global → can use global, outlet, and warehouse scope types
     * outlet → can use outlet and warehouse scope types
     * warehouse → can only use warehouse scope type
     */
    public function getActorMaxScopeLevel(User $actor): string
    {
        if ($this->isSuperAdmin($actor)) {
            return 'global';
        }

        $assignments = UserRoleAssignment::where('user_role_assignments.user_id', $actor->id)
            ->where('user_role_assignments.is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->pluck('scope_type');

        if ($assignments->contains('global')) {
            return 'global';
        }

        if ($assignments->contains('outlet')) {
            return 'outlet';
        }

        return 'warehouse';
    }

    /**
     * Returns the outlet and warehouse IDs the actor is explicitly assigned to via their roles.
     * Returns null for superadmin or any user with a global-scope role (unrestricted).
     *
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
            ->get(['scope_type', 'scope_id']);

        if ($assignments->contains('scope_type', 'global')) {
            return null;
        }

        return [
            'outlet_ids'    => $assignments->where('scope_type', 'outlet')->pluck('scope_id')->filter()->unique()->values()->all(),
            'warehouse_ids' => $assignments->where('scope_type', 'warehouse')->pluck('scope_id')->filter()->unique()->values()->all(),
        ];
    }

    /**
     * Returns the lowest rank value (highest privilege) across the actor's active roles.
     * Returns null for superadmin (no restriction applies).
     */
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

    /**
     * Returns permission IDs that are assigned to the actor via their roles.
     * Returns null for superadmin (no restriction - all permissions visible).
     */
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
     * Returns the outlet/warehouse IDs the actor may assign roles/permissions in.
     * Returns null if the actor has a global-scope role (no restriction).
     *
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
            ->whereIn('scope_type', ['outlet', 'warehouse'])
            ->get(['scope_type', 'scope_id']);

        return [
            'outlet'    => $assignments->where('scope_type', 'outlet')->pluck('scope_id')->unique()->values()->toArray(),
            'warehouse' => $assignments->where('scope_type', 'warehouse')->pluck('scope_id')->unique()->values()->toArray(),
        ];
    }

    /**
     * Returns the scope types the actor is permitted to assign roles/overrides in.
     * global actor → ['global', 'outlet', 'warehouse']
     * outlet actor → ['outlet', 'warehouse']
     * warehouse actor → ['warehouse']
     *
     * @return string[]
     */
    public function resolveAllowedScopeTypes(User $actor): array
    {
        return match ($this->getActorMaxScopeLevel($actor)) {
            'global' => ['global', 'outlet', 'warehouse'],
            'outlet' => ['outlet', 'warehouse'],
            default  => ['warehouse'],
        };
    }

    /**
     * Filters a User query to only include users whose active role assignments
     * fall within the given scope (plus users with no active assignments at all).
     * When scope is global the query is returned unchanged.
     */
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

                    if ($scope['type'] === 'outlet') {
                        $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'outlet')->where('scope_id', $scope['scope_id']));
                    } elseif ($scope['type'] === 'warehouse') {
                        if ($scope['outlet_id'] !== null) {
                            $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'outlet')->where('scope_id', $scope['outlet_id']));
                        }
                        $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'warehouse')->where('scope_id', $scope['scope_id']));
                    }
                });
            });
        });
    }

    /**
     * Clears the permission cache for every user currently assigned to the given role.
     */
    public function clearRoleUsersCache(Role $role): void
    {
        $role->userRoleAssignments()->with('user')->get()
            ->each(fn ($assignment) => $this->clearUserPermissionCache($assignment->user));
    }

    /**
     * Validates that the actor is allowed to assign the given role in the target scope.
     * Throws AuthorizationException on any violation.
     */
    public function authorizeRoleAssignment(User $actor, Role $targetRole, string $targetScopeType, ?int $targetScopeId): void
    {
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

        if (in_array($actorAssignment->scope_type, ['outlet', 'warehouse']) && $actorAssignment->scope_id !== $targetScopeId) {
            throw new AuthorizationException('You cannot assign a role outside your scope.');
        }
    }

    /**
     * Aborts with 403 if the actor is not allowed to manage the given role
     * (i.e. the role's rank is not strictly greater than the actor's minimum rank).
     */
    public function assertActorCanManageRole(User $actor, Role $role): void
    {
        $actorMinRank = $this->getActorMinRank($actor);

        if ($actorMinRank !== null && $role->rank <= $actorMinRank) {
            abort(403, 'You cannot manage this role.');
        }
    }

    /**
     * Aborts with 403 if the actor does not have the given permission assigned to any of their roles.
     */
    public function assertActorCanManagePermission(User $actor, int $permissionId): void
    {
        $actorPermissionIds = $this->getActorPermissionIds($actor);

        if ($actorPermissionIds !== null && ! in_array($permissionId, $actorPermissionIds)) {
            abort(403, 'You can only manage permissions assigned to your own roles.');
        }
    }

    /**
     * Returns the scope_types config formatted for frontend selects.
     *
     * @return array[]
     */
    public function getScopeTypesConfig(): array
    {
        return collect(config('access_control.scope_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values()->all();
    }

    /**
     * Returns the resource_types config formatted for frontend selects.
     *
     * @return array[]
     */
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

    /**
     * Returns scope props (allowedScopeTypes, allowedScopes, scopeTypes) constrained
     * to the user's current session scope so forms only offer valid choices.
     *
     * - global session → actor's full role-based limits
     * - outlet session → restricts to that outlet and its warehouses
     * - warehouse session → restricts to that warehouse only
     */
    public function resolveSessionConstrainedScopeProps(User $actor, array $sessionScope): array
    {
        $baseScopeTypes = $this->resolveAllowedScopeTypes($actor);
        $baseScopes     = $this->resolveAllowedScopes($actor);

        if ($sessionScope['type'] === 'outlet') {
            $outletId = (int) $sessionScope['scope_id'];

            $allowedScopeTypes = array_values(array_intersect($baseScopeTypes, ['outlet', 'warehouse']));

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
            $warehouseId = (int) $sessionScope['scope_id'];

            $allowedScopeTypes = array_values(array_intersect($baseScopeTypes, ['warehouse']));
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

    /**
     * Aborts 403 when the actor is not allowed to mutate a record that carries
     * scope_type/scope_id (e.g. UserRoleAssignment, UserPermissionOverride).
     */
    public function assertActorCanMutateScopedRecord(User $actor, string $scopeType, ?int $scopeId): void
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

        if ($scopeType === 'outlet') {
            if (! in_array($scopeId, $allowedScopes['outlet'], true)) {
                abort(403, 'This record is outside your scope.');
            }

            return;
        }

        if ($scopeType === 'warehouse') {
            if (in_array($scopeId, $allowedScopes['warehouse'], true)) {
                return;
            }

            $warehouseOutletId = DB::table('warehouses')->where('id', $scopeId)->value('outlet_id');

            if ($warehouseOutletId !== null && in_array((int) $warehouseOutletId, $allowedScopes['outlet'], true)) {
                return;
            }

            abort(403, 'This record is outside your scope.');
        }
    }

    /**
     * Returns true when the user is a superadmin (is_superadmin flag or super-admin role)
     * or holds any role with level = 'global' assigned at scope_type = 'global'.
     * These users may operate in any outlet or warehouse.
     */
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

    private function resolveUserPermissions(
        User $user,
        string $scopeType,
        ?int $scopeId
    ): array {
        $permissions = [];
        $parentOutletId = $scopeType === 'warehouse' ? $this->warehouseOutletId($scopeId) : null;

        // Collect role-based permissions (includes inherited outlet-level roles for warehouse scope)
        $roles = $this->getUserRoles($user, $scopeType, $scopeId);
        foreach ($roles as $role) {
            foreach ($role->permissions as $permission) {
                if ($permission->is_active) {
                    $permissions[$permission->slug] = true;
                }
            }
        }

        // Apply overrides - inherits outlet-level overrides when in warehouse scope
        $overrides = $user->permissionOverrides()
            ->with('permission')
            ->where('is_active', true)
            ->whereHas('permission', fn ($q) => $q->where('is_active', true))
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $scopeId, $parentOutletId))
            ->get();

        // Allow overrides first
        foreach ($overrides->where('effect', 'allow') as $override) {
            $permissions[$override->permission->slug] = true;
        }

        // Deny overrides win last (overwrite any allow)
        foreach ($overrides->where('effect', 'deny') as $override) {
            $permissions[$override->permission->slug] = false;
        }

        // Super admin gets everything unless denied
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

    private function hasDenyOverride(User $user, int $permissionId, string $scopeType, ?int $scopeId, ?int $parentOutletId = null): bool
    {
        return $user->permissionOverrides()
            ->where('permission_id', $permissionId)
            ->where('effect', 'deny')
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $scopeId, $parentOutletId))
            ->exists();
    }

    private function hasAllowOverride(User $user, int $permissionId, string $scopeType, ?int $scopeId, ?int $parentOutletId = null): bool
    {
        return $user->permissionOverrides()
            ->where('permission_id', $permissionId)
            ->where('effect', 'allow')
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $scopeId, $parentOutletId))
            ->exists();
    }

    private function roleGrantsPermission(User $user, int $permissionId, string $scopeType, ?int $scopeId, ?int $parentOutletId = null): bool
    {
        return UserRoleAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $scopeId, $parentOutletId))
            ->whereHas('role', function ($q) use ($permissionId) {
                $q->where('is_active', true)
                    ->whereHas('permissions', fn ($q2) => $q2->where('permissions.id', $permissionId)->where('is_active', true));
            })
            ->exists();
    }

    /**
     * Builds the scope WHERE condition for role assignments and overrides.
     * For warehouse scope, also includes the parent outlet's assignments/overrides.
     */
    private function applyScopeCondition(\Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder $query, string $scopeType, ?int $scopeId, ?int $parentOutletId = null): void
    {
        if ($scopeType === 'global') {
            $query->where('scope_type', 'global');
            return;
        }

        $query->where(function ($q) use ($scopeType, $scopeId, $parentOutletId) {
            // Global assignments always apply
            $q->where('scope_type', 'global');

            // Outlet-level assignments apply to all warehouses in that outlet
            if ($parentOutletId !== null) {
                $q->orWhere(function ($q2) use ($parentOutletId) {
                    $q2->where('scope_type', 'outlet')
                        ->where('scope_id', $parentOutletId);
                });
            }

            // Exact scope match (outlet or warehouse)
            $q->orWhere(function ($q2) use ($scopeType, $scopeId) {
                $q2->where('scope_type', $scopeType)
                    ->where('scope_id', $scopeId);
            });
        });
    }

    private function warehouseOutletId(?int $warehouseId): ?int
    {
        if ($warehouseId === null) {
            return null;
        }

        $outletId = DB::table('warehouses')
            ->where('id', $warehouseId)
            ->value('outlet_id');

        return $outletId !== null ? (int) $outletId : null;
    }

    private function findPermission(string $slug): ?Permission
    {
        return Permission::where('slug', $slug)->where('is_active', true)->first();
    }

    private function permissionCacheKey(int $userId, string $scopeType, ?int $scopeId): string
    {
        $key = "user_permissions:{$userId}:{$scopeType}:" . ($scopeId ?? 'null');

        // Track scoped keys so clearUserPermissionCache can wipe them
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
