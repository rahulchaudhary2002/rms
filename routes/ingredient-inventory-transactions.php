<?php

use App\Http\Controllers\Ingredients\IngredientInventoryTransactionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('ingredient-inventory-transactions', [IngredientInventoryTransactionController::class, 'index'])
        ->middleware('permission:ingredient-inventory-transactions-view')
        ->name('ingredient-inventory-transactions.index');
});
