<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierPaymentAllocation extends Model
{
    protected $fillable = [
        'supplier_payment_id',
        'purchase_invoice_id',
        'allocated_amount',
    ];

    protected function casts(): array
    {
        return [
            'allocated_amount' => 'decimal:4',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(SupplierPayment::class, 'supplier_payment_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(PurchaseInvoice::class, 'purchase_invoice_id');
    }
}
