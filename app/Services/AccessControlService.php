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
        ?int $departmentId = null,
        ?int $warehouseId = null
    ): bool {
        $permission = $this->findPermission($permissionSlug);

        if (! $permission) {
            return false;
        }

        if ($this->hasDenyOverride($user, $permission->id, $scopeType, $outletId, $departmentId, $warehouseId)) {
            return false;
        }

        if ($this->hasAllowOverride($user, $permission->id, $scopeType, $outletId, $departmentId, $warehouseId)) {
            return true;
        }

        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->roleGrantsPermission($user, $permission->id, $scopeType, $outletId, $departmentId, $warehouseId);
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
        ?int $departmentId = null,
        ?int $warehouseId = null
    ): array {
        $cacheKey = $this->permissionCacheKey($user->id, $scopeType, $outletId, $departmentId, $warehouseId);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $scopeType, $outletId, $departmentId, $warehouseId) {
            return $this->resolveUserPermissions($user, $scopeType, $outletId, $departmentId, $warehouseId);
        });
    }

    public function getUserRoles(
        User $user,
        string $scopeType = 'global',
        ?int $outletId = null,
        ?int $departmentId = null,
        ?int $warehouseId = null
    ): Collection {
        $query = UserRoleAssignment::with('role.permissions')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $departmentId, $warehouseId));

        return $query->get()->pluck('role')->filter()->values();
    }

    public function clearUserPermissionCache(User $user): void
    {
        Cache::forget($this->permissionCacheKey($user->id, 'global', null, null, null));

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
     * @return array{type: string, outlet_id: int|null, department_id: int|null, warehouse_id: int|null}
     */
    public function resolveSessionScope(Request $request): array
    {
        $scopeType    = (string) $request->session()->get('current_scope_type', 'global');
        $outletId     = $request->session()->get('current_outlet_id');
        $departmentId = $request->session()->get('current_department_id');
        $nodeId       = $request->session()->get('current_node_id');

        return match ($scopeType) {
            'central_warehouse'    => ['type' => 'central_warehouse',    'outlet_id' => null,                            'department_id' => null,                                          'warehouse_id' => $nodeId ? (int) $nodeId : null],
            'outlet'               => ['type' => 'outlet',               'outlet_id' => $outletId ? (int) $outletId : null, 'department_id' => null,                                       'warehouse_id' => null],
            'outlet_warehouse'     => ['type' => 'outlet_warehouse',     'outlet_id' => $outletId ? (int) $outletId : null, 'department_id' => null,                                       'warehouse_id' => $nodeId ? (int) $nodeId : null],
            'outlet_department'    => ['type' => 'outlet_department',    'outlet_id' => $outletId ? (int) $outletId : null, 'department_id' => $departmentId ? (int) $departmentId : null, 'warehouse_id' => null],
            'department_warehouse' => ['type' => 'department_warehouse', 'outlet_id' => $outletId ? (int) $outletId : null, 'department_id' => $departmentId ? (int) $departmentId : null, 'warehouse_id' => $nodeId ? (int) $nodeId : null],
            default                => ['type' => 'global',               'outlet_id' => null,                            'department_id' => null,                                          'warehouse_id' => null],
        };
    }

    /**
     * Applies a WHERE condition so only records relevant to the given scope are returned.
     */
    public function applyScopeFilter(Builder|\Illuminate\Database\Eloquent\Relations\Relation $query, array $scope): Builder|\Illuminate\Database\Eloquent\Relations\Relation
    {
        return $query->where(function ($q) use ($scope) {
            $q->where('scope_type', 'global');

            $type        = $scope['type'];
            $outletId    = $scope['outlet_id'] ?? null;
            $deptId      = $scope['department_id'] ?? null;
            $warehouseId = $scope['warehouse_id'] ?? null;

            if ($type === 'central_warehouse' && $warehouseId !== null) {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'central_warehouse')->where('warehouse_id', $warehouseId));
            }

            if ($type === 'outlet' && $outletId !== null) {
                // outlet scope: show all records directly or nested under this outlet
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('outlet_id', $outletId));
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet_warehouse')->where('outlet_id', $outletId));
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet_department')->where('outlet_id', $outletId));
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'department_warehouse')->where('outlet_id', $outletId));
            }

            if ($type === 'outlet_warehouse') {
                if ($outletId !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('outlet_id', $outletId));
                }
                if ($warehouseId !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet_warehouse')->where('warehouse_id', $warehouseId));
                }
            }

            if ($type === 'outlet_department') {
                if ($outletId !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('outlet_id', $outletId));
                }
                if ($deptId !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet_department')->where('outlet_department_id', $deptId));
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'department_warehouse')->where('outlet_department_id', $deptId));
                }
            }

            if ($type === 'department_warehouse') {
                if ($outletId !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('outlet_id', $outletId));
                }
                if ($deptId !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet_department')->where('outlet_department_id', $deptId));
                }
                if ($warehouseId !== null) {
                    $q->orWhere(fn ($q2) => $q2->where('scope_type', 'department_warehouse')->where('warehouse_id', $warehouseId));
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

        foreach (['global', 'central_warehouse', 'outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse'] as $level) {
            if ($scopeTypes->contains($level)) {
                return $level;
            }
        }

        return 'outlet_warehouse';
    }

    /**
     * @return array{outlet_ids: int[], department_ids: int[], warehouse_ids: int[]}|null
     */
    public function getActorAssignedScopeIds(User $actor): ?array
    {
        if ($this->isSuperAdmin($actor)) {
            return null;
        }

        $assignments = UserRoleAssignment::where('user_role_assignments.user_id', $actor->id)
            ->where('user_role_assignments.is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->get(['scope_type', 'outlet_id', 'outlet_department_id', 'warehouse_id']);

        if ($assignments->contains('scope_type', 'global')) {
            return null;
        }

        return [
            'outlet_ids'     => $assignments->whereNotNull('outlet_id')->pluck('outlet_id')->unique()->values()->all(),
            'department_ids' => $assignments->whereNotNull('outlet_department_id')->pluck('outlet_department_id')->unique()->values()->all(),
            'warehouse_ids'  => $assignments->whereNotNull('warehouse_id')->pluck('warehouse_id')->unique()->values()->all(),
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
     * @return array{outlet: int[], outlet_warehouse: int[], outlet_department: int[], department_warehouse: int[], central_warehouse: int[]}|null
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
            ->get(['scope_type', 'outlet_id', 'outlet_department_id', 'warehouse_id']);

        return [
            'outlet'              => $assignments->where('scope_type', 'outlet')->whereNotNull('outlet_id')
                                         ->pluck('outlet_id')->unique()->values()->toArray(),
            'outlet_warehouse'    => $assignments->where('scope_type', 'outlet_warehouse')->whereNotNull('warehouse_id')
                                         ->pluck('warehouse_id')->unique()->values()->toArray(),
            'outlet_department'   => $assignments->where('scope_type', 'outlet_department')->whereNotNull('outlet_department_id')
                                         ->pluck('outlet_department_id')->unique()->values()->toArray(),
            'department_warehouse'=> $assignments->where('scope_type', 'department_warehouse')->whereNotNull('warehouse_id')
                                         ->pluck('warehouse_id')->unique()->values()->toArray(),
            'central_warehouse'   => $assignments->where('scope_type', 'central_warehouse')->whereNotNull('warehouse_id')
                                         ->pluck('warehouse_id')->unique()->values()->toArray(),
        ];
    }

    /**
     * @return string[]
     */
    public function resolveAllowedScopeTypes(User $actor): array
    {
        return match ($this->getActorMaxScopeLevel($actor)) {
            'global'               => self::SCOPE_TYPES,
            'central_warehouse'    => ['central_warehouse'],
            'outlet'               => ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse'],
            'outlet_warehouse'     => ['outlet_warehouse'],
            'outlet_department'    => ['outlet_department', 'department_warehouse'],
            'department_warehouse' => ['department_warehouse'],
            default                => ['outlet_warehouse'],
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
                    $this->applyScopeCondition($q3, $scope['type'], $scope['outlet_id'] ?? null, $scope['department_id'] ?? null, $scope['warehouse_id'] ?? null);
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
        ?int $targetDepartmentId,
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

        if ($actorAssignment->scope_type === 'global') {
            return;
        }

        if ($targetScopeType === 'global') {
            throw new AuthorizationException('You cannot assign global scope roles.');
        }

        // Each actor scope type may only assign into specific target scope types
        $allowedTargetScopes = match ($actorAssignment->scope_type) {
            'central_warehouse'    => ['central_warehouse'],
            'outlet'               => ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse'],
            'outlet_warehouse'     => ['outlet_warehouse'],
            'outlet_department'    => ['outlet_department', 'department_warehouse'],
            'department_warehouse' => ['department_warehouse'],
            default                => [],
        };

        if (! in_array($targetScopeType, $allowedTargetScopes, true)) {
            throw new AuthorizationException('You cannot assign a role with a broader or unrelated scope.');
        }

        // Containment checks per actor scope type
        if ($actorAssignment->scope_type === 'central_warehouse') {
            if ($actorAssignment->warehouse_id !== $targetWarehouseId) {
                throw new AuthorizationException('You cannot assign roles outside your central warehouse scope.');
            }
        }

        if ($actorAssignment->scope_type === 'outlet') {
            if ($targetOutletId !== null && $actorAssignment->outlet_id !== $targetOutletId) {
                throw new AuthorizationException('You cannot assign a role outside your outlet scope.');
            }
        }

        if ($actorAssignment->scope_type === 'outlet_warehouse') {
            if ($actorAssignment->warehouse_id !== $targetWarehouseId) {
                throw new AuthorizationException('You cannot assign roles outside your outlet warehouse scope.');
            }
        }

        if ($actorAssignment->scope_type === 'outlet_department') {
            if ($targetOutletId !== null && $actorAssignment->outlet_id !== $targetOutletId) {
                throw new AuthorizationException('You cannot assign a role outside your outlet scope.');
            }
            if ($targetDepartmentId !== null && $actorAssignment->outlet_department_id !== $targetDepartmentId) {
                throw new AuthorizationException('You cannot assign a role outside your department scope.');
            }
            if ($targetScopeType === 'department_warehouse' && $targetWarehouseId !== null) {
                $whDeptId = \App\Models\Warehouse::where('id', $targetWarehouseId)->value('outlet_department_id');
                if ($whDeptId !== $actorAssignment->outlet_department_id) {
                    throw new AuthorizationException('You cannot assign a warehouse role outside your department.');
                }
            }
        }

        if ($actorAssignment->scope_type === 'department_warehouse') {
            if ($actorAssignment->warehouse_id !== $targetWarehouseId) {
                throw new AuthorizationException('You cannot assign roles outside your department warehouse scope.');
            }
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

    /**
     * Returns the role levels visible/manageable within the given session scope type.
     * Returns null for global scope (no restriction).
     *
     * @return string[]|null
     */
    public function resolveAllowedLevelsForScope(string $scopeType): ?array
    {
        return match ($scopeType) {
            'central_warehouse'    => ['central_warehouse'],
            'outlet'               => ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse'],
            'outlet_warehouse'     => ['outlet_warehouse'],
            'outlet_department'    => ['outlet_department', 'department_warehouse'],
            'department_warehouse' => ['department_warehouse'],
            default                => null,
        };
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

        $emptyScopes = ['outlet' => [], 'outlet_warehouse' => [], 'outlet_department' => [], 'department_warehouse' => [], 'central_warehouse' => []];

        [$allowedScopeTypes, $allowedScopes] = match ($sessionScope['type']) {
            'central_warehouse' => (function () use ($sessionScope, $baseScopeTypes, $baseScopes, $emptyScopes) {
                $whId  = (int) $sessionScope['warehouse_id'];
                $types = array_values(array_intersect($baseScopeTypes, ['central_warehouse']));
                $scopes = $baseScopes === null
                    ? array_merge($emptyScopes, ['central_warehouse' => [$whId]])
                    : array_merge($emptyScopes, ['central_warehouse' => in_array($whId, $baseScopes['central_warehouse'], true) ? [$whId] : []]);
                return [$types, $scopes];
            })(),

            'outlet' => (function () use ($sessionScope, $baseScopeTypes, $baseScopes, $emptyScopes) {
                $outletId  = (int) $sessionScope['outlet_id'];
                $types     = array_values(array_intersect($baseScopeTypes, ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse']));
                $deptIds   = DB::table('outlet_departments')->where('outlet_id', $outletId)->pluck('id')->map(fn ($id) => (int) $id)->toArray();
                $outletWhIds = DB::table('warehouses')->where('outlet_id', $outletId)->where('type', 'outlet')->pluck('id')->map(fn ($id) => (int) $id)->toArray();
                $deptWhIds   = DB::table('warehouses')->where('outlet_id', $outletId)->where('type', 'department')->pluck('id')->map(fn ($id) => (int) $id)->toArray();
                $scopes = $baseScopes === null
                    ? array_merge($emptyScopes, ['outlet' => [$outletId], 'outlet_warehouse' => $outletWhIds, 'outlet_department' => $deptIds, 'department_warehouse' => $deptWhIds])
                    : array_merge($emptyScopes, [
                        'outlet'               => in_array($outletId, $baseScopes['outlet'], true) ? [$outletId] : [],
                        'outlet_warehouse'     => array_values(array_intersect($outletWhIds, $baseScopes['outlet_warehouse'])),
                        'outlet_department'    => array_values(array_intersect($deptIds, $baseScopes['outlet_department'])),
                        'department_warehouse' => array_values(array_intersect($deptWhIds, $baseScopes['department_warehouse'])),
                    ]);
                return [$types, $scopes];
            })(),

            'outlet_warehouse' => (function () use ($sessionScope, $baseScopeTypes, $baseScopes, $emptyScopes) {
                $outletId = (int) $sessionScope['outlet_id'];
                $whId     = (int) $sessionScope['warehouse_id'];
                $types    = array_values(array_intersect($baseScopeTypes, ['outlet_warehouse']));
                $scopes   = $baseScopes === null
                    ? array_merge($emptyScopes, ['outlet' => [$outletId], 'outlet_warehouse' => [$whId]])
                    : array_merge($emptyScopes, [
                        'outlet'           => [$outletId],
                        'outlet_warehouse' => in_array($whId, $baseScopes['outlet_warehouse'], true) ? [$whId] : [],
                    ]);
                return [$types, $scopes];
            })(),

            'outlet_department' => (function () use ($sessionScope, $baseScopeTypes, $baseScopes, $emptyScopes) {
                $outletId  = (int) $sessionScope['outlet_id'];
                $deptId    = (int) $sessionScope['department_id'];
                $types     = array_values(array_intersect($baseScopeTypes, ['outlet_department', 'department_warehouse']));
                $deptWhIds = DB::table('warehouses')->where('outlet_department_id', $deptId)->pluck('id')->map(fn ($id) => (int) $id)->toArray();
                $scopes = $baseScopes === null
                    ? array_merge($emptyScopes, ['outlet' => [$outletId], 'outlet_department' => [$deptId], 'department_warehouse' => $deptWhIds])
                    : array_merge($emptyScopes, [
                        'outlet'               => [$outletId],
                        'outlet_department'    => in_array($deptId, $baseScopes['outlet_department'], true) ? [$deptId] : [],
                        'department_warehouse' => array_values(array_intersect($deptWhIds, $baseScopes['department_warehouse'])),
                    ]);
                return [$types, $scopes];
            })(),

            'department_warehouse' => (function () use ($sessionScope, $baseScopeTypes, $baseScopes, $emptyScopes) {
                $outletId = (int) $sessionScope['outlet_id'];
                $deptId   = (int) $sessionScope['department_id'];
                $whId     = (int) $sessionScope['warehouse_id'];
                $types    = array_values(array_intersect($baseScopeTypes, ['department_warehouse']));
                $scopes   = $baseScopes === null
                    ? array_merge($emptyScopes, ['outlet' => [$outletId], 'outlet_department' => [$deptId], 'department_warehouse' => [$whId]])
                    : array_merge($emptyScopes, [
                        'outlet'               => [$outletId],
                        'outlet_department'    => [$deptId],
                        'department_warehouse' => in_array($whId, $baseScopes['department_warehouse'], true) ? [$whId] : [],
                    ]);
                return [$types, $scopes];
            })(),

            default => [$baseScopeTypes, $baseScopes],
        };

        return [
            'allowedScopes'     => $allowedScopes,
            'allowedScopeTypes' => $allowedScopeTypes,
            'scopeTypes'        => $this->getScopeTypesConfig(),
        ];
    }

    public function assertActorCanMutateScopedRecord(User $actor, string $scopeType, ?int $outletId, ?int $departmentId = null, ?int $warehouseId = null): void
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

        if ($scopeType === 'central_warehouse') {
            if ($warehouseId !== null && in_array($warehouseId, $allowedScopes['central_warehouse'], true)) {
                return;
            }
            abort(403, 'This record is outside your scope.');
        }

        if ($scopeType === 'outlet') {
            if ($outletId !== null && in_array($outletId, $allowedScopes['outlet'], true)) {
                return;
            }
            abort(403, 'This record is outside your scope.');
        }

        if ($scopeType === 'outlet_warehouse') {
            if ($outletId !== null && in_array($outletId, $allowedScopes['outlet'], true)) {
                return;
            }
            if ($warehouseId !== null && in_array($warehouseId, $allowedScopes['outlet_warehouse'], true)) {
                return;
            }
            abort(403, 'This record is outside your scope.');
        }

        if ($scopeType === 'outlet_department') {
            if ($outletId !== null && in_array($outletId, $allowedScopes['outlet'], true)) {
                return;
            }
            if ($departmentId !== null && in_array($departmentId, $allowedScopes['outlet_department'], true)) {
                return;
            }
            abort(403, 'This record is outside your scope.');
        }

        if ($scopeType === 'department_warehouse') {
            if ($outletId !== null && in_array($outletId, $allowedScopes['outlet'], true)) {
                return;
            }
            if ($departmentId !== null && in_array($departmentId, $allowedScopes['outlet_department'], true)) {
                return;
            }
            if ($warehouseId !== null && in_array($warehouseId, $allowedScopes['department_warehouse'], true)) {
                return;
            }
            abort(403, 'This record is outside your scope.');
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
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->exists();
    }

    private function resolveUserPermissions(User $user, string $scopeType, ?int $outletId, ?int $departmentId, ?int $warehouseId): array
    {
        $permissions = [];

        $roles = $this->getUserRoles($user, $scopeType, $outletId, $departmentId, $warehouseId);
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
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $departmentId, $warehouseId))
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

    private function hasDenyOverride(User $user, int $permissionId, string $scopeType, ?int $outletId, ?int $departmentId, ?int $warehouseId): bool
    {
        return $user->permissionOverrides()
            ->where('permission_id', $permissionId)
            ->where('effect', 'deny')
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $departmentId, $warehouseId))
            ->exists();
    }

    private function hasAllowOverride(User $user, int $permissionId, string $scopeType, ?int $outletId, ?int $departmentId, ?int $warehouseId): bool
    {
        return $user->permissionOverrides()
            ->where('permission_id', $permissionId)
            ->where('effect', 'allow')
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $departmentId, $warehouseId))
            ->exists();
    }

    private function roleGrantsPermission(User $user, int $permissionId, string $scopeType, ?int $outletId, ?int $departmentId, ?int $warehouseId): bool
    {
        return UserRoleAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->where(fn ($q) => $this->applyScopeCondition($q, $scopeType, $outletId, $departmentId, $warehouseId))
            ->whereHas('role', function ($q) use ($permissionId) {
                $q->where('is_active', true)
                    ->whereHas('permissions', fn ($q2) => $q2->where('permissions.id', $permissionId)->where('is_active', true));
            })
            ->exists();
    }

    private function applyScopeCondition(\Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder $query, string $scopeType, ?int $outletId, ?int $departmentId, ?int $warehouseId): void
    {
        if ($scopeType === 'global') {
            $query->where('scope_type', 'global');
            return;
        }

        $query->where(function ($q) use ($scopeType, $outletId, $departmentId, $warehouseId) {
            $q->where('scope_type', 'global');

            // central_warehouse: only global + that central_warehouse applies
            if ($scopeType === 'central_warehouse' && $warehouseId !== null) {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'central_warehouse')->where('warehouse_id', $warehouseId));
                return;
            }

            // outlet-level and below: global + outlet applies
            if ($outletId !== null) {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet')->where('outlet_id', $outletId));
            }

            // outlet_department / department_warehouse: also apply outlet_department records
            if (in_array($scopeType, ['outlet_department', 'department_warehouse'], true) && $departmentId !== null) {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet_department')->where('outlet_department_id', $departmentId));
            }

            // outlet_warehouse scope: apply outlet_warehouse records
            if ($scopeType === 'outlet_warehouse' && $warehouseId !== null) {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'outlet_warehouse')->where('warehouse_id', $warehouseId));
            }

            // department_warehouse scope: apply department_warehouse records
            if ($scopeType === 'department_warehouse' && $warehouseId !== null) {
                $q->orWhere(fn ($q2) => $q2->where('scope_type', 'department_warehouse')->where('warehouse_id', $warehouseId));
            }
        });
    }

    private function findPermission(string $slug): ?Permission
    {
        return Permission::where('slug', $slug)->where('is_active', true)->first();
    }

    private function permissionCacheKey(int $userId, string $scopeType, ?int $outletId, ?int $departmentId, ?int $warehouseId): string
    {
        $key = "user_permissions:{$userId}:{$scopeType}:o" . ($outletId ?? 'null') . ':d' . ($departmentId ?? 'null') . ':w' . ($warehouseId ?? 'null');

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
