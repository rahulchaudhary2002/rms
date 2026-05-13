<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\User;
use App\Models\UserRoleAssignment;
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

        // Apply overrides — inherits outlet-level overrides when in warehouse scope
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
