<?php

use App\Http\Controllers\Customers\CustomerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {
    Route::get('customers', [CustomerController::class, 'index'])
        ->middleware('permission:customers-view')
        ->name('customers.index');

    Route::get('customers/create', [CustomerController::class, 'create'])
        ->middleware('permission:customers-create')
        ->name('customers.create');

    Route::post('customers', [CustomerController::class, 'store'])
        ->middleware('permission:customers-create')
        ->name('customers.store');

    Route::get('customers/{customer}', [CustomerController::class, 'show'])
        ->middleware('permission:customers-view')
        ->name('customers.show');

    Route::get('customers/{customer}/edit', [CustomerController::class, 'edit'])
        ->middleware('permission:customers-update')
        ->name('customers.edit');

    Route::put('customers/{customer}', [CustomerController::class, 'update'])
        ->middleware('permission:customers-update')
        ->name('customers.update');

    Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])
        ->middleware('permission:customers-delete')
        ->name('customers.destroy');

    Route::patch('customers/{customer}/toggle-status', [CustomerController::class, 'toggleStatus'])
        ->middleware('permission:customers-update')
        ->name('customers.toggle-status');
});
