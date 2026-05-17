<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientStockAdjustmentItem extends Model
{
    protected $fillable = [
        'ingredient_stock_adjustment_id',
        'ingredient_id',
        'ingredient_batch_id',
        'system_quantity',
        'actual_quantity',
        'difference_quantity',
        'unit_cost',
        'difference_value',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'system_quantity'     => 'decimal:4',
            'actual_quantity'     => 'decimal:4',
            'difference_quantity' => 'decimal:4',
            'unit_cost'           => 'decimal:6',
            'difference_value'    => 'decimal:4',
        ];
    }

    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(IngredientStockAdjustment::class, 'ingredient_stock_adjustment_id');
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
