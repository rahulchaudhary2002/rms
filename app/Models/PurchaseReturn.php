<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseReturn extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'warehouse_id',
        'purchase_receive_id',
        'purchase_invoice_id',
        'return_no',
        'return_date',
        'status',
        'subtotal',
        'tax_amount',
        'grand_total',
        'reason',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected function casts(): array
    {
        return [
            'return_date'  => 'date',
            'posted_at'    => 'datetime',
            'subtotal'     => 'decimal:4',
            'tax_amount'   => 'decimal:4',
            'grand_total'  => 'decimal:4',
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

    public function purchaseReceive(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceive::class);
    }

    public function purchaseInvoice(): BelongsTo
    {
        return $this->belongsTo(PurchaseInvoice::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function inventoryTransactions(): MorphMany
    {
        return $this->morphMany(IngredientInventoryTransaction::class, 'reference');
    }
}
