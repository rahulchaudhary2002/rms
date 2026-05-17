<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReceiveItem extends Model
{
    protected $fillable = [
        'purchase_receive_id',
        'purchase_order_item_id',
        'ingredient_id',
        'unit_id',
        'ordered_quantity',
        'received_quantity',
        'rejected_quantity',
        'accepted_quantity',
        'unit_price',
        'line_total',
        'batch_no',
        'manufactured_date',
        'expiry_date',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'ordered_quantity'   => 'decimal:4',
            'received_quantity'  => 'decimal:4',
            'rejected_quantity'  => 'decimal:4',
            'accepted_quantity'  => 'decimal:4',
            'unit_price'         => 'decimal:4',
            'line_total'         => 'decimal:4',
            'manufactured_date'  => 'date',
            'expiry_date'        => 'date',
        ];
    }

    public function purchaseReceive(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceive::class);
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
