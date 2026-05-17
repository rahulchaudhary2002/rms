<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stock_counts', function (Blueprint $table) {
            $table->id();

            $table->string('count_no')->unique();

            $table->foreignId('warehouse_id')
                ->constrained('warehouses')
                ->restrictOnDelete();

            $table->date('count_date');

            $table->enum('status', [
                'draft',
                'counting',
                'completed',
                'adjusted',
                'cancelled',
            ])->default('draft');

            $table->text('remarks')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('completed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(['warehouse_id']);
            $table->index(['count_date']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_counts');
    }
};
