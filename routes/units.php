<?php

use App\Http\Controllers\Units\UnitController;
use App\Http\Controllers\Units\UnitConversionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    // Units
    Route::get('units', [UnitController::class, 'index'])
        ->middleware('permission:units-view')
        ->name('units.index');

    Route::get('units/create', [UnitController::class, 'create'])
        ->middleware('permission:units-create')
        ->name('units.create');

    Route::post('units', [UnitController::class, 'store'])
        ->middleware('permission:units-create')
        ->name('units.store');

    Route::get('units/{unit}/edit', [UnitController::class, 'edit'])
        ->middleware('permission:units-update')
        ->name('units.edit');

    Route::put('units/{unit}', [UnitController::class, 'update'])
        ->middleware('permission:units-update')
        ->name('units.update');

    Route::delete('units/{unit}', [UnitController::class, 'destroy'])
        ->middleware('permission:units-delete')
        ->name('units.destroy');

    Route::patch('units/{unit}/active', [UnitController::class, 'toggleActive'])
        ->middleware('permission:units-update')
        ->name('units.toggle-active');

    // Unit Conversions
    Route::get('unit-conversions', [UnitConversionController::class, 'index'])
        ->middleware('permission:unit-conversions-view')
        ->name('unit-conversions.index');

    Route::get('unit-conversions/create', [UnitConversionController::class, 'create'])
        ->middleware('permission:unit-conversions-create')
        ->name('unit-conversions.create');

    Route::post('unit-conversions', [UnitConversionController::class, 'store'])
        ->middleware('permission:unit-conversions-create')
        ->name('unit-conversions.store');

    Route::get('unit-conversions/{unitConversion}/edit', [UnitConversionController::class, 'edit'])
        ->middleware('permission:unit-conversions-update')
        ->name('unit-conversions.edit');

    Route::put('unit-conversions/{unitConversion}', [UnitConversionController::class, 'update'])
        ->middleware('permission:unit-conversions-update')
        ->name('unit-conversions.update');

    Route::delete('unit-conversions/{unitConversion}', [UnitConversionController::class, 'destroy'])
        ->middleware('permission:unit-conversions-delete')
        ->name('unit-conversions.destroy');

    Route::patch('unit-conversions/{unitConversion}/active', [UnitConversionController::class, 'toggleActive'])
        ->middleware('permission:unit-conversions-update')
        ->name('unit-conversions.toggle-active');
});
