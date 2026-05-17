<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stock_adjustment_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('ingredient_stock_adjustment_id');
            $table->foreign('ingredient_stock_adjustment_id', 'isa_items_adjustment_id_foreign')
                ->references('id')->on('ingredient_stock_adjustments')
                ->cascadeOnDelete();

            $table->foreignId('ingredient_id')
                ->constrained('ingredients')
                ->restrictOnDelete();

            $table->foreignId('ingredient_batch_id')
                ->nullable()
                ->constrained('ingredient_batches')
                ->nullOnDelete();

            $table->decimal('system_quantity', 18, 4)->default(0);
            $table->decimal('actual_quantity', 18, 4)->default(0);
            $table->decimal('difference_quantity', 18, 4)->default(0);

            $table->decimal('unit_cost', 18, 6)->default(0);
            $table->decimal('difference_value', 18, 4)->default(0);

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->index(['ingredient_id']);
            $table->index(['ingredient_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_adjustment_items');
    }
};
