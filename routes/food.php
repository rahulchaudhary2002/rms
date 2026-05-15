<?php

use App\Http\Controllers\Food\AddonController;
use App\Http\Controllers\Food\AddonGroupController;
use App\Http\Controllers\Food\AddonRecipeController;
use App\Http\Controllers\Food\FoodAddonGroupController;
use App\Http\Controllers\Food\FoodAvailabilityScheduleController;
use App\Http\Controllers\Food\FoodCategoryController;
use App\Http\Controllers\Food\FoodComboItemController;
use App\Http\Controllers\Food\FoodController;
use App\Http\Controllers\Food\FoodImageController;
use App\Http\Controllers\Food\FoodOutletController;
use App\Http\Controllers\Food\FoodRecipeController;
use App\Http\Controllers\Food\FoodVariantController;
use App\Http\Controllers\Food\FoodVariantOutletController;
use Illuminate\Support\Facades\Route;

Route::pattern('food', '[0-9]+');

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    // ── Food Categories ───────────────────────────────────────────────────────
    Route::get('food-categories', [FoodCategoryController::class, 'index'])
        ->middleware('permission:food-categories-view')
        ->name('food-categories.index');

    Route::get('food-categories/create', [FoodCategoryController::class, 'create'])
        ->middleware('permission:food-categories-create')
        ->name('food-categories.create');

    Route::post('food-categories', [FoodCategoryController::class, 'store'])
        ->middleware('permission:food-categories-create')
        ->name('food-categories.store');

    Route::get('food-categories/{food_category}/edit', [FoodCategoryController::class, 'edit'])
        ->middleware('permission:food-categories-update')
        ->name('food-categories.edit');

    Route::put('food-categories/{food_category}', [FoodCategoryController::class, 'update'])
        ->middleware('permission:food-categories-update')
        ->name('food-categories.update');

    Route::delete('food-categories/{food_category}', [FoodCategoryController::class, 'destroy'])
        ->middleware('permission:food-categories-delete')
        ->name('food-categories.destroy');

    Route::patch('food-categories/{food_category}/toggle-status', [FoodCategoryController::class, 'toggleStatus'])
        ->middleware('permission:food-categories-update')
        ->name('food-categories.toggle-status');

    // ── Foods ─────────────────────────────────────────────────────────────────
    Route::get('foods', [FoodController::class, 'index'])
        ->middleware('permission:foods-view')
        ->name('foods.index');

    Route::get('foods/create', [FoodController::class, 'create'])
        ->middleware('permission:foods-create')
        ->name('foods.create');

    Route::post('foods', [FoodController::class, 'store'])
        ->middleware('permission:foods-create')
        ->name('foods.store');

    Route::get('foods/{food}/edit', [FoodController::class, 'edit'])
        ->middleware('permission:foods-update')
        ->name('foods.edit');

    Route::put('foods/{food}', [FoodController::class, 'update'])
        ->middleware('permission:foods-update')
        ->name('foods.update');

    Route::delete('foods/{food}', [FoodController::class, 'destroy'])
        ->middleware('permission:foods-delete')
        ->name('foods.destroy');

    Route::patch('foods/{food}/toggle-status', [FoodController::class, 'toggleStatus'])
        ->middleware('permission:foods-update')
        ->name('foods.toggle-status');

    Route::patch('foods/{food}/toggle-featured', [FoodController::class, 'toggleFeatured'])
        ->middleware('permission:foods-update')
        ->name('foods.toggle-featured');

    // ── Food Variants ─────────────────────────────────────────────────────────
    Route::post('foods/{food}/variants', [FoodVariantController::class, 'store'])
        ->middleware('permission:foods-update')
        ->name('food-variants.store');

    Route::put('foods/{food}/variants/{food_variant}', [FoodVariantController::class, 'update'])
        ->middleware('permission:foods-update')
        ->name('food-variants.update');

    Route::delete('foods/{food}/variants/{food_variant}', [FoodVariantController::class, 'destroy'])
        ->middleware('permission:foods-update')
        ->name('food-variants.destroy');

    Route::patch('foods/{food}/variants/{food_variant}/toggle-status', [FoodVariantController::class, 'toggleStatus'])
        ->middleware('permission:foods-update')
        ->name('food-variants.toggle-status');

    // ── Food Outlet Prices ────────────────────────────────────────────────────
    Route::post('foods/{food}/outlet-prices', [FoodOutletController::class, 'upsert'])
        ->middleware('permission:foods-update')
        ->name('food-outlets.upsert');

    // ── Food Variant Outlet Prices ────────────────────────────────────────────
    Route::post('foods/{food}/variants/{food_variant}/outlet-prices', [FoodVariantOutletController::class, 'upsert'])
        ->middleware('permission:foods-update')
        ->name('food-variant-outlets.upsert');

    // ── Food Add-on Groups ────────────────────────────────────────────────────
    Route::post('foods/{food}/addon-groups/sync', [FoodAddonGroupController::class, 'sync'])
        ->middleware('permission:foods-update')
        ->name('food-addon-groups.sync');

    Route::post('foods/{food}/addon-groups/attach', [FoodAddonGroupController::class, 'attach'])
        ->middleware('permission:foods-update')
        ->name('food-addon-groups.attach');

    Route::delete('foods/{food}/addon-groups/detach', [FoodAddonGroupController::class, 'detach'])
        ->middleware('permission:foods-update')
        ->name('food-addon-groups.detach');

    // ── Food Recipes ──────────────────────────────────────────────────────────
    Route::post('foods/{food}/recipes', [FoodRecipeController::class, 'upsert'])
        ->middleware('permission:foods-update')
        ->name('food-recipes.upsert');

    Route::delete('foods/{food}/recipes/{food_recipe}', [FoodRecipeController::class, 'destroy'])
        ->middleware('permission:foods-update')
        ->name('food-recipes.destroy');

    // ── Food Availability Schedules ───────────────────────────────────────────
    Route::post('foods/{food}/schedules', [FoodAvailabilityScheduleController::class, 'upsert'])
        ->middleware('permission:foods-update')
        ->name('food-schedules.upsert');

    Route::delete('foods/{food}/schedules/{schedule}', [FoodAvailabilityScheduleController::class, 'destroy'])
        ->middleware('permission:foods-update')
        ->name('food-schedules.destroy');

    // ── Food Images ───────────────────────────────────────────────────────────
    Route::post('foods/{food}/images', [FoodImageController::class, 'store'])
        ->middleware('permission:foods-update')
        ->name('food-images.store');

    Route::patch('foods/{food}/images/{image}/set-primary', [FoodImageController::class, 'setPrimary'])
        ->middleware('permission:foods-update')
        ->name('food-images.set-primary');

    Route::delete('foods/{food}/images/{image}', [FoodImageController::class, 'destroy'])
        ->middleware('permission:foods-update')
        ->name('food-images.destroy');

    Route::post('foods/{food}/images/reorder', [FoodImageController::class, 'reorder'])
        ->middleware('permission:foods-update')
        ->name('food-images.reorder');

    // ── Food Combo Items ──────────────────────────────────────────────────────
    Route::post('foods/{food}/combo-items', [FoodComboItemController::class, 'store'])
        ->middleware('permission:foods-update')
        ->name('food-combo-items.store');

    Route::put('foods/{food}/combo-items/{combo_item}', [FoodComboItemController::class, 'update'])
        ->middleware('permission:foods-update')
        ->name('food-combo-items.update');

    Route::delete('foods/{food}/combo-items/{combo_item}', [FoodComboItemController::class, 'destroy'])
        ->middleware('permission:foods-update')
        ->name('food-combo-items.destroy');

    Route::get('foods/{food}', [FoodController::class, 'show'])
        ->middleware('permission:foods-view')
        ->name('foods.show');

    // ── Add-on Groups ─────────────────────────────────────────────────────────
    Route::get('addon-groups', [AddonGroupController::class, 'index'])
        ->middleware('permission:addon-groups-view')
        ->name('addon-groups.index');

    Route::get('addon-groups/create', [AddonGroupController::class, 'create'])
        ->middleware('permission:addon-groups-create')
        ->name('addon-groups.create');

    Route::post('addon-groups', [AddonGroupController::class, 'store'])
        ->middleware('permission:addon-groups-create')
        ->name('addon-groups.store');

    Route::get('addon-groups/{addon_group}', [AddonGroupController::class, 'show'])
        ->middleware('permission:addon-groups-view')
        ->name('addon-groups.show');

    Route::get('addon-groups/{addon_group}/edit', [AddonGroupController::class, 'edit'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-groups.edit');

    Route::put('addon-groups/{addon_group}', [AddonGroupController::class, 'update'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-groups.update');

    Route::delete('addon-groups/{addon_group}', [AddonGroupController::class, 'destroy'])
        ->middleware('permission:addon-groups-delete')
        ->name('addon-groups.destroy');

    Route::patch('addon-groups/{addon_group}/toggle-status', [AddonGroupController::class, 'toggleStatus'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-groups.toggle-status');

    // ── Addons ────────────────────────────────────────────────────────────────
    Route::get('addons', [AddonController::class, 'index'])
        ->middleware('permission:addon-groups-view')
        ->name('addons.index');

    Route::get('addons/create', [AddonController::class, 'create'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.create');

    Route::post('addons', [AddonController::class, 'store'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.store');

    Route::get('addons/{addon}', [AddonController::class, 'show'])
        ->middleware('permission:addon-groups-view')
        ->name('addons.show');

    Route::get('addons/{addon}/edit', [AddonController::class, 'edit'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.edit');

    Route::put('addons/{addon}', [AddonController::class, 'update'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.update');

    Route::delete('addons/{addon}', [AddonController::class, 'destroy'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.destroy');

    Route::patch('addons/{addon}/toggle-status', [AddonController::class, 'toggleStatus'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.toggle-status');

    Route::post('addon-groups/{addon_group}/addons', [AddonController::class, 'storeForGroup'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-groups.addons.store');

    Route::put('addon-groups/{addon_group}/addons/{addon}', [AddonController::class, 'updateForGroup'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-groups.addons.update');

    Route::delete('addon-groups/{addon_group}/addons/{addon}', [AddonController::class, 'destroyForGroup'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-groups.addons.destroy');

    // ── Addon Recipes ─────────────────────────────────────────────────────────
    Route::post('addon-groups/{addon_group}/addons/{addon}/recipes', [AddonRecipeController::class, 'upsert'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-recipes.upsert');

    Route::delete('addon-groups/{addon_group}/addons/{addon}/recipes/{addon_recipe}', [AddonRecipeController::class, 'destroy'])
        ->middleware('permission:addon-groups-update')
        ->name('addon-recipes.destroy');

    Route::post('addons/{addon}/recipes', [AddonRecipeController::class, 'upsertForAddon'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.recipes.upsert');

    Route::delete('addons/{addon}/recipes/{addon_recipe}', [AddonRecipeController::class, 'destroyForAddon'])
        ->middleware('permission:addon-groups-update')
        ->name('addons.recipes.destroy');
});
