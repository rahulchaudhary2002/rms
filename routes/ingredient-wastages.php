<?php

use App\Http\Controllers\Ingredients\IngredientWastageController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('ingredient-wastages', [IngredientWastageController::class, 'index'])
        ->middleware('permission:ingredient-wastages-view')
        ->name('ingredient-wastages.index');

    Route::get('ingredient-wastages/create', [IngredientWastageController::class, 'create'])
        ->middleware('permission:ingredient-wastages-create')
        ->name('ingredient-wastages.create');

    Route::post('ingredient-wastages', [IngredientWastageController::class, 'store'])
        ->middleware('permission:ingredient-wastages-create')
        ->name('ingredient-wastages.store');

    Route::get('ingredient-wastages/{ingredientWastage}', [IngredientWastageController::class, 'show'])
        ->middleware('permission:ingredient-wastages-view')
        ->name('ingredient-wastages.show');

    Route::get('ingredient-wastages/{ingredientWastage}/edit', [IngredientWastageController::class, 'edit'])
        ->middleware('permission:ingredient-wastages-update')
        ->name('ingredient-wastages.edit');

    Route::put('ingredient-wastages/{ingredientWastage}', [IngredientWastageController::class, 'update'])
        ->middleware('permission:ingredient-wastages-update')
        ->name('ingredient-wastages.update');

    Route::delete('ingredient-wastages/{ingredientWastage}', [IngredientWastageController::class, 'destroy'])
        ->middleware('permission:ingredient-wastages-delete')
        ->name('ingredient-wastages.destroy');

    Route::post('ingredient-wastages/{ingredientWastage}/approve', [IngredientWastageController::class, 'approve'])
        ->middleware('permission:ingredient-wastages-approve')
        ->name('ingredient-wastages.approve');

    Route::post('ingredient-wastages/{ingredientWastage}/cancel', [IngredientWastageController::class, 'cancel'])
        ->middleware('permission:ingredient-wastages-cancel')
        ->name('ingredient-wastages.cancel');
});
