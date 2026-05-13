<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleRankSeeder extends Seeder
{
    private array $rankMap = [
        'super-admin'       => 1,
        'admin'             => 10,
        'outlet-manager'    => 50,
        'warehouse-manager' => 50,
        'cashier'           => 80,
        'waiter'            => 90,
        'staff'             => 100,
        'warehouse-staff'   => 100,
    ];

    public function run(): void
    {
        foreach ($this->rankMap as $slug => $rank) {
            Role::where('slug', $slug)->update([
                'rank'          => $rank,
                'is_assignable' => $slug !== 'super-admin',
            ]);
        }
    }
}
