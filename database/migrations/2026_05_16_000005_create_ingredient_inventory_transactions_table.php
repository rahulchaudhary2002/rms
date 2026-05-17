<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_inventory_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ingredient_id')
                ->constrained('ingredients')
                ->cascadeOnDelete();

            $table->foreignId('warehouse_id')
                ->constrained('warehouses')
                ->cascadeOnDelete();

            $table->foreignId('ingredient_batch_id')
                ->nullable()
                ->constrained('ingredient_batches')
                ->nullOnDelete();

            $table->enum('transaction_type', [
                'opening_stock',

                'purchase_receive',
                'purchase_return',

                'transfer_in',
                'transfer_out',

                'sale_consume',
                'production_consume',

                'wastage',

                'adjustment_in',
                'adjustment_out',

                'stock_count_gain',
                'stock_count_loss',
            ]);

            $table->decimal('quantity_in', 18, 4)->default(0);
            $table->decimal('quantity_out', 18, 4)->default(0);

            $table->decimal('balance_after', 18, 4)->default(0);

            $table->decimal('unit_cost', 18, 6)->default(0);
            $table->decimal('total_cost', 18, 4)->default(0);

            $table->nullableMorphs('reference', 'ing_inv_txns_reference_index');

            $table->text('remarks')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['ingredient_id', 'warehouse_id'], 'ing_inv_txns_ingredient_warehouse_index');
            $table->index(['warehouse_id', 'transaction_type'], 'ing_inv_txns_warehouse_type_index');
            $table->index(['ingredient_batch_id'], 'ing_inv_txns_batch_index');
            $table->index(['created_at'], 'ing_inv_txns_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_inventory_transactions');
    }
};
