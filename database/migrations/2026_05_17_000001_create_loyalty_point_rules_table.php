<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_point_rules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('outlet_id')
                ->nullable()
                ->constrained('outlets')
                ->nullOnDelete();

            $table->string('name');

            $table->enum('type', ['global', 'outlet', 'campaign'])->default('global');

            $table->enum('earning_type', ['fixed_rate', 'fixed_slab'])->default('fixed_rate');

            $table->decimal('earn_amount', 12, 2)->nullable();
            $table->unsignedInteger('earn_points')->nullable();

            $table->decimal('redeem_point_value', 12, 2)->default(1);

            $table->unsignedInteger('minimum_redeem_points')->default(0);
            $table->unsignedInteger('maximum_redeem_points')->nullable();

            $table->decimal('maximum_redeem_percent', 5, 2)->nullable();

            $table->unsignedInteger('points_expiry_days')->nullable();

            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();

            $table->boolean('is_active')->default(true);

            $table->unsignedInteger('priority')->default(100);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['outlet_id', 'type', 'is_active']);
            $table->index(['type', 'is_active']);
            $table->index(['starts_at', 'ends_at']);
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_point_rules');
    }
};
