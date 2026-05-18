<?php

use App\Http\Controllers\OutletController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ScopeSelectionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('media/{path}', [MediaController::class, 'show'])
    ->where('path', '.*')
    ->name('media.show');

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('scope-selection', 'scope-selection')->name('scope-selection.index');
    Route::post('scope-selection', [ScopeSelectionController::class, 'store'])->name('scope-selection.store');
    Route::post('scope-selection/nodes', [ScopeSelectionController::class, 'storeNode'])->name('scope-selection.nodes.store');
    Route::post('outlets', [OutletController::class, 'store'])->name('outlets.store');
    Route::post('warehouses', [WarehouseController::class, 'store'])->name('warehouses.store');

    Route::resource('users', UserController::class)
        ->middleware('permission:users-manage');
});

require __DIR__.'/settings.php';
require __DIR__.'/access-control.php';
require __DIR__.'/units.php';
require __DIR__.'/ingredients.php';
require __DIR__.'/locations.php';
require __DIR__.'/customers.php';
require __DIR__.'/loyalty.php';
require __DIR__.'/food.php';
require __DIR__.'/departments.php';
require __DIR__.'/outlets.php';
require __DIR__.'/warehouses.php';
require __DIR__.'/warehouse-ingredient-stocks.php';
require __DIR__.'/ingredient-batches.php';
require __DIR__.'/ingredient-inventory-transactions.php';
require __DIR__.'/ingredient-stock-transfers.php';
require __DIR__.'/ingredient-wastages.php';
require __DIR__.'/ingredient-stock-outs.php';
require __DIR__.'/ingredient-stock-adjustments.php';
require __DIR__.'/ingredient-stock-counts.php';
require __DIR__.'/purchase.php';
require __DIR__.'/dining.php';
