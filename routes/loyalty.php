<?php

use App\Http\Controllers\Loyalty\LoyaltyPointRuleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {
    Route::get('loyalty-point-rules', [LoyaltyPointRuleController::class, 'index'])
        ->middleware('permission:loyalty-point-rules-view')
        ->name('loyalty-point-rules.index');

    Route::get('loyalty-point-rules/create', [LoyaltyPointRuleController::class, 'create'])
        ->middleware('permission:loyalty-point-rules-create')
        ->name('loyalty-point-rules.create');

    Route::post('loyalty-point-rules', [LoyaltyPointRuleController::class, 'store'])
        ->middleware('permission:loyalty-point-rules-create')
        ->name('loyalty-point-rules.store');

    Route::get('loyalty-point-rules/{loyalty_point_rule}', [LoyaltyPointRuleController::class, 'show'])
        ->middleware('permission:loyalty-point-rules-view')
        ->name('loyalty-point-rules.show');

    Route::get('loyalty-point-rules/{loyalty_point_rule}/edit', [LoyaltyPointRuleController::class, 'edit'])
        ->middleware('permission:loyalty-point-rules-update')
        ->name('loyalty-point-rules.edit');

    Route::put('loyalty-point-rules/{loyalty_point_rule}', [LoyaltyPointRuleController::class, 'update'])
        ->middleware('permission:loyalty-point-rules-update')
        ->name('loyalty-point-rules.update');

    Route::delete('loyalty-point-rules/{loyalty_point_rule}', [LoyaltyPointRuleController::class, 'destroy'])
        ->middleware('permission:loyalty-point-rules-delete')
        ->name('loyalty-point-rules.destroy');

    Route::patch('loyalty-point-rules/{loyalty_point_rule}/toggle-status', [LoyaltyPointRuleController::class, 'toggleStatus'])
        ->middleware('permission:loyalty-point-rules-update')
        ->name('loyalty-point-rules.toggle-status');
});
