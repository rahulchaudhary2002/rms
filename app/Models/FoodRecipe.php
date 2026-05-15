<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodRecipe extends Model
{
    protected $fillable = [
        'food_id',
        'food_variant_id',
        'ingredient_id',
        'unit_id',
        'quantity',
        'wastage_quantity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'quantity'         => 'decimal:4',
            'wastage_quantity' => 'decimal:4',
            'is_active'        => 'boolean',
        ];
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(FoodVariant::class, 'food_variant_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
