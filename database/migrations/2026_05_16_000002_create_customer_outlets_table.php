<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_outlets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->foreignId('outlet_id')
                ->constrained('outlets')
                ->cascadeOnDelete();

            $table->timestamp('first_visited_at')->nullable();
            $table->timestamp('last_visited_at')->nullable();

            $table->unsignedInteger('visit_count')->default(0);

            $table->boolean('is_favorite_outlet')->default(false);

            $table->timestamps();

            $table->unique(['customer_id', 'outlet_id']);
            $table->index(['outlet_id', 'last_visited_at']);
            $table->index(['customer_id', 'last_visited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_outlets');
    }
};
