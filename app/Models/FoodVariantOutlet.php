<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodVariantOutlet extends Model
{
    protected $fillable = [
        'food_variant_id',
        'outlet_id',
        'price',
        'is_available',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price'        => 'decimal:2',
            'is_available' => 'boolean',
            'is_active'    => 'boolean',
        ];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(FoodVariant::class, 'food_variant_id');
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
