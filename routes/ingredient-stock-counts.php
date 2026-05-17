<?php

use App\Http\Controllers\Ingredients\IngredientStockCountController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('ingredient-stock-counts', [IngredientStockCountController::class, 'index'])
        ->middleware('permission:ingredient-stock-counts-view')
        ->name('ingredient-stock-counts.index');

    Route::get('ingredient-stock-counts/create', [IngredientStockCountController::class, 'create'])
        ->middleware('permission:ingredient-stock-counts-create')
        ->name('ingredient-stock-counts.create');

    Route::post('ingredient-stock-counts', [IngredientStockCountController::class, 'store'])
        ->middleware('permission:ingredient-stock-counts-create')
        ->name('ingredient-stock-counts.store');

    Route::get('ingredient-stock-counts/{ingredientStockCount}', [IngredientStockCountController::class, 'show'])
        ->middleware('permission:ingredient-stock-counts-view')
        ->name('ingredient-stock-counts.show');

    Route::get('ingredient-stock-counts/{ingredientStockCount}/edit', [IngredientStockCountController::class, 'edit'])
        ->middleware('permission:ingredient-stock-counts-update')
        ->name('ingredient-stock-counts.edit');

    Route::put('ingredient-stock-counts/{ingredientStockCount}', [IngredientStockCountController::class, 'update'])
        ->middleware('permission:ingredient-stock-counts-update')
        ->name('ingredient-stock-counts.update');

    Route::delete('ingredient-stock-counts/{ingredientStockCount}', [IngredientStockCountController::class, 'destroy'])
        ->middleware('permission:ingredient-stock-counts-delete')
        ->name('ingredient-stock-counts.destroy');

    Route::post('ingredient-stock-counts/{ingredientStockCount}/start-counting', [IngredientStockCountController::class, 'startCounting'])
        ->middleware('permission:ingredient-stock-counts-start')
        ->name('ingredient-stock-counts.start-counting');

    Route::post('ingredient-stock-counts/{ingredientStockCount}/complete', [IngredientStockCountController::class, 'complete'])
        ->middleware('permission:ingredient-stock-counts-complete')
        ->name('ingredient-stock-counts.complete');

    Route::post('ingredient-stock-counts/{ingredientStockCount}/generate-adjustment', [IngredientStockCountController::class, 'generateAdjustment'])
        ->middleware('permission:ingredient-stock-counts-generate-adjustment')
        ->name('ingredient-stock-counts.generate-adjustment');

    Route::post('ingredient-stock-counts/{ingredientStockCount}/mark-adjusted', [IngredientStockCountController::class, 'markAdjusted'])
        ->middleware('permission:ingredient-stock-counts-update')
        ->name('ingredient-stock-counts.mark-adjusted');

    Route::post('ingredient-stock-counts/{ingredientStockCount}/cancel', [IngredientStockCountController::class, 'cancel'])
        ->middleware('permission:ingredient-stock-counts-cancel')
        ->name('ingredient-stock-counts.cancel');
});
