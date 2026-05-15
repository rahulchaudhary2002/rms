<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ingredient_category_id')
                ->nullable()
                ->constrained('ingredient_categories')
                ->nullOnDelete();

            $table->string('name');
            $table->string('slug')->unique();

            $table->string('code', 80)->unique();

            $table->string('barcode')->nullable()->unique();

            /**
             * Ingredient type
             *
             * raw_material   = Chicken, rice, flour, oil, masala
             * ready_product  = Coke bottle, water bottle, chips
             * packaging      = box, cup, spoon, paper bag
             * consumable     = gas, tissue, cleaning liquid, gloves
             */
            $table->enum('type', [
                'raw_material',
                'ready_product',
                'packaging',
                'consumable',
            ])->default('raw_material');

            /**
             * Base unit is the smallest/main stock calculation unit.
             *
             * Example:
             * Chicken = gram
             * Oil = ml
             * Coke Bottle = pcs
             * Rice = gram
             */
            $table->foreignId('base_unit_id')
                ->constrained('units')
                ->restrictOnDelete();

            /**
             * Default purchase unit.
             *
             * Example:
             * Chicken may be purchased in kg
             * Coke may be purchased in carton
             */
            $table->foreignId('default_purchase_unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            /**
             * Default usage unit.
             *
             * Example:
             * Chicken used in gram
             * Oil used in ml
             * Coke used in pcs
             */
            $table->foreignId('default_usage_unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            /**
             * Stock alert settings
             */
            $table->decimal('minimum_stock', 18, 4)->default(0);
            // Alert when stock goes below this quantity

            $table->decimal('reorder_stock', 18, 4)->default(0);
            // Suggested reorder quantity / reorder level

            /**
             * Costing method for stock valuation and COGS calculation.
             *
             * fifo                    = First In, First Out
             * lifo                    = Last In, First Out
             * weighted_average        = Average based on total stock value / quantity
             * moving_average          = Average recalculated after each purchase
             * specific_identification = Exact selected batch cost
             */
            $table->enum('costing_method', [
                'fifo',
                'lifo',
                'weighted_average',
                'moving_average',
                'specific_identification',
            ])->default('fifo');

            /**
             * Expiry / perishability settings
             */
            $table->boolean('is_perishable')->default(false);
            // true for chicken, milk, vegetables, etc.

            $table->boolean('track_expiry')->default(false);
            // true if expiry date should be tracked in batches

            $table->text('description')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['ingredient_category_id']);
            $table->index(['base_unit_id']);
            $table->index(['type']);
            $table->index(['costing_method']);
            $table->index(['is_perishable']);
            $table->index(['track_expiry']);
            $table->index(['is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
