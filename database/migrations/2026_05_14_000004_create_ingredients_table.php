<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ingredient_category_id')
                ->nullable()
                ->constrained('ingredient_categories')
                ->nullOnDelete();

            $table->string('name');
            $table->string('slug')->unique();

            $table->string('code', 80)->unique();

            $table->string('barcode')->nullable()->unique();

            $table->foreignId('base_unit_id')
                ->constrained('units')
                ->restrictOnDelete();

            $table->foreignId('default_purchase_unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            $table->foreignId('default_usage_unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            $table->boolean('is_perishable')->default(false);
            $table->boolean('track_expiry')->default(false);

            $table->text('description')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['ingredient_category_id']);
            $table->index(['base_unit_id']);
            $table->index(['is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
