<?php

use App\Http\Controllers\Ingredients\IngredientStockOutController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('ingredient-stock-outs', [IngredientStockOutController::class, 'index'])
        ->middleware('permission:ingredient-stock-outs-view')
        ->name('ingredient-stock-outs.index');

    Route::get('ingredient-stock-outs/create', [IngredientStockOutController::class, 'create'])
        ->middleware('permission:ingredient-stock-outs-create')
        ->name('ingredient-stock-outs.create');

    Route::post('ingredient-stock-outs', [IngredientStockOutController::class, 'store'])
        ->middleware('permission:ingredient-stock-outs-create')
        ->name('ingredient-stock-outs.store');

    Route::get('ingredient-stock-outs/{ingredientStockOut}', [IngredientStockOutController::class, 'show'])
        ->middleware('permission:ingredient-stock-outs-view')
        ->name('ingredient-stock-outs.show');

    Route::get('ingredient-stock-outs/{ingredientStockOut}/edit', [IngredientStockOutController::class, 'edit'])
        ->middleware('permission:ingredient-stock-outs-update')
        ->name('ingredient-stock-outs.edit');

    Route::put('ingredient-stock-outs/{ingredientStockOut}', [IngredientStockOutController::class, 'update'])
        ->middleware('permission:ingredient-stock-outs-update')
        ->name('ingredient-stock-outs.update');

    Route::delete('ingredient-stock-outs/{ingredientStockOut}', [IngredientStockOutController::class, 'destroy'])
        ->middleware('permission:ingredient-stock-outs-delete')
        ->name('ingredient-stock-outs.destroy');

    Route::post('ingredient-stock-outs/{ingredientStockOut}/approve', [IngredientStockOutController::class, 'approve'])
        ->middleware('permission:ingredient-stock-outs-approve')
        ->name('ingredient-stock-outs.approve');

    Route::post('ingredient-stock-outs/{ingredientStockOut}/cancel', [IngredientStockOutController::class, 'cancel'])
        ->middleware('permission:ingredient-stock-outs-cancel')
        ->name('ingredient-stock-outs.cancel');
});
