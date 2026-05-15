<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();

            $table->enum('level', [
                'global',
                'outlet',
                'warehouse',
            ])->default('global');
            $table->unsignedInteger('rank')->default(100);
            $table->boolean('is_assignable')->default(true);

            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['level', 'is_active']);
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();

            $table->string('module');
            $table->string('action');

            $table->enum('level', [
                'global',
                'outlet',
                'warehouse',
            ])->default('global');

            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['module', 'action']);
            $table->index(['level', 'is_active']);
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('role_id')
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->foreignId('permission_id')
                ->constrained('permissions')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('user_role_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('role_id')
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->enum('scope_type', [
                'global',
                'outlet',
                'warehouse',
            ])->default('global');

            $table->unsignedBigInteger('scope_id')->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique([
                'user_id',
                'role_id',
                'scope_type',
                'scope_id',
            ], 'unique_user_role_scope');

            $table->index(['user_id', 'scope_type', 'scope_id'], 'idx_user_role_scope');
            $table->index(['scope_type', 'scope_id'], 'idx_role_scope');
            $table->index('is_active', 'idx_user_role_active');
        });

        Schema::create('user_permission_overrides', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('permission_id')
                ->constrained('permissions')
                ->cascadeOnDelete();

            $table->enum('scope_type', [
                'global',
                'outlet',
                'warehouse',
            ])->default('global');

            $table->unsignedBigInteger('scope_id')->nullable();

            $table->enum('effect', [
                'allow',
                'deny',
            ])->default('allow');

            $table->text('reason')->nullable();
            $table->boolean('is_active')->default(true);

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique([
                'user_id',
                'permission_id',
                'scope_type',
                'scope_id',
            ], 'unique_user_permission_scope');

            $table->index(['user_id', 'scope_type', 'scope_id'], 'idx_user_permission_scope');
            $table->index(['scope_type', 'scope_id'], 'idx_permission_scope');
            $table->index(['effect', 'is_active'], 'idx_permission_effect_active');
        });

        Schema::create('user_resource_permissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('permission_id')
                ->constrained('permissions')
                ->cascadeOnDelete();

            $table->string('resource_type');
            $table->unsignedBigInteger('resource_id');

            $table->enum('effect', [
                'allow',
                'deny',
            ])->default('allow');

            $table->text('reason')->nullable();
            $table->boolean('is_active')->default(true);

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique([
                'user_id',
                'permission_id',
                'resource_type',
                'resource_id',
            ], 'unique_user_resource_permission');

            $table->index([
                'user_id',
                'resource_type',
                'resource_id',
            ], 'idx_user_resource_permission');

            $table->index([
                'permission_id',
                'resource_type',
                'resource_id',
            ], 'idx_permission_resource');

            $table->index(['effect', 'is_active'], 'idx_resource_effect_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_resource_permissions');
        Schema::dropIfExists('user_permission_overrides');
        Schema::dropIfExists('user_role_assignments');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
