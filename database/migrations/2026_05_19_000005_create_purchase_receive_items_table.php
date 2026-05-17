<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_receive_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_receive_id')->constrained('purchase_receives')->cascadeOnDelete();
            $table->foreignId('purchase_order_item_id')->nullable()->constrained('purchase_order_items')->nullOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->decimal('ordered_quantity', 18, 4)->default(0);
            $table->decimal('received_quantity', 18, 4);
            $table->decimal('rejected_quantity', 18, 4)->default(0);
            $table->decimal('accepted_quantity', 18, 4);
            $table->decimal('unit_price', 18, 4)->default(0);
            $table->decimal('line_total', 18, 4)->default(0);
            $table->string('batch_no')->nullable();
            $table->date('manufactured_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('purchase_receive_id');
            $table->index('ingredient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_receive_items');
    }
};
