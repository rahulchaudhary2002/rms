<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->unsignedInteger('rank')->default(100)->after('level');
            $table->boolean('is_assignable')->default(true)->after('rank');
            $table->index(['rank', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropIndex(['rank', 'is_active']);
            $table->dropColumn(['rank', 'is_assignable']);
        });
    }
};
