<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredient_stock_transfers', function (Blueprint $table) {
            $table->id();

            $table->string('transfer_no')->unique();

            $table->foreignId('from_warehouse_id')
                ->constrained('warehouses')
                ->restrictOnDelete();

            $table->foreignId('to_warehouse_id')
                ->constrained('warehouses')
                ->restrictOnDelete();

            $table->date('transfer_date');

            $table->enum('status', [
                'draft',
                'requested',
                'approved',
                'dispatched',
                'partially_received',
                'received',
                'cancelled',
            ])->default('draft');

            $table->text('remarks')->nullable();

            $table->foreignId('requested_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('dispatched_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('received_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('received_at')->nullable();

            $table->timestamps();

            $table->index(['from_warehouse_id']);
            $table->index(['to_warehouse_id']);
            $table->index(['status']);
            $table->index(['transfer_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredient_stock_transfers');
    }
};
