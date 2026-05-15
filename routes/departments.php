<?php

use App\Http\Controllers\Outlets\OutletDepartmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('outlet-departments', [OutletDepartmentController::class, 'index'])
        ->middleware('permission:outlet-departments-view')
        ->name('outlet-departments.index');

    Route::get('outlet-departments/create', [OutletDepartmentController::class, 'create'])
        ->middleware('permission:outlet-departments-create')
        ->name('outlet-departments.create');

    Route::post('outlet-departments', [OutletDepartmentController::class, 'store'])
        ->middleware('permission:outlet-departments-create')
        ->name('outlet-departments.store');

    Route::get('outlet-departments/{outletDepartment}/edit', [OutletDepartmentController::class, 'edit'])
        ->middleware('permission:outlet-departments-update')
        ->name('outlet-departments.edit');

    Route::put('outlet-departments/{outletDepartment}', [OutletDepartmentController::class, 'update'])
        ->middleware('permission:outlet-departments-update')
        ->name('outlet-departments.update');

    Route::delete('outlet-departments/{outletDepartment}', [OutletDepartmentController::class, 'destroy'])
        ->middleware('permission:outlet-departments-delete')
        ->name('outlet-departments.destroy');

    Route::patch('outlet-departments/{outletDepartment}/active', [OutletDepartmentController::class, 'toggleActive'])
        ->middleware('permission:outlet-departments-update')
        ->name('outlet-departments.toggle-active');
});
