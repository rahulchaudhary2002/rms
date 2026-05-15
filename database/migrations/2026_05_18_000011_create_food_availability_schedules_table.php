<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_availability_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            $table->foreignId('outlet_id')->nullable()->constrained('outlets')->cascadeOnDelete();
            $table->enum('day_of_week', ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['food_id', 'outlet_id', 'day_of_week', 'start_time', 'end_time'], 'food_availability_unique');
            $table->index(['food_id', 'outlet_id', 'day_of_week', 'is_available'], 'food_avail_sched_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_availability_schedules');
    }
};
