<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_point_rule_slabs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('loyalty_point_rule_id')
                ->constrained('loyalty_point_rules')
                ->cascadeOnDelete();

            $table->decimal('min_amount', 12, 2);
            $table->decimal('max_amount', 12, 2)->nullable();

            $table->unsignedInteger('points');

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['loyalty_point_rule_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_point_rule_slabs');
    }
};
