<?php

return [
    /*
     * Defines the resource types available for resource-level permissions and scope assignments.
     * Each entry maps a type key to its Eloquent model and display config.
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
    ],
];
