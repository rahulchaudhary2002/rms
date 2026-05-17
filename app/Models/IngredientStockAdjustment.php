<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class IngredientStockAdjustment extends Model
{
    protected $fillable = [
        'adjustment_no',
        'warehouse_id',
        'adjustment_date',
        'status',
        'reason',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'adjustment_date' => 'date',
            'approved_at'     => 'datetime',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(IngredientStockAdjustmentItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function inventoryTransactions(): MorphMany
    {
        return $this->morphMany(IngredientInventoryTransaction::class, 'reference');
    }
}
