<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stock_out_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ingredient_stock_out_id')
                ->constrained('ingredient_stock_outs')
                ->cascadeOnDelete();

            $table->foreignId('ingredient_id')
                ->constrained('ingredients')
                ->restrictOnDelete();

            $table->foreignId('ingredient_batch_id')
                ->nullable()
                ->constrained('ingredient_batches')
                ->nullOnDelete();

            $table->decimal('quantity', 18, 4);

            $table->decimal('unit_cost', 18, 6)->default(0);
            $table->decimal('total_cost', 18, 4)->default(0);

            $table->timestamps();

            $table->index(['ingredient_id']);
            $table->index(['ingredient_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_out_items');
    }
};
