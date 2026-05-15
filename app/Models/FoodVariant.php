<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FoodVariant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'food_id',
        'name',
        'sku',
        'price',
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price'      => 'decimal:2',
            'is_default' => 'boolean',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function outletSettings(): HasMany
    {
        return $this->hasMany(FoodVariantOutlet::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(FoodRecipe::class, 'food_variant_id');
    }

    public function comboItemsAsComboVariant(): HasMany
    {
        return $this->hasMany(FoodComboItem::class, 'combo_food_variant_id');
    }

    public function comboItemsAsChildVariant(): HasMany
    {
        return $this->hasMany(FoodComboItem::class, 'food_variant_id');
    }
}
