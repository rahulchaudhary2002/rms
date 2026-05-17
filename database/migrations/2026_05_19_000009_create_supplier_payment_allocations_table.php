<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_payment_id')->constrained('supplier_payments')->cascadeOnDelete();
            $table->foreignId('purchase_invoice_id')->constrained('purchase_invoices')->cascadeOnDelete();
            $table->decimal('allocated_amount', 18, 4)->default(0);
            $table->timestamps();

            $table->unique(['supplier_payment_id', 'purchase_invoice_id'], 'unique_spa_supplier_pinvoice');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_payment_allocations');
    }
};
