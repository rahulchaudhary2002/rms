<?php

namespace Database\Seeders;

use App\Models\Outlet;
use Illuminate\Database\Seeder;

class OutletsSeeder extends Seeder
{
    private array $outlets = [
        ['name' => 'Main Branch'],
        ['name' => 'Downtown Branch'],
        ['name' => 'Airport Branch'],
    ];

    public function run(): void
    {
        foreach ($this->outlets as $data) {
            Outlet::firstOrCreate(['name' => $data['name']]);
        }
    }
}
