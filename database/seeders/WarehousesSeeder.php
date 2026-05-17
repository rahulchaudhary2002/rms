<?php

namespace Database\Seeders;

use App\Models\Outlet;
use App\Models\OutletDepartment;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehousesSeeder extends Seeder
{
    public function run(): void
    {
        // Central warehouse - not tied to any outlet
        Warehouse::firstOrCreate(
            ['code' => 'CW-MAIN'],
            [
                'name'       => 'Central Warehouse',
                'type'       => 'central',
                'is_default' => true,
                'is_active'  => true,
            ]
        );

        // Per-outlet warehouses
        $outlets = Outlet::with('departments')->get();

        foreach ($outlets as $outlet) {
            $code = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $outlet->name), 0, 6));

            // Outlet-level warehouse
            Warehouse::firstOrCreate(
                ['code' => "{$code}-WH"],
                [
                    'outlet_id'  => $outlet->id,
                    'name'       => "{$outlet->name} - Warehouse",
                    'type'       => 'outlet',
                    'is_default' => true,
                    'is_active'  => true,
                ]
            );

            // Department-level warehouses (Kitchen and Store only)
            $deptTypes = ['kitchen', 'store'];
            foreach ($outlet->departments->whereIn('type', $deptTypes) as $dept) {
                $deptCode = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $dept->name), 0, 4));
                Warehouse::firstOrCreate(
                    ['code' => "{$code}-{$deptCode}-WH"],
                    [
                        'outlet_id'             => $outlet->id,
                        'outlet_department_id'  => $dept->id,
                        'name'                  => "{$outlet->name} - {$dept->name} Store",
                        'type'                  => 'department',
                        'is_default'            => false,
                        'is_active'             => true,
                    ]
                );
            }
        }
    }
}
