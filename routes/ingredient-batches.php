<?php

use App\Http\Controllers\Ingredients\IngredientBatchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    Route::get('ingredient-batches', [IngredientBatchController::class, 'index'])
        ->middleware('permission:ingredient-batches-view')
        ->name('ingredient-batches.index');
});
