<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('foods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_category_id')->nullable()->constrained('food_categories')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->nullable()->unique();
            $table->string('short_description')->nullable();
            $table->longText('description')->nullable();
            $table->string('image')->nullable();
            $table->enum('food_type', ['veg', 'non_veg', 'egg', 'vegan'])->nullable();
            $table->enum('item_type', ['food', 'beverage', 'combo'])->default('food');
            $table->decimal('base_price', 12, 2)->default(0);
            $table->boolean('has_variants')->default(false);
            $table->boolean('has_addons')->default(false);
            $table->boolean('is_recipe_enabled')->default(false);
            $table->boolean('is_taxable')->default(true);
            $table->boolean('is_discountable')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('preparation_time')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['food_category_id', 'is_active']);
            $table->index(['item_type', 'is_active']);
            $table->index(['food_type', 'is_active']);
            $table->index('sort_order');
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('foods');
    }
};
