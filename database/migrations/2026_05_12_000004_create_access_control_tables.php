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
                'central_warehouse',
                'outlet',
                'outlet_warehouse',
                'outlet_department',
                'department_warehouse',
            ])->default('outlet');

            $table->unsignedInteger('rank')->default(100);
            $table->boolean('is_assignable')->default(true);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);

            $table->text('description')->nullable();

            $table->timestamps();

            $table->index(['level']);
            $table->index(['rank']);
            $table->index(['is_assignable']);
            $table->index(['is_system']);
            $table->index(['is_active']);
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();

            $table->string('module');
            $table->string('action');

            $table->enum('level', [
                'global',
                'central_warehouse',
                'outlet',
                'outlet_warehouse',
                'outlet_department',
                'department_warehouse',
            ])->default('outlet');

            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);

            $table->text('description')->nullable();

            $table->timestamps();

            $table->index(['module']);
            $table->index(['action']);
            $table->index(['module', 'action']);
            $table->index(['level']);
            $table->index(['is_system']);
            $table->index(['is_active']);
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
                'central_warehouse',
                'outlet',
                'outlet_warehouse',
                'outlet_department',
                'department_warehouse',
            ])->default('outlet');

            $table->foreignId('outlet_id')
                ->nullable()
                ->constrained('outlets')
                ->cascadeOnDelete();

            $table->foreignId('outlet_department_id')
                ->nullable()
                ->constrained('outlet_departments')
                ->cascadeOnDelete();

            $table->foreignId('warehouse_id')
                ->nullable()
                ->constrained('warehouses')
                ->cascadeOnDelete();

            $table->boolean('is_active')->default(true);

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            $table->timestamps();

            $table->unique([
                'user_id',
                'role_id',
                'scope_type',
                'outlet_id',
                'outlet_department_id',
                'warehouse_id',
            ], 'unique_user_role_scope');

            $table->index(['user_id']);
            $table->index(['role_id']);
            $table->index(['scope_type']);
            $table->index(['outlet_id']);
            $table->index(['outlet_department_id']);
            $table->index(['warehouse_id']);
            $table->index(['is_active']);
            $table->index(['starts_at', 'ends_at']);
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
                'central_warehouse',
                'outlet',
                'outlet_warehouse',
                'outlet_department',
                'department_warehouse',
            ])->default('outlet');

            $table->foreignId('outlet_id')
                ->nullable()
                ->constrained('outlets')
                ->cascadeOnDelete();

            $table->foreignId('outlet_department_id')
                ->nullable()
                ->constrained('outlet_departments')
                ->cascadeOnDelete();

            $table->foreignId('warehouse_id')
                ->nullable()
                ->constrained('warehouses')
                ->cascadeOnDelete();

            $table->enum('effect', [
                'allow',
                'deny',
            ])->default('allow');

            $table->boolean('is_active')->default(true);

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            $table->text('reason')->nullable();

            $table->timestamps();

            $table->unique([
                'user_id',
                'permission_id',
                'scope_type',
                'outlet_id',
                'outlet_department_id',
                'warehouse_id',
            ], 'unique_user_permission_scope');

            $table->index(['user_id']);
            $table->index(['permission_id']);
            $table->index(['scope_type']);
            $table->index(['outlet_id']);
            $table->index(['outlet_department_id']);
            $table->index(['warehouse_id']);
            $table->index(['effect']);
            $table->index(['is_active']);
            $table->index(['starts_at', 'ends_at']);
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

            $table->boolean('is_active')->default(true);

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            $table->text('reason')->nullable();

            $table->timestamps();

            $table->unique([
                'user_id',
                'permission_id',
                'resource_type',
                'resource_id',
            ], 'unique_user_resource_permission');

            $table->index(['user_id']);
            $table->index(['permission_id']);
            $table->index(['resource_type', 'resource_id']);
            $table->index(['effect']);
            $table->index(['is_active']);
            $table->index(['starts_at', 'ends_at']);
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
