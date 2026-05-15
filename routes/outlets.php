<?php

use App\Http\Controllers\OutletController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('outlets', [OutletController::class, 'index'])
        ->middleware('permission:outlets-view')
        ->name('outlets.index');

    Route::get('outlets/create', [OutletController::class, 'create'])
        ->middleware('permission:outlets-create')
        ->name('outlets.create');

    Route::get('outlets/{outlet}/edit', [OutletController::class, 'edit'])
        ->middleware('permission:outlets-update')
        ->name('outlets.edit');

    Route::put('outlets/{outlet}', [OutletController::class, 'update'])
        ->middleware('permission:outlets-update')
        ->name('outlets.update');

    Route::delete('outlets/{outlet}', [OutletController::class, 'destroy'])
        ->middleware('permission:outlets-delete')
        ->name('outlets.destroy');
});
