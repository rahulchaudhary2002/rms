<?php

use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {
    Route::get('warehouses', [WarehouseController::class, 'index'])
        ->middleware('permission:warehouses-view')
        ->name('warehouses.index');

    Route::get('warehouses/create', [WarehouseController::class, 'create'])
        ->middleware('permission:warehouses-create')
        ->name('warehouses.create');

    Route::get('warehouses/{warehouse}/edit', [WarehouseController::class, 'edit'])
        ->middleware('permission:warehouses-edit')
        ->name('warehouses.edit');

    Route::put('warehouses/{warehouse}', [WarehouseController::class, 'update'])
        ->middleware('permission:warehouses-edit')
        ->name('warehouses.update');

    Route::delete('warehouses/{warehouse}', [WarehouseController::class, 'destroy'])
        ->middleware('permission:warehouses-delete')
        ->name('warehouses.destroy');

    Route::patch('warehouses/{warehouse}/toggle-active', [WarehouseController::class, 'toggleActive'])
        ->middleware('permission:warehouses-edit')
        ->name('warehouses.toggle-active');
});
