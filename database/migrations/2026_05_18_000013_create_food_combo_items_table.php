<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_combo_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('combo_food_id')->constrained('foods')->cascadeOnDelete();
            $table->foreignId('combo_food_variant_id')->nullable()->constrained('food_variants')->cascadeOnDelete();
            $table->foreignId('food_id')->constrained('foods')->restrictOnDelete();
            $table->foreignId('food_variant_id')->nullable()->constrained('food_variants')->nullOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->unique(['combo_food_id', 'combo_food_variant_id', 'food_id', 'food_variant_id'], 'food_combo_item_unique');
            $table->index(['combo_food_id', 'combo_food_variant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_combo_items');
    }
};
