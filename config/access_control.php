<?php

return [
    /*
     * Scope types available for role assignments and permission overrides.
     * These are the resource contexts a role/permission can be restricted to.
     * "global" is always implicitly available and not listed here.
     */
    'scope_types' => [
        'outlet' => [
            'label' => 'Outlet',
        ],
        'warehouse' => [
            'label' => 'Warehouse',
        ],
    ],

    /*
     * Resource types available for resource-level permissions.
     * Each entry maps a type key to its Eloquent model and display config,
     * used by the async resource lookup endpoint.
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
