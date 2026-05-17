<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_wastages', function (Blueprint $table) {
            $table->id();

            $table->string('wastage_no')->unique();

            $table->foreignId('warehouse_id')
                ->constrained('warehouses')
                ->restrictOnDelete();

            $table->date('wastage_date');

            $table->enum('reason', [
                'expired',
                'damaged',
                'spoiled',
                'over_preparation',
                'staff_error',
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
            $table->index(['wastage_date']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_wastages');
    }
};
