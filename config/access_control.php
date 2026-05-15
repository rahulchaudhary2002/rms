<?php

return [
    /*
     * Scope types available for role assignments and permission overrides.
     */
    'scope_types' => [
        'global' => [
            'label' => 'Global',
        ],
        'central_warehouse' => [
            'label' => 'Central Warehouse',
        ],
        'outlet' => [
            'label' => 'Outlet',
        ],
        'outlet_warehouse' => [
            'label' => 'Outlet Warehouse',
        ],
        'outlet_department' => [
            'label' => 'Outlet Department',
        ],
        'department_warehouse' => [
            'label' => 'Department Warehouse',
        ],
    ],

    /*
     * Resource types available for resource-level permissions.
     */
    'resource_types' => [
        'outlet' => [
            'label'          => 'Outlet',
            'model'          => \App\Models\Outlet::class,
            'label_column'   => 'name',
            'search_columns' => ['name'],
        ],
        'warehouse' => [
            'label'          => 'Warehouse',
            'model'          => \App\Models\Warehouse::class,
            'label_column'   => 'name',
            'search_columns' => ['name'],
        ],
        'outlet_department' => [
            'label'          => 'Department',
            'model'          => \App\Models\OutletDepartment::class,
            'label_column'   => 'name',
            'search_columns' => ['name'],
        ],
        'user' => [
            'label'          => 'User',
            'model'          => \App\Models\User::class,
            'label_column'   => 'name',
            'search_columns' => ['name', 'email'],
        ],
        'role' => [
            'label'          => 'Role',
            'model'          => \App\Models\Role::class,
            'label_column'   => 'name',
            'search_columns' => ['name', 'slug'],
        ],
        'permission' => [
            'label'          => 'Permission',
            'model'          => \App\Models\Permission::class,
            'label_column'   => 'name',
            'search_columns' => ['name', 'slug'],
        ],
    ],
];
