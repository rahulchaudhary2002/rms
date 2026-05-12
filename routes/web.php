<?php

use App\Http\Controllers\OutletController;
use App\Http\Controllers\ScopeSelectionController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('scope-selection', 'scope-selection')->name('scope-selection.index');
    Route::post('scope-selection', [ScopeSelectionController::class, 'store'])->name('scope-selection.store');
    Route::post('scope-selection/nodes', [ScopeSelectionController::class, 'storeNode'])->name('scope-selection.nodes.store');
    Route::post('outlets', [OutletController::class, 'store'])->name('outlets.store');
    Route::post('warehouses', [WarehouseController::class, 'store'])->name('warehouses.store');
});

require __DIR__.'/settings.php';
