<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReturnItem extends Model
{
    protected $fillable = [
        'purchase_return_id',
        'ingredient_id',
        'ingredient_batch_id',
        'unit_id',
        'quantity',
        'unit_price',
        'line_total',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'quantity'   => 'decimal:4',
            'unit_price' => 'decimal:4',
            'line_total' => 'decimal:4',
        ];
    }

    public function purchaseReturn(): BelongsTo
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(IngredientBatch::class, 'ingredient_batch_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
