<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodComboItem extends Model
{
    protected $fillable = [
        'combo_food_id',
        'combo_food_variant_id',
        'food_id',
        'food_variant_id',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    public function comboFood(): BelongsTo
    {
        return $this->belongsTo(Food::class, 'combo_food_id');
    }

    public function comboFoodVariant(): BelongsTo
    {
        return $this->belongsTo(FoodVariant::class, 'combo_food_variant_id');
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class, 'food_id');
    }

    public function foodVariant(): BelongsTo
    {
        return $this->belongsTo(FoodVariant::class, 'food_variant_id');
    }
}
