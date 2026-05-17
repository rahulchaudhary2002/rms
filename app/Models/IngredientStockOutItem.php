<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientStockOutItem extends Model
{
    protected $fillable = [
        'ingredient_stock_out_id',
        'ingredient_id',
        'ingredient_batch_id',
        'quantity',
        'unit_cost',
        'total_cost',
    ];

    protected function casts(): array
    {
        return [
            'quantity'   => 'decimal:4',
            'unit_cost'  => 'decimal:6',
            'total_cost' => 'decimal:4',
        ];
    }

    public function stockOut(): BelongsTo
    {
        return $this->belongsTo(IngredientStockOut::class, 'ingredient_stock_out_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(IngredientBatch::class, 'ingredient_batch_id');
    }
}
