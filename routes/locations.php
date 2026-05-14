<?php

use App\Http\Controllers\Locations\CityController;
use App\Http\Controllers\Locations\CountryController;
use App\Http\Controllers\Locations\StateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    // Countries
    Route::get('countries', [CountryController::class, 'index'])
        ->middleware('permission:countries-view')
        ->name('countries.index');

    Route::get('countries/create', [CountryController::class, 'create'])
        ->middleware('permission:countries-create')
        ->name('countries.create');

    Route::post('countries', [CountryController::class, 'store'])
        ->middleware('permission:countries-create')
        ->name('countries.store');

    Route::get('countries/{country}/edit', [CountryController::class, 'edit'])
        ->middleware('permission:countries-update')
        ->name('countries.edit');

    Route::put('countries/{country}', [CountryController::class, 'update'])
        ->middleware('permission:countries-update')
        ->name('countries.update');

    Route::delete('countries/{country}', [CountryController::class, 'destroy'])
        ->middleware('permission:countries-delete')
        ->name('countries.destroy');

    Route::patch('countries/{country}/active', [CountryController::class, 'toggleActive'])
        ->middleware('permission:countries-update')
        ->name('countries.toggle-active');

    // States
    Route::get('states', [StateController::class, 'index'])
        ->middleware('permission:states-view')
        ->name('states.index');

    Route::get('states/create', [StateController::class, 'create'])
        ->middleware('permission:states-create')
        ->name('states.create');

    Route::post('states', [StateController::class, 'store'])
        ->middleware('permission:states-create')
        ->name('states.store');

    Route::get('states/{state}/edit', [StateController::class, 'edit'])
        ->middleware('permission:states-update')
        ->name('states.edit');

    Route::put('states/{state}', [StateController::class, 'update'])
        ->middleware('permission:states-update')
        ->name('states.update');

    Route::delete('states/{state}', [StateController::class, 'destroy'])
        ->middleware('permission:states-delete')
        ->name('states.destroy');

    Route::patch('states/{state}/active', [StateController::class, 'toggleActive'])
        ->middleware('permission:states-update')
        ->name('states.toggle-active');

    // Cities
    Route::get('cities', [CityController::class, 'index'])
        ->middleware('permission:cities-view')
        ->name('cities.index');

    Route::get('cities/create', [CityController::class, 'create'])
        ->middleware('permission:cities-create')
        ->name('cities.create');

    Route::post('cities', [CityController::class, 'store'])
        ->middleware('permission:cities-create')
        ->name('cities.store');

    Route::get('cities/{city}/edit', [CityController::class, 'edit'])
        ->middleware('permission:cities-update')
        ->name('cities.edit');

    Route::put('cities/{city}', [CityController::class, 'update'])
        ->middleware('permission:cities-update')
        ->name('cities.update');

    Route::delete('cities/{city}', [CityController::class, 'destroy'])
        ->middleware('permission:cities-delete')
        ->name('cities.destroy');

    Route::patch('cities/{city}/active', [CityController::class, 'toggleActive'])
        ->middleware('permission:cities-update')
        ->name('cities.toggle-active');
});
