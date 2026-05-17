<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('purchase_receive_id')->nullable()->constrained('purchase_receives')->nullOnDelete();
            $table->foreignId('purchase_invoice_id')->nullable()->constrained('purchase_invoices')->nullOnDelete();
            $table->string('return_no')->unique();
            $table->date('return_date');
            $table->enum('status', ['draft', 'posted', 'cancelled'])->default('draft');
            $table->decimal('subtotal', 18, 4)->default(0);
            $table->decimal('tax_amount', 18, 4)->default(0);
            $table->decimal('grand_total', 18, 4)->default(0);
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('supplier_id');
            $table->index('warehouse_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};
