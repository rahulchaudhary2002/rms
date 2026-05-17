<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseIngredientStock extends Model
{
    protected $fillable = [
        'warehouse_id',
        'ingredient_id',
        'quantity',
        'average_cost',
        'stock_value',
    ];

    protected function casts(): array
    {
        return [
            'quantity'     => 'decimal:4',
            'average_cost' => 'decimal:6',
            'stock_value'  => 'decimal:4',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
