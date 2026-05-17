<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stock_transfer_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('ingredient_stock_transfer_id');
            $table->foreign('ingredient_stock_transfer_id', 'ist_items_transfer_id_foreign')
                ->references('id')->on('ingredient_stock_transfers')
                ->cascadeOnDelete();

            $table->foreignId('ingredient_id')
                ->constrained('ingredients')
                ->restrictOnDelete();

            $table->foreignId('ingredient_batch_id')
                ->nullable()
                ->constrained('ingredient_batches')
                ->nullOnDelete();

            $table->decimal('requested_quantity', 18, 4)->default(0);
            $table->decimal('dispatched_quantity', 18, 4)->default(0);
            $table->decimal('received_quantity', 18, 4)->default(0);

            $table->decimal('unit_cost', 18, 6)->default(0);
            $table->decimal('total_cost', 18, 4)->default(0);

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->index(['ingredient_id']);
            $table->index(['ingredient_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_transfer_items');
    }
};
