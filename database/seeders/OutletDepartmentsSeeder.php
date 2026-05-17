<?php

namespace Database\Seeders;

use App\Models\Outlet;
use App\Models\OutletDepartment;
use Illuminate\Database\Seeder;

class OutletDepartmentsSeeder extends Seeder
{
    /**
     * Departments to seed per outlet (by outlet name).
     * Each outlet gets the same standard departments.
     */
    private array $departments = [
        ['name' => 'Kitchen',   'code' => 'KIT', 'type' => 'kitchen',  'description' => 'Main kitchen operations'],
        ['name' => 'Bar',       'code' => 'BAR', 'type' => 'bar',      'description' => 'Beverage and bar operations'],
        ['name' => 'Counter',   'code' => 'CTR', 'type' => 'counter',  'description' => 'Front counter and service'],
        ['name' => 'Store',     'code' => 'STR', 'type' => 'store',    'description' => 'Dry goods and general storage'],
        ['name' => 'Bakery',    'code' => 'BKY', 'type' => 'bakery',   'description' => 'Bakery and pastry production'],
    ];

    public function run(): void
    {
        $outlets = Outlet::all();

        foreach ($outlets as $outlet) {
            foreach ($this->departments as $dept) {
                OutletDepartment::firstOrCreate(
                    [
                        'outlet_id' => $outlet->id,
                        'code'      => $dept['code'],
                    ],
                    [
                        'name'        => $dept['name'],
                        'type'        => $dept['type'],
                        'description' => $dept['description'],
                        'is_active'   => true,
                    ]
                );
            }
        }
    }
}
