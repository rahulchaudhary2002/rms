<?php

namespace Database\Seeders;

use App\Models\IngredientCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class IngredientCategoriesSeeder extends Seeder
{
    private array $categories = [
        'Vegetables',
        'Meat',
        'Dairy',
        'Spices',
        'Grains',
        'Oil',
        'Sauces',
        'Beverages',
    ];

    public function run(): void
    {
        foreach ($this->categories as $name) {
            IngredientCategory::firstOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name'      => $name,
                    'is_active' => true,
                ]
            );
        }
    }
}
