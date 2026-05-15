<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outlet_departments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('outlet_id')
                ->constrained('outlets')
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('code', 80)->nullable();

            $table->enum('type', [
                'kitchen',
                'bar',
                'counter',
                'store',
                'bakery',
                'housekeeping',
                'other',
            ])->default('other');

            $table->text('description')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['outlet_id', 'code']);

            $table->index(['outlet_id']);
            $table->index(['type']);
            $table->index(['is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outlet_departments');
    }
};
