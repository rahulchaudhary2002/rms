<?php

use App\Http\Controllers\AccessControl\PermissionController;
use App\Http\Controllers\AccessControl\RoleController;
use App\Http\Controllers\AccessControl\RolePermissionController;
use App\Http\Controllers\AccessControl\UserPermissionOverrideController;
use App\Http\Controllers\AccessControl\UserResourcePermissionController;
use App\Http\Controllers\AccessControl\UserRoleAssignmentController;
use Illuminate\Support\Facades\Route;

Route::prefix('access-control')->name('access-control.')->middleware(['auth', 'verified', 'node.selected'])->group(function () {

    // Roles
    Route::get('roles', [RoleController::class, 'index'])
        ->middleware('permission:roles-view')
        ->name('roles.index');

    Route::get('roles/create', [RoleController::class, 'create'])
        ->middleware('permission:roles-create')
        ->name('roles.create');

    Route::post('roles', [RoleController::class, 'store'])
        ->middleware('permission:roles-create')
        ->name('roles.store');

    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])
        ->middleware('permission:roles-update')
        ->name('roles.edit');

    Route::put('roles/{role}', [RoleController::class, 'update'])
        ->middleware('permission:roles-update')
        ->name('roles.update');

    Route::delete('roles/{role}', [RoleController::class, 'destroy'])
        ->middleware('permission:roles-delete')
        ->name('roles.destroy');

    // Permissions
    Route::get('permissions', [PermissionController::class, 'index'])
        ->middleware('permission:permissions-view')
        ->name('permissions.index');

    Route::get('permissions/create', [PermissionController::class, 'create'])
        ->middleware('permission:permissions-create')
        ->name('permissions.create');

    Route::post('permissions', [PermissionController::class, 'store'])
        ->middleware('permission:permissions-create')
        ->name('permissions.store');

    Route::get('permissions/{permission}/edit', [PermissionController::class, 'edit'])
        ->middleware('permission:permissions-update')
        ->name('permissions.edit');

    Route::put('permissions/{permission}', [PermissionController::class, 'update'])
        ->middleware('permission:permissions-update')
        ->name('permissions.update');

    Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])
        ->middleware('permission:permissions-delete')
        ->name('permissions.destroy');

    // Role Permissions
    Route::get('role-permissions', [RolePermissionController::class, 'index'])
        ->middleware('permission:access-control-manage')
        ->name('role-permissions.index');

    Route::post('role-permissions', [RolePermissionController::class, 'store'])
        ->middleware('permission:access-control-manage')
        ->name('role-permissions.store');

    Route::delete('role-permissions', [RolePermissionController::class, 'destroy'])
        ->middleware('permission:access-control-manage')
        ->name('role-permissions.destroy');

    // User Role Assignments
    Route::get('user-roles', [UserRoleAssignmentController::class, 'index'])
        ->middleware('permission:access-control-manage')
        ->name('user-roles.index');

    Route::post('user-roles', [UserRoleAssignmentController::class, 'store'])
        ->middleware('permission:access-control-manage')
        ->name('user-roles.store');

    Route::patch('user-roles/{userRoleAssignment}', [UserRoleAssignmentController::class, 'update'])
        ->middleware('permission:access-control-manage')
        ->name('user-roles.update');

    Route::delete('user-roles/{userRoleAssignment}', [UserRoleAssignmentController::class, 'destroy'])
        ->middleware('permission:access-control-manage')
        ->name('user-roles.destroy');

    // User Permission Overrides
    Route::get('user-permission-overrides', [UserPermissionOverrideController::class, 'index'])
        ->middleware('permission:access-control-manage')
        ->name('user-permission-overrides.index');

    Route::post('user-permission-overrides', [UserPermissionOverrideController::class, 'store'])
        ->middleware('permission:access-control-manage')
        ->name('user-permission-overrides.store');

    Route::patch('user-permission-overrides/{userPermissionOverride}', [UserPermissionOverrideController::class, 'update'])
        ->middleware('permission:access-control-manage')
        ->name('user-permission-overrides.update');

    Route::delete('user-permission-overrides/{userPermissionOverride}', [UserPermissionOverrideController::class, 'destroy'])
        ->middleware('permission:access-control-manage')
        ->name('user-permission-overrides.destroy');

    // User Resource Permissions
    Route::get('user-resource-permissions', [UserResourcePermissionController::class, 'index'])
        ->middleware('permission:access-control-manage')
        ->name('user-resource-permissions.index');

    Route::post('user-resource-permissions', [UserResourcePermissionController::class, 'store'])
        ->middleware('permission:access-control-manage')
        ->name('user-resource-permissions.store');

    Route::patch('user-resource-permissions/{userResourcePermission}', [UserResourcePermissionController::class, 'update'])
        ->middleware('permission:access-control-manage')
        ->name('user-resource-permissions.update');

    Route::delete('user-resource-permissions/{userResourcePermission}', [UserResourcePermissionController::class, 'destroy'])
        ->middleware('permission:access-control-manage')
        ->name('user-resource-permissions.destroy');
});
