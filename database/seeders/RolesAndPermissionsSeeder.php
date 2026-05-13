<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRoleAssignment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    private array $modules = [
        'access-control',
        'users',
        'roles',
        'permissions',
        'outlets',
        'warehouses',
        'inventory',
        'purchases',
        'sales',
        'reports',
        'settings',
    ];

    private array $actions = [
        'view',
        'create',
        'update',
        'delete',
        'approve',
        'export',
        'manage',
    ];

    private array $systemRoles = [
        [
            'name'        => 'Super Admin',
            'slug'        => 'super-admin',
            'level'       => 'global',
            'description' => 'Full access to everything.',
            'is_system'   => true,
        ],
        [
            'name'        => 'Admin',
            'slug'        => 'admin',
            'level'       => 'global',
            'description' => 'Administrative access.',
            'is_system'   => true,
        ],
        [
            'name'        => 'Outlet Manager',
            'slug'        => 'outlet-manager',
            'level'       => 'outlet',
            'description' => 'Manages a specific outlet.',
            'is_system'   => true,
        ],
        [
            'name'        => 'Warehouse Manager',
            'slug'        => 'warehouse-manager',
            'level'       => 'warehouse',
            'description' => 'Manages a specific warehouse.',
            'is_system'   => true,
        ],
        [
            'name'        => 'Staff',
            'slug'        => 'staff',
            'level'       => 'outlet',
            'description' => 'General staff member.',
            'is_system'   => true,
        ],
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $this->seedPermissions();
            $this->seedRoles();
            $this->assignSuperAdminPermissions();
            $this->assignDefaultAdminPermissions();
            $this->assignFirstUserAsSuperAdmin();
        });
    }

    private function seedPermissions(): void
    {
        foreach ($this->modules as $module) {
            foreach ($this->actions as $action) {
                $slug = "{$module}-{$action}";
                $name = ucwords(str_replace('-', ' ', $module)) . ' ' . ucwords($action);

                Permission::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'name'      => $name,
                        'module'    => $module,
                        'action'    => $action,
                        'level'     => 'global',
                        'is_system' => true,
                        'is_active' => true,
                    ]
                );
            }
        }
    }

    private function seedRoles(): void
    {
        foreach ($this->systemRoles as $roleData) {
            Role::firstOrCreate(
                ['slug' => $roleData['slug']],
                array_merge($roleData, ['is_active' => true])
            );
        }
    }

    private function assignSuperAdminPermissions(): void
    {
        $superAdmin = Role::where('slug', 'super-admin')->first();

        if (! $superAdmin) {
            return;
        }

        $allPermissionIds = Permission::pluck('id');
        $superAdmin->permissions()->sync($allPermissionIds);
    }

    private function assignDefaultAdminPermissions(): void
    {
        $admin = Role::where('slug', 'admin')->first();

        if (! $admin) {
            return;
        }

        // Admin gets everything except super-admin-only operations
        $permissions = Permission::whereNotIn('module', ['settings'])
            ->orWhere(fn ($q) => $q->where('module', 'settings')->where('action', 'view'))
            ->pluck('id');

        $admin->permissions()->sync($permissions);
    }

    private function assignFirstUserAsSuperAdmin(): void
    {
        $user = User::orderBy('id')->first();

        if (! $user) {
            return;
        }

        $superAdminRole = Role::where('slug', 'super-admin')->first();

        if (! $superAdminRole) {
            return;
        }

        $user->update(['is_superadmin' => true]);

        UserRoleAssignment::firstOrCreate(
            [
                'user_id'    => $user->id,
                'role_id'    => $superAdminRole->id,
                'scope_type' => 'global',
                'scope_id'   => null,
            ],
            [
                'is_active'   => true,
                'assigned_by' => null,
            ]
        );
    }
}
