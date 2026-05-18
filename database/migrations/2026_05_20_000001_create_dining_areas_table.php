<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dining_areas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('outlet_id')
                ->constrained('outlets')
                ->cascadeOnDelete();

            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->text('description')->nullable();

            $table->decimal('layout_width', 10, 2)->default(1000);
            $table->decimal('layout_height', 10, 2)->default(700);

            $table->unsignedInteger('sort_order')->default(100);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['outlet_id', 'name']);
            $table->unique(['outlet_id', 'code']);

            $table->index(['outlet_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dining_areas');
    }
};
