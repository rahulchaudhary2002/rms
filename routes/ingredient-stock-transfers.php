<?php

use App\Http\Controllers\Ingredients\IngredientStockTransferController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('ingredient-stock-transfers', [IngredientStockTransferController::class, 'index'])
        ->middleware('permission:ingredient-stock-transfers-view')
        ->name('ingredient-stock-transfers.index');

    Route::get('ingredient-stock-transfers/create', [IngredientStockTransferController::class, 'create'])
        ->middleware('permission:ingredient-stock-transfers-create')
        ->name('ingredient-stock-transfers.create');

    Route::post('ingredient-stock-transfers', [IngredientStockTransferController::class, 'store'])
        ->middleware('permission:ingredient-stock-transfers-create')
        ->name('ingredient-stock-transfers.store');

    Route::get('ingredient-stock-transfers/{ingredientStockTransfer}', [IngredientStockTransferController::class, 'show'])
        ->middleware('permission:ingredient-stock-transfers-view')
        ->name('ingredient-stock-transfers.show');

    Route::get('ingredient-stock-transfers/{ingredientStockTransfer}/edit', [IngredientStockTransferController::class, 'edit'])
        ->middleware('permission:ingredient-stock-transfers-update')
        ->name('ingredient-stock-transfers.edit');

    Route::put('ingredient-stock-transfers/{ingredientStockTransfer}', [IngredientStockTransferController::class, 'update'])
        ->middleware('permission:ingredient-stock-transfers-update')
        ->name('ingredient-stock-transfers.update');

    Route::delete('ingredient-stock-transfers/{ingredientStockTransfer}', [IngredientStockTransferController::class, 'destroy'])
        ->middleware('permission:ingredient-stock-transfers-delete')
        ->name('ingredient-stock-transfers.destroy');

    Route::post('ingredient-stock-transfers/{ingredientStockTransfer}/submit', [IngredientStockTransferController::class, 'submit'])
        ->middleware('permission:ingredient-stock-transfers-request')
        ->name('ingredient-stock-transfers.submit');

    Route::post('ingredient-stock-transfers/{ingredientStockTransfer}/approve', [IngredientStockTransferController::class, 'approve'])
        ->middleware('permission:ingredient-stock-transfers-approve')
        ->name('ingredient-stock-transfers.approve');

    Route::post('ingredient-stock-transfers/{ingredientStockTransfer}/dispatch', [IngredientStockTransferController::class, 'dispatch'])
        ->middleware('permission:ingredient-stock-transfers-dispatch')
        ->name('ingredient-stock-transfers.dispatch');

    Route::post('ingredient-stock-transfers/{ingredientStockTransfer}/receive', [IngredientStockTransferController::class, 'receive'])
        ->middleware('permission:ingredient-stock-transfers-receive')
        ->name('ingredient-stock-transfers.receive');

    Route::post('ingredient-stock-transfers/{ingredientStockTransfer}/cancel', [IngredientStockTransferController::class, 'cancel'])
        ->middleware('permission:ingredient-stock-transfers-cancel')
        ->name('ingredient-stock-transfers.cancel');
});
