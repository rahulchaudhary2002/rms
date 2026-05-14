<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('unit_conversions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('from_unit_id')
                ->constrained('units')
                ->cascadeOnDelete();

            $table->foreignId('to_unit_id')
                ->constrained('units')
                ->cascadeOnDelete();

            $table->decimal('multiplier', 18, 6);

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['from_unit_id', 'to_unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unit_conversions');
    }
};
