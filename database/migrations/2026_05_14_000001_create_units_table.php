<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('short_name', 20);

            $table->enum('type', [
                'weight',
                'volume',
                'quantity',
                'custom',
            ])->default('quantity');

            $table->boolean('is_base')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['short_name', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
