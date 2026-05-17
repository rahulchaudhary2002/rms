<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stock_outs', function (Blueprint $table) {
            $table->id();

            $table->string('stock_out_no')->unique();

            $table->foreignId('warehouse_id')
                ->constrained('warehouses')
                ->restrictOnDelete();

            $table->date('stock_out_date');

            $table->enum('purpose', [
                'production_use',
                'kitchen_use',
                'sample',
                'distribution',
                'other',
            ])->default('other');

            $table->enum('status', [
                'draft',
                'approved',
                'cancelled',
            ])->default('draft');

            $table->text('remarks')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            $table->index(['warehouse_id']);
            $table->index(['stock_out_date']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_outs');
    }
};
