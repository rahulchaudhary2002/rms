<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientStockCountItem extends Model
{
    protected $fillable = [
        'ingredient_stock_count_id',
        'ingredient_id',
        'ingredient_batch_id',
        'system_quantity',
        'counted_quantity',
        'difference_quantity',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'system_quantity'     => 'decimal:4',
            'counted_quantity'    => 'decimal:4',
            'difference_quantity' => 'decimal:4',
        ];
    }

    public function count(): BelongsTo
    {
        return $this->belongsTo(IngredientStockCount::class, 'ingredient_stock_count_id');
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
