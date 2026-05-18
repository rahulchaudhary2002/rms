<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dining_tables', function (Blueprint $table) {
            $table->id();

            $table->foreignId('outlet_id')
                ->constrained('outlets')
                ->cascadeOnDelete();

            $table->foreignId('dining_area_id')
                ->constrained('dining_areas')
                ->cascadeOnDelete();

            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->unsignedInteger('capacity')->default(1);

            $table->enum('status', [
                'available',
                'occupied',
                'reserved',
                'cleaning',
                'inactive',
            ])->default('available');

            $table->decimal('position_x', 10, 2)->default(0);
            $table->decimal('position_y', 10, 2)->default(0);
            $table->decimal('width', 10, 2)->default(80);
            $table->decimal('height', 10, 2)->default(80);
            $table->unsignedInteger('rotation')->default(0);

            $table->enum('shape', [
                'rectangle',
                'square',
                'circle',
                'oval',
            ])->default('rectangle');

            $table->unsignedInteger('sort_order')->default(100);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['outlet_id', 'dining_area_id', 'name']);
            $table->unique(['outlet_id', 'dining_area_id', 'code']);

            $table->index(['outlet_id', 'dining_area_id']);
            $table->index(['outlet_id', 'status']);
            $table->index(['outlet_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dining_tables');
    }
};
