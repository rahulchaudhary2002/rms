<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
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
        'units',
        'unit-conversions',
        'ingredient-categories',
        'ingredients',
        'countries',
        'states',
        'cities',
        'customers',
        'loyalty-point-rules',
        'food-categories',
        'foods',
        'addon-groups',
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
            'name'          => 'Admin',
            'slug'          => 'admin',
            'level'         => 'global',
            'rank'          => 10,
            'description'   => 'Administrative access.',
            'is_system'     => true,
            'is_assignable' => true,
        ],
        [
            'name'          => 'Outlet Manager',
            'slug'          => 'outlet-manager',
            'level'         => 'outlet',
            'rank'          => 50,
            'description'   => 'Manages a specific outlet.',
            'is_system'     => true,
            'is_assignable' => true,
        ],
        [
            'name'          => 'Warehouse Manager',
            'slug'          => 'warehouse-manager',
            'level'         => 'warehouse',
            'rank'          => 50,
            'description'   => 'Manages a specific warehouse.',
            'is_system'     => true,
            'is_assignable' => true,
        ],
        [
            'name'          => 'Staff',
            'slug'          => 'staff',
            'level'         => 'outlet',
            'rank'          => 100,
            'description'   => 'General staff member.',
            'is_system'     => true,
            'is_assignable' => true,
        ],
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $this->seedPermissions();
            $this->seedRoles();
            $this->assignDefaultAdminPermissions();
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

        $admin->permissions()->syncWithoutDetaching($permissions);
    }
}
