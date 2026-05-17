<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\IngredientCategory;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class IngredientsSeeder extends Seeder
{
    /**
     * [category_slug, name, code, type, base_unit_short, purchase_unit_short, costing_method, is_perishable, track_expiry]
     */
    private array $ingredients = [
        // Vegetables
        ['vegetables', 'Tomato',         'VEG-001', 'raw_material', 'g',   'kg',  'weighted_average', true,  true],
        ['vegetables', 'Onion',          'VEG-002', 'raw_material', 'g',   'kg',  'weighted_average', true,  false],
        ['vegetables', 'Potato',         'VEG-003', 'raw_material', 'g',   'kg',  'weighted_average', true,  false],
        ['vegetables', 'Garlic',         'VEG-004', 'raw_material', 'g',   'kg',  'weighted_average', true,  false],
        ['vegetables', 'Ginger',         'VEG-005', 'raw_material', 'g',   'kg',  'weighted_average', true,  false],
        ['vegetables', 'Bell Pepper',    'VEG-006', 'raw_material', 'g',   'kg',  'weighted_average', true,  true],
        ['vegetables', 'Lettuce',        'VEG-007', 'raw_material', 'g',   'kg',  'weighted_average', true,  true],

        // Meat
        ['meat', 'Chicken Breast',       'MEA-001', 'raw_material', 'g',   'kg',  'fifo',             true,  true],
        ['meat', 'Beef Mince',           'MEA-002', 'raw_material', 'g',   'kg',  'fifo',             true,  true],
        ['meat', 'Lamb Shoulder',        'MEA-003', 'raw_material', 'g',   'kg',  'fifo',             true,  true],
        ['meat', 'Fish Fillet',          'MEA-004', 'raw_material', 'g',   'kg',  'fifo',             true,  true],

        // Dairy
        ['dairy', 'Whole Milk',          'DAI-001', 'raw_material', 'ml',  'ltr', 'fifo',             true,  true],
        ['dairy', 'Butter',              'DAI-002', 'raw_material', 'g',   'kg',  'fifo',             true,  true],
        ['dairy', 'Cheddar Cheese',      'DAI-003', 'raw_material', 'g',   'kg',  'fifo',             true,  true],
        ['dairy', 'Heavy Cream',         'DAI-004', 'raw_material', 'ml',  'ltr', 'fifo',             true,  true],
        ['dairy', 'Eggs',                'DAI-005', 'raw_material', 'pcs', 'pcs', 'fifo',             true,  true],

        // Spices
        ['spices', 'Salt',               'SPI-001', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['spices', 'Black Pepper',       'SPI-002', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['spices', 'Cumin',              'SPI-003', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['spices', 'Turmeric',           'SPI-004', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['spices', 'Paprika',            'SPI-005', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['spices', 'Cinnamon',           'SPI-006', 'raw_material', 'g',   'kg',  'weighted_average', false, false],

        // Grains
        ['grains', 'Basmati Rice',       'GRN-001', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['grains', 'All-Purpose Flour',  'GRN-002', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['grains', 'Semolina',           'GRN-003', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['grains', 'Bread Crumbs',       'GRN-004', 'raw_material', 'g',   'kg',  'weighted_average', false, false],
        ['grains', 'Pasta',              'GRN-005', 'raw_material', 'g',   'kg',  'weighted_average', false, false],

        // Oil
        ['oil', 'Sunflower Oil',         'OIL-001', 'raw_material', 'ml',  'ltr', 'weighted_average', false, false],
        ['oil', 'Olive Oil',             'OIL-002', 'raw_material', 'ml',  'ltr', 'weighted_average', false, false],

        // Sauces
        ['sauces', 'Tomato Ketchup',     'SAU-001', 'raw_material', 'ml',  'ltr', 'fifo',             false, true],
        ['sauces', 'Mayonnaise',         'SAU-002', 'raw_material', 'ml',  'ltr', 'fifo',             false, true],
        ['sauces', 'Soy Sauce',          'SAU-003', 'raw_material', 'ml',  'ltr', 'fifo',             false, true],
        ['sauces', 'Hot Sauce',          'SAU-004', 'raw_material', 'ml',  'ltr', 'fifo',             false, true],

        // Beverages
        ['beverages', 'Mineral Water',   'BEV-001', 'consumable',   'ml',  'ltr', 'fifo',             false, true],
        ['beverages', 'Orange Juice',    'BEV-002', 'consumable',   'ml',  'ltr', 'fifo',             true,  true],
        ['beverages', 'Coca-Cola',       'BEV-003', 'consumable',   'ml',  'ltr', 'fifo',             false, true],
    ];

    public function run(): void
    {
        $categories = IngredientCategory::pluck('id', 'slug');
        $units      = Unit::pluck('id', 'short_name');

        foreach ($this->ingredients as [
            $categorySlug,
            $name,
            $code,
            $type,
            $baseUnitShort,
            $purchaseUnitShort,
            $costingMethod,
            $isPerishable,
            $trackExpiry,
        ]) {
            $categoryId       = $categories[$categorySlug] ?? null;
            $baseUnitId       = $units[$baseUnitShort]       ?? null;
            $purchaseUnitId   = $units[$purchaseUnitShort]   ?? null;

            if (! $categoryId || ! $baseUnitId) {
                continue;
            }

            Ingredient::firstOrCreate(
                ['code' => $code],
                [
                    'ingredient_category_id'   => $categoryId,
                    'name'                     => $name,
                    'slug'                     => Str::slug($name),
                    'code'                     => $code,
                    'type'                     => $type,
                    'base_unit_id'             => $baseUnitId,
                    'default_purchase_unit_id' => $purchaseUnitId,
                    'default_usage_unit_id'    => $baseUnitId,
                    'costing_method'           => $costingMethod,
                    'is_perishable'            => $isPerishable,
                    'track_expiry'             => $trackExpiry,
                    'minimum_stock'            => 0,
                    'reorder_level'            => 0,
                    'reorder_quantity'         => 0,
                    'is_active'                => true,
                ]
            );
        }
    }
}
