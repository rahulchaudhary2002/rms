<?php

namespace Database\Seeders;

use App\Models\Unit;
use App\Models\UnitConversion;
use Illuminate\Database\Seeder;

class UnitsAndConversionsSeeder extends Seeder
{
    private array $units = [
        ['name' => 'Gram',      'short_name' => 'g',     'type' => 'weight',   'is_base' => true],
        ['name' => 'Kilogram',  'short_name' => 'kg',    'type' => 'weight',   'is_base' => false],
        ['name' => 'Milliliter','short_name' => 'ml',    'type' => 'volume',   'is_base' => true],
        ['name' => 'Liter',     'short_name' => 'ltr',   'type' => 'volume',   'is_base' => false],
        ['name' => 'Piece',     'short_name' => 'pcs',   'type' => 'quantity', 'is_base' => true],
        ['name' => 'Packet',    'short_name' => 'pkt',   'type' => 'quantity', 'is_base' => false],
        ['name' => 'Carton',    'short_name' => 'ctn',   'type' => 'quantity', 'is_base' => false],
        ['name' => 'Dozen',     'short_name' => 'dozen', 'type' => 'quantity', 'is_base' => false],
    ];

    private array $conversions = [
        ['from' => 'kg',    'to' => 'g',     'multiplier' => 1000.0],
        ['from' => 'g',     'to' => 'kg',    'multiplier' => 0.001],
        ['from' => 'ltr',   'to' => 'ml',    'multiplier' => 1000.0],
        ['from' => 'ml',    'to' => 'ltr',   'multiplier' => 0.001],
        ['from' => 'dozen', 'to' => 'pcs',   'multiplier' => 12.0],
        ['from' => 'pcs',   'to' => 'dozen', 'multiplier' => 0.083333],
    ];

    public function run(): void
    {
        $this->seedUnits();
        $this->seedConversions();
    }

    private function seedUnits(): void
    {
        foreach ($this->units as $unit) {
            Unit::firstOrCreate(
                ['short_name' => $unit['short_name'], 'type' => $unit['type']],
                array_merge($unit, ['is_active' => true])
            );
        }
    }

    private function seedConversions(): void
    {
        $unitMap = Unit::pluck('id', 'short_name');

        foreach ($this->conversions as $conversion) {
            $fromId = $unitMap[$conversion['from']] ?? null;
            $toId   = $unitMap[$conversion['to']] ?? null;

            if ($fromId === null || $toId === null) {
                continue;
            }

            UnitConversion::firstOrCreate(
                ['from_unit_id' => $fromId, 'to_unit_id' => $toId],
                ['multiplier' => $conversion['multiplier'], 'is_active' => true]
            );
        }
    }
}
