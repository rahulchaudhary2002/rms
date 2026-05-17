<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stock_count_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ingredient_stock_count_id')
                ->constrained('ingredient_stock_counts')
                ->cascadeOnDelete();

            $table->foreignId('ingredient_id')
                ->constrained('ingredients')
                ->restrictOnDelete();

            $table->foreignId('ingredient_batch_id')
                ->nullable()
                ->constrained('ingredient_batches')
                ->nullOnDelete();

            $table->decimal('system_quantity', 18, 4)->default(0);
            $table->decimal('counted_quantity', 18, 4)->default(0);
            $table->decimal('difference_quantity', 18, 4)->default(0);

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->index(['ingredient_id']);
            $table->index(['ingredient_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_count_items');
    }
};
