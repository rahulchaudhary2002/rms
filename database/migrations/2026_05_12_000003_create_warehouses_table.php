<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('outlet_id')
                ->nullable()
                ->constrained('outlets')
                ->nullOnDelete();

            $table->foreignId('outlet_department_id')
                ->nullable()
                ->constrained('outlet_departments')
                ->nullOnDelete();

            $table->string('name');
            $table->string('code', 80)->unique();

            $table->enum('type', [
                'central',
                'outlet',
                'department',
            ])->default('outlet');

            $table->text('address')->nullable();

            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['outlet_id']);
            $table->index(['outlet_department_id']);
            $table->index(['type']);
            $table->index(['is_default']);
            $table->index(['is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
