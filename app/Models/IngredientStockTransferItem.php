<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientStockTransferItem extends Model
{
    protected $fillable = [
        'ingredient_stock_transfer_id',
        'ingredient_id',
        'ingredient_batch_id',
        'requested_quantity',
        'dispatched_quantity',
        'received_quantity',
        'unit_cost',
        'total_cost',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'requested_quantity'  => 'decimal:4',
            'dispatched_quantity' => 'decimal:4',
            'received_quantity'   => 'decimal:4',
            'unit_cost'           => 'decimal:6',
            'total_cost'          => 'decimal:4',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(IngredientStockTransfer::class, 'ingredient_stock_transfer_id');
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
