<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class IngredientStockTransfer extends Model
{
    protected $fillable = [
        'transfer_no',
        'from_warehouse_id',
        'to_warehouse_id',
        'transfer_date',
        'status',
        'remarks',
        'requested_by',
        'approved_by',
        'dispatched_by',
        'received_by',
        'approved_at',
        'dispatched_at',
        'received_at',
    ];

    protected function casts(): array
    {
        return [
            'transfer_date' => 'date',
            'approved_at'   => 'datetime',
            'dispatched_at' => 'datetime',
            'received_at'   => 'datetime',
        ];
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(IngredientStockTransferItem::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function dispatchedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dispatched_by');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function inventoryTransactions(): MorphMany
    {
        return $this->morphMany(IngredientInventoryTransaction::class, 'reference');
    }
}
