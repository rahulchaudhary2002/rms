<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseInvoice extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'purchase_order_id',
        'purchase_receive_id',
        'invoice_no',
        'supplier_invoice_no',
        'invoice_date',
        'due_date',
        'status',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'shipping_amount',
        'grand_total',
        'paid_amount',
        'due_amount',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date'    => 'date',
            'due_date'        => 'date',
            'subtotal'        => 'decimal:4',
            'discount_amount' => 'decimal:4',
            'tax_amount'      => 'decimal:4',
            'shipping_amount' => 'decimal:4',
            'grand_total'     => 'decimal:4',
            'paid_amount'     => 'decimal:4',
            'due_amount'      => 'decimal:4',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function purchaseReceive(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceive::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseInvoiceItem::class);
    }

    public function paymentAllocations(): HasMany
    {
        return $this->hasMany(SupplierPaymentAllocation::class);
    }

    public function purchaseReturns(): HasMany
    {
        return $this->hasMany(PurchaseReturn::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
