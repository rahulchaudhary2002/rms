<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class DiningPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['module' => 'dining-areas',       'action' => 'view',   'name' => 'Dining Areas View'],
            ['module' => 'dining-areas',       'action' => 'create', 'name' => 'Dining Areas Create'],
            ['module' => 'dining-areas',       'action' => 'update', 'name' => 'Dining Areas Update'],
            ['module' => 'dining-areas',       'action' => 'delete', 'name' => 'Dining Areas Delete'],
            ['module' => 'dining-tables',      'action' => 'view',   'name' => 'Dining Tables View'],
            ['module' => 'dining-tables',      'action' => 'create', 'name' => 'Dining Tables Create'],
            ['module' => 'dining-tables',      'action' => 'update', 'name' => 'Dining Tables Update'],
            ['module' => 'dining-tables',      'action' => 'delete', 'name' => 'Dining Tables Delete'],
            ['module' => 'dining-table-layout', 'action' => 'view',   'name' => 'Dining Table Layout View'],
            ['module' => 'dining-table-layout', 'action' => 'update', 'name' => 'Dining Table Layout Update'],
        ];

        $createdIds = [];

        foreach ($permissions as $data) {
            $slug = "{$data['module']}-{$data['action']}";

            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                [
                    'name'      => $data['name'],
                    'module'    => $data['module'],
                    'action'    => $data['action'],
                    'level'     => 'global',
                    'is_system' => true,
                    'is_active' => true,
                ]
            );

            $createdIds[] = $permission->id;
        }

        // Grant all dining permissions to the admin role
        $admin = Role::where('slug', 'admin')->first();
        if ($admin) {
            $admin->permissions()->syncWithoutDetaching($createdIds);
        }
    }
}
