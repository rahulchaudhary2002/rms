<?php

use App\Http\Controllers\DiningAreas\DiningAreaController;
use App\Http\Controllers\DiningTables\DiningTableController;
use App\Http\Controllers\DiningTables\DiningTableLayoutController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    // Dining Areas
    Route::get('dining-areas', [DiningAreaController::class, 'index'])
        ->middleware('permission:dining-areas-view')
        ->name('dining-areas.index');

    Route::get('dining-areas/create', [DiningAreaController::class, 'create'])
        ->middleware('permission:dining-areas-create')
        ->name('dining-areas.create');

    Route::post('dining-areas', [DiningAreaController::class, 'store'])
        ->middleware('permission:dining-areas-create')
        ->name('dining-areas.store');

    Route::get('dining-areas/{diningArea}/edit', [DiningAreaController::class, 'edit'])
        ->middleware('permission:dining-areas-update')
        ->name('dining-areas.edit');

    Route::put('dining-areas/{diningArea}', [DiningAreaController::class, 'update'])
        ->middleware('permission:dining-areas-update')
        ->name('dining-areas.update');

    Route::delete('dining-areas/{diningArea}', [DiningAreaController::class, 'destroy'])
        ->middleware('permission:dining-areas-delete')
        ->name('dining-areas.destroy');

    Route::patch('dining-areas/{diningArea}/active', [DiningAreaController::class, 'toggleActive'])
        ->middleware('permission:dining-areas-update')
        ->name('dining-areas.toggle-active');

    // Dining Tables
    Route::get('dining-tables', [DiningTableController::class, 'index'])
        ->middleware('permission:dining-tables-view')
        ->name('dining-tables.index');

    Route::get('dining-tables/create', [DiningTableController::class, 'create'])
        ->middleware('permission:dining-tables-create')
        ->name('dining-tables.create');

    Route::post('dining-tables', [DiningTableController::class, 'store'])
        ->middleware('permission:dining-tables-create')
        ->name('dining-tables.store');

    Route::get('dining-tables/{diningTable}/edit', [DiningTableController::class, 'edit'])
        ->middleware('permission:dining-tables-update')
        ->name('dining-tables.edit');

    Route::put('dining-tables/{diningTable}', [DiningTableController::class, 'update'])
        ->middleware('permission:dining-tables-update')
        ->name('dining-tables.update');

    Route::delete('dining-tables/{diningTable}', [DiningTableController::class, 'destroy'])
        ->middleware('permission:dining-tables-delete')
        ->name('dining-tables.destroy');

    Route::patch('dining-tables/{diningTable}/active', [DiningTableController::class, 'toggleActive'])
        ->middleware('permission:dining-tables-update')
        ->name('dining-tables.toggle-active');

    // Dining Table Layout
    Route::get('dining-table-layout', [DiningTableLayoutController::class, 'index'])
        ->middleware('permission:dining-table-layout-view')
        ->name('dining-table-layout.index');

    Route::post('dining-table-layout/update-layout', [DiningTableLayoutController::class, 'update'])
        ->middleware('permission:dining-table-layout-update')
        ->name('dining-table-layout.update');
});
