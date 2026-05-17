<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class IngredientInventoryTransaction extends Model
{
    protected $fillable = [
        'ingredient_id',
        'warehouse_id',
        'ingredient_batch_id',
        'transaction_type',
        'quantity_in',
        'quantity_out',
        'balance_after',
        'unit_cost',
        'total_cost',
        'reference_type',
        'reference_id',
        'remarks',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity_in'   => 'decimal:4',
            'quantity_out'  => 'decimal:4',
            'balance_after' => 'decimal:4',
            'unit_cost'     => 'decimal:6',
            'total_cost'    => 'decimal:4',
        ];
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(IngredientBatch::class, 'ingredient_batch_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
