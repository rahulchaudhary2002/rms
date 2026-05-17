<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->foreignId('purchase_receive_id')->nullable()->constrained('purchase_receives')->nullOnDelete();
            $table->string('invoice_no')->unique();
            $table->string('supplier_invoice_no')->nullable();
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->enum('status', ['draft', 'unpaid', 'partially_paid', 'paid', 'cancelled'])->default('draft');
            $table->decimal('subtotal', 18, 4)->default(0);
            $table->decimal('discount_amount', 18, 4)->default(0);
            $table->decimal('tax_amount', 18, 4)->default(0);
            $table->decimal('shipping_amount', 18, 4)->default(0);
            $table->decimal('grand_total', 18, 4)->default(0);
            $table->decimal('paid_amount', 18, 4)->default(0);
            $table->decimal('due_amount', 18, 4)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('supplier_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_invoices');
    }
};
