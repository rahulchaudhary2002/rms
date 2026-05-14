<?php

use App\Http\Controllers\Ingredients\IngredientCategoryController;
use App\Http\Controllers\Ingredients\IngredientController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    // Ingredient Categories
    Route::get('ingredient-categories', [IngredientCategoryController::class, 'index'])
        ->middleware('permission:ingredient-categories-view')
        ->name('ingredient-categories.index');

    Route::get('ingredient-categories/create', [IngredientCategoryController::class, 'create'])
        ->middleware('permission:ingredient-categories-create')
        ->name('ingredient-categories.create');

    Route::post('ingredient-categories', [IngredientCategoryController::class, 'store'])
        ->middleware('permission:ingredient-categories-create')
        ->name('ingredient-categories.store');

    Route::get('ingredient-categories/{ingredientCategory}/edit', [IngredientCategoryController::class, 'edit'])
        ->middleware('permission:ingredient-categories-update')
        ->name('ingredient-categories.edit');

    Route::put('ingredient-categories/{ingredientCategory}', [IngredientCategoryController::class, 'update'])
        ->middleware('permission:ingredient-categories-update')
        ->name('ingredient-categories.update');

    Route::delete('ingredient-categories/{ingredientCategory}', [IngredientCategoryController::class, 'destroy'])
        ->middleware('permission:ingredient-categories-delete')
        ->name('ingredient-categories.destroy');

    Route::patch('ingredient-categories/{ingredientCategory}/active', [IngredientCategoryController::class, 'toggleActive'])
        ->middleware('permission:ingredient-categories-update')
        ->name('ingredient-categories.toggle-active');

    // Ingredients
    Route::get('ingredients', [IngredientController::class, 'index'])
        ->middleware('permission:ingredients-view')
        ->name('ingredients.index');

    Route::get('ingredients/create', [IngredientController::class, 'create'])
        ->middleware('permission:ingredients-create')
        ->name('ingredients.create');

    Route::post('ingredients', [IngredientController::class, 'store'])
        ->middleware('permission:ingredients-create')
        ->name('ingredients.store');

    Route::get('ingredients/{ingredient}/edit', [IngredientController::class, 'edit'])
        ->middleware('permission:ingredients-update')
        ->name('ingredients.edit');

    Route::put('ingredients/{ingredient}', [IngredientController::class, 'update'])
        ->middleware('permission:ingredients-update')
        ->name('ingredients.update');

    Route::delete('ingredients/{ingredient}', [IngredientController::class, 'destroy'])
        ->middleware('permission:ingredients-delete')
        ->name('ingredients.destroy');

    Route::patch('ingredients/{ingredient}/active', [IngredientController::class, 'toggleActive'])
        ->middleware('permission:ingredients-update')
        ->name('ingredients.toggle-active');
});
