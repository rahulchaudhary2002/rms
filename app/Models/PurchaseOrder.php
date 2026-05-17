<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'warehouse_id',
        'purchase_order_no',
        'order_date',
        'expected_delivery_date',
        'status',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'shipping_amount',
        'grand_total',
        'notes',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'order_date'               => 'date',
            'expected_delivery_date'   => 'date',
            'approved_at'              => 'datetime',
            'subtotal'                 => 'decimal:4',
            'discount_amount'          => 'decimal:4',
            'tax_amount'               => 'decimal:4',
            'shipping_amount'          => 'decimal:4',
            'grand_total'              => 'decimal:4',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function receives(): HasMany
    {
        return $this->hasMany(PurchaseReceive::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(PurchaseInvoice::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
