<?php

use App\Http\Controllers\Ingredients\IngredientStockAdjustmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('ingredient-stock-adjustments', [IngredientStockAdjustmentController::class, 'index'])
        ->middleware('permission:ingredient-stock-adjustments-view')
        ->name('ingredient-stock-adjustments.index');

    Route::get('ingredient-stock-adjustments/create', [IngredientStockAdjustmentController::class, 'create'])
        ->middleware('permission:ingredient-stock-adjustments-create')
        ->name('ingredient-stock-adjustments.create');

    Route::post('ingredient-stock-adjustments', [IngredientStockAdjustmentController::class, 'store'])
        ->middleware('permission:ingredient-stock-adjustments-create')
        ->name('ingredient-stock-adjustments.store');

    Route::get('ingredient-stock-adjustments/{ingredientStockAdjustment}', [IngredientStockAdjustmentController::class, 'show'])
        ->middleware('permission:ingredient-stock-adjustments-view')
        ->name('ingredient-stock-adjustments.show');

    Route::get('ingredient-stock-adjustments/{ingredientStockAdjustment}/edit', [IngredientStockAdjustmentController::class, 'edit'])
        ->middleware('permission:ingredient-stock-adjustments-update')
        ->name('ingredient-stock-adjustments.edit');

    Route::put('ingredient-stock-adjustments/{ingredientStockAdjustment}', [IngredientStockAdjustmentController::class, 'update'])
        ->middleware('permission:ingredient-stock-adjustments-update')
        ->name('ingredient-stock-adjustments.update');

    Route::delete('ingredient-stock-adjustments/{ingredientStockAdjustment}', [IngredientStockAdjustmentController::class, 'destroy'])
        ->middleware('permission:ingredient-stock-adjustments-delete')
        ->name('ingredient-stock-adjustments.destroy');

    Route::post('ingredient-stock-adjustments/{ingredientStockAdjustment}/approve', [IngredientStockAdjustmentController::class, 'approve'])
        ->middleware('permission:ingredient-stock-adjustments-approve')
        ->name('ingredient-stock-adjustments.approve');

    Route::post('ingredient-stock-adjustments/{ingredientStockAdjustment}/cancel', [IngredientStockAdjustmentController::class, 'cancel'])
        ->middleware('permission:ingredient-stock-adjustments-cancel')
        ->name('ingredient-stock-adjustments.cancel');
});
