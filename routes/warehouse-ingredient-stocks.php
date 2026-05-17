<?php

use App\Http\Controllers\Ingredients\WarehouseIngredientStockController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('warehouse-ingredient-stocks', [WarehouseIngredientStockController::class, 'index'])
        ->middleware('permission:warehouse-ingredient-stocks-view')
        ->name('warehouse-ingredient-stocks.index');
});
