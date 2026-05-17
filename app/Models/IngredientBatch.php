<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class IngredientBatch extends Model
{
    protected $fillable = [
        'ingredient_id',
        'warehouse_id',
        'batch_no',
        'received_quantity',
        'available_quantity',
        'unit_cost',
        'total_cost',
        'manufactured_date',
        'expiry_date',
        'source_type',
        'source_id',
        'is_closed',
    ];

    protected function casts(): array
    {
        return [
            'received_quantity'  => 'decimal:4',
            'available_quantity' => 'decimal:4',
            'unit_cost'          => 'decimal:6',
            'total_cost'         => 'decimal:4',
            'manufactured_date'  => 'date',
            'expiry_date'        => 'date',
            'is_closed'          => 'boolean',
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

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(IngredientInventoryTransaction::class);
    }
}
