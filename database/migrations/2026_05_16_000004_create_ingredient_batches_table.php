<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_batches', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ingredient_id')
                ->constrained('ingredients')
                ->cascadeOnDelete();

            $table->foreignId('warehouse_id')
                ->constrained('warehouses')
                ->cascadeOnDelete();

            $table->string('batch_no')->nullable();

            $table->decimal('received_quantity', 18, 4)->default(0);
            $table->decimal('available_quantity', 18, 4)->default(0);

            $table->decimal('unit_cost', 18, 6)->default(0);
            $table->decimal('total_cost', 18, 4)->default(0);

            $table->date('manufactured_date')->nullable();
            $table->date('expiry_date')->nullable();

            $table->nullableMorphs('source');

            $table->boolean('is_closed')->default(false);

            $table->timestamps();

            $table->index(['ingredient_id', 'warehouse_id']);
            $table->index(['warehouse_id']);
            $table->index(['expiry_date']);
            $table->index(['is_closed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_batches');
    }
};
