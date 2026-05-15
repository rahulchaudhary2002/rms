<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AddonRecipe extends Model
{
    protected $fillable = [
        'addon_id',
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

    public function addon(): BelongsTo
    {
        return $this->belongsTo(Addon::class);
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
