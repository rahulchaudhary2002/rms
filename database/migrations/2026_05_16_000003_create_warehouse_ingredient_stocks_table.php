<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouse_ingredient_stocks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('warehouse_id')
                ->constrained('warehouses')
                ->cascadeOnDelete();

            $table->foreignId('ingredient_id')
                ->constrained('ingredients')
                ->cascadeOnDelete();

            $table->decimal('quantity', 18, 4)->default(0);

            $table->decimal('average_cost', 18, 6)->default(0);
            $table->decimal('stock_value', 18, 4)->default(0);

            $table->timestamps();

            $table->unique(['warehouse_id', 'ingredient_id']);
            $table->index(['ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouse_ingredient_stocks');
    }
};
