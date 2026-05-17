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
        'outlet-departments',
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

    private array $inventoryModules = [
        'warehouse-ingredient-stocks',
        'ingredient-batches',
        'ingredient-stock-transfers',
        'ingredient-wastages',
        'ingredient-stock-adjustments',
        'ingredient-stock-counts',
    ];

    private array $purchaseModules = [
        'suppliers',
        'purchase-orders',
        'purchase-receives',
        'purchase-invoices',
        'supplier-payments',
        'purchase-returns',
    ];

    private array $customPurchasePermissions = [
        ['module' => 'purchase-orders',   'action' => 'approve', 'name' => 'Purchase Orders Approve'],
        ['module' => 'purchase-receives', 'action' => 'post',    'name' => 'Purchase Receives Post'],
        ['module' => 'purchase-returns',  'action' => 'post',    'name' => 'Purchase Returns Post'],
    ];

    private array $customInventoryPermissions = [
        ['module' => 'inventory',                          'action' => 'view',                'name' => 'Inventory View'],
        ['module' => 'inventory',                          'action' => 'manage',              'name' => 'Inventory Manage'],

        ['module' => 'ingredient-inventory-transactions',  'action' => 'view',                'name' => 'Ingredient Inventory Transactions View'],
        ['module' => 'ingredient-inventory-transactions',  'action' => 'export',              'name' => 'Ingredient Inventory Transactions Export'],

        ['module' => 'ingredient-stock-transfers',         'action' => 'request',             'name' => 'Ingredient Stock Transfers Request'],
        ['module' => 'ingredient-stock-transfers',         'action' => 'dispatch',            'name' => 'Ingredient Stock Transfers Dispatch'],
        ['module' => 'ingredient-stock-transfers',         'action' => 'receive',             'name' => 'Ingredient Stock Transfers Receive'],
        ['module' => 'ingredient-stock-transfers',         'action' => 'cancel',              'name' => 'Ingredient Stock Transfers Cancel'],

        ['module' => 'ingredient-wastages',                'action' => 'cancel',              'name' => 'Ingredient Wastages Cancel'],

        ['module' => 'ingredient-stock-adjustments',       'action' => 'cancel',              'name' => 'Ingredient Stock Adjustments Cancel'],

        ['module' => 'ingredient-stock-counts',            'action' => 'start',               'name' => 'Ingredient Stock Counts Start'],
        ['module' => 'ingredient-stock-counts',            'action' => 'complete',            'name' => 'Ingredient Stock Counts Complete'],
        ['module' => 'ingredient-stock-counts',            'action' => 'generate-adjustment', 'name' => 'Ingredient Stock Counts Generate Adjustment'],
        ['module' => 'ingredient-stock-counts',            'action' => 'cancel',              'name' => 'Ingredient Stock Counts Cancel'],
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
            'name'          => 'Central Warehouse Manager',
            'slug'          => 'central-warehouse-manager',
            'level'         => 'central_warehouse',
            'rank'          => 30,
            'description'   => 'Manages a central warehouse.',
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
            'name'          => 'Outlet Warehouse Manager',
            'slug'          => 'outlet-warehouse-manager',
            'level'         => 'outlet_warehouse',
            'rank'          => 60,
            'description'   => 'Manages a specific outlet warehouse.',
            'is_system'     => true,
            'is_assignable' => true,
        ],
        [
            'name'          => 'Department Manager',
            'slug'          => 'department-manager',
            'level'         => 'outlet_department',
            'rank'          => 60,
            'description'   => 'Manages a specific outlet department.',
            'is_system'     => true,
            'is_assignable' => true,
        ],
        [
            'name'          => 'Department Warehouse Manager',
            'slug'          => 'department-warehouse-manager',
            'level'         => 'department_warehouse',
            'rank'          => 70,
            'description'   => 'Manages a specific department warehouse.',
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
            $this->seedInventoryPermissions();
            $this->seedPurchasePermissions();
            $this->seedRoles();
            $this->assignDefaultAdminPermissions();
            $this->assignInventoryRolePermissions();
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

    private function seedPurchasePermissions(): void
    {
        $purchaseActions = ['view', 'create', 'edit', 'delete'];

        foreach ($this->purchaseModules as $module) {
            foreach ($purchaseActions as $action) {
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

        foreach ($this->customPurchasePermissions as $permission) {
            $slug = "{$permission['module']}-{$permission['action']}";

            Permission::firstOrCreate(
                ['slug' => $slug],
                [
                    'name'      => $permission['name'],
                    'module'    => $permission['module'],
                    'action'    => $permission['action'],
                    'level'     => 'global',
                    'is_system' => true,
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedInventoryPermissions(): void
    {
        foreach ($this->inventoryModules as $module) {
            foreach ($this->actions as $action) {
                $slug = "{$module}-{$action}";
                $name = ucwords(str_replace('-', ' ', $module)).' '.ucwords($action);

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

        foreach ($this->customInventoryPermissions as $permission) {
            $slug = "{$permission['module']}-{$permission['action']}";

            Permission::firstOrCreate(
                ['slug' => $slug],
                [
                    'name'      => $permission['name'],
                    'module'    => $permission['module'],
                    'action'    => $permission['action'],
                    'level'     => 'global',
                    'is_system' => true,
                    'is_active' => true,
                ]
            );
        }
    }

    private function assignInventoryRolePermissions(): void
    {
        $this->assignRolePermissions('central-warehouse-manager', [
            'inventory-view',
            'warehouse-ingredient-stocks-view',
            'warehouse-ingredient-stocks-export',
            'ingredient-batches-view',
            'ingredient-batches-create',
            'ingredient-batches-update',
            'ingredient-batches-export',
            'ingredient-inventory-transactions-view',
            'ingredient-inventory-transactions-export',
            'ingredient-stock-transfers-view',
            'ingredient-stock-transfers-create',
            'ingredient-stock-transfers-update',
            'ingredient-stock-transfers-request',
            'ingredient-stock-transfers-dispatch',
            'ingredient-stock-transfers-receive',
            'ingredient-stock-transfers-cancel',
            'ingredient-stock-transfers-export',
            'ingredient-wastages-view',
            'ingredient-wastages-create',
            'ingredient-wastages-update',
            'ingredient-wastages-cancel',
            'ingredient-wastages-export',
            'ingredient-stock-counts-view',
            'ingredient-stock-counts-create',
            'ingredient-stock-counts-update',
            'ingredient-stock-counts-start',
            'ingredient-stock-counts-complete',
            'ingredient-stock-counts-generate-adjustment',
            'ingredient-stock-counts-export',
        ]);

        $this->assignRolePermissions('outlet-manager', [
            'inventory-view',
            'warehouse-ingredient-stocks-view',
            'ingredient-batches-view',
            'ingredient-inventory-transactions-view',
            'ingredient-stock-transfers-view',
            'ingredient-stock-transfers-create',
            'ingredient-stock-transfers-request',
            'ingredient-stock-transfers-receive',
            'ingredient-wastages-view',
            'ingredient-wastages-create',
            'ingredient-stock-adjustments-view',
            'ingredient-stock-counts-view',
            'ingredient-stock-counts-create',
            'ingredient-stock-counts-start',
            'ingredient-stock-counts-complete',
        ]);

        $this->assignRolePermissions('staff', [
            'inventory-view',
            'warehouse-ingredient-stocks-view',
            'ingredient-batches-view',
            'ingredient-stock-transfers-view',
            'ingredient-wastages-view',
            'ingredient-wastages-create',
            'ingredient-stock-counts-view',
        ]);
    }

    private function assignRolePermissions(string $roleSlug, array $permissionSlugs): void
    {
        $role = Role::where('slug', $roleSlug)->first();

        if (! $role) {
            return;
        }

        $ids = Permission::whereIn('slug', $permissionSlugs)->pluck('id');

        $role->permissions()->syncWithoutDetaching($ids);
    }
}
