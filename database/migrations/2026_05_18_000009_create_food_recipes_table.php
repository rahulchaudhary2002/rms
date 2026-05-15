<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            $table->foreignId('food_variant_id')->nullable()->constrained('food_variants')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('ingredients')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->decimal('quantity', 12, 4);
            $table->decimal('wastage_quantity', 12, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['food_id', 'food_variant_id', 'ingredient_id', 'unit_id'], 'food_recipe_unique');
            $table->index(['food_id', 'food_variant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_recipes');
    }
};
