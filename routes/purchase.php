<?php

use App\Http\Controllers\Purchase\PurchaseInvoiceController;
use App\Http\Controllers\Purchase\PurchaseOrderController;
use App\Http\Controllers\Purchase\PurchaseReceiveController;
use App\Http\Controllers\Purchase\PurchaseReturnController;
use App\Http\Controllers\Purchase\SupplierController;
use App\Http\Controllers\Purchase\SupplierPaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'node.selected'])->group(function () {

    // Suppliers
    Route::get('suppliers', [SupplierController::class, 'index'])
        ->middleware('permission:suppliers-view')
        ->name('suppliers.index');

    Route::get('suppliers/create', [SupplierController::class, 'create'])
        ->middleware('permission:suppliers-create')
        ->name('suppliers.create');

    Route::post('suppliers', [SupplierController::class, 'store'])
        ->middleware('permission:suppliers-create')
        ->name('suppliers.store');

    Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])
        ->middleware('permission:suppliers-view')
        ->name('suppliers.show');

    Route::get('suppliers/{supplier}/edit', [SupplierController::class, 'edit'])
        ->middleware('permission:suppliers-edit')
        ->name('suppliers.edit');

    Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])
        ->middleware('permission:suppliers-edit')
        ->name('suppliers.update');

    Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])
        ->middleware('permission:suppliers-delete')
        ->name('suppliers.destroy');

    Route::patch('suppliers/{supplier}/active', [SupplierController::class, 'toggleActive'])
        ->middleware('permission:suppliers-edit')
        ->name('suppliers.toggle-active');

    // Purchase Orders
    Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])
        ->middleware('permission:purchase-orders-view')
        ->name('purchase-orders.index');

    Route::get('purchase-orders/create', [PurchaseOrderController::class, 'create'])
        ->middleware('permission:purchase-orders-create')
        ->name('purchase-orders.create');

    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])
        ->middleware('permission:purchase-orders-create')
        ->name('purchase-orders.store');

    Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])
        ->middleware('permission:purchase-orders-view')
        ->name('purchase-orders.show');

    Route::get('purchase-orders/{purchaseOrder}/edit', [PurchaseOrderController::class, 'edit'])
        ->middleware('permission:purchase-orders-edit')
        ->name('purchase-orders.edit');

    Route::put('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])
        ->middleware('permission:purchase-orders-edit')
        ->name('purchase-orders.update');

    Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])
        ->middleware('permission:purchase-orders-delete')
        ->name('purchase-orders.destroy');

    Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])
        ->middleware('permission:purchase-orders-approve')
        ->name('purchase-orders.approve');

    Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])
        ->middleware('permission:purchase-orders-edit')
        ->name('purchase-orders.cancel');

    // Purchase Receives
    Route::get('purchase-receives', [PurchaseReceiveController::class, 'index'])
        ->middleware('permission:purchase-receives-view')
        ->name('purchase-receives.index');

    Route::get('purchase-receives/create', [PurchaseReceiveController::class, 'create'])
        ->middleware('permission:purchase-receives-create')
        ->name('purchase-receives.create');

    Route::post('purchase-receives', [PurchaseReceiveController::class, 'store'])
        ->middleware('permission:purchase-receives-create')
        ->name('purchase-receives.store');

    Route::get('purchase-receives/{purchaseReceive}', [PurchaseReceiveController::class, 'show'])
        ->middleware('permission:purchase-receives-view')
        ->name('purchase-receives.show');

    Route::get('purchase-receives/{purchaseReceive}/edit', [PurchaseReceiveController::class, 'edit'])
        ->middleware('permission:purchase-receives-edit')
        ->name('purchase-receives.edit');

    Route::put('purchase-receives/{purchaseReceive}', [PurchaseReceiveController::class, 'update'])
        ->middleware('permission:purchase-receives-edit')
        ->name('purchase-receives.update');

    Route::delete('purchase-receives/{purchaseReceive}', [PurchaseReceiveController::class, 'destroy'])
        ->middleware('permission:purchase-receives-delete')
        ->name('purchase-receives.destroy');

    Route::post('purchase-receives/{purchaseReceive}/post', [PurchaseReceiveController::class, 'post'])
        ->middleware('permission:purchase-receives-post')
        ->name('purchase-receives.post');

    Route::post('purchase-receives/{purchaseReceive}/cancel', [PurchaseReceiveController::class, 'cancel'])
        ->middleware('permission:purchase-receives-edit')
        ->name('purchase-receives.cancel');

    // Purchase Invoices
    Route::get('purchase-invoices', [PurchaseInvoiceController::class, 'index'])
        ->middleware('permission:purchase-invoices-view')
        ->name('purchase-invoices.index');

    Route::get('purchase-invoices/create', [PurchaseInvoiceController::class, 'create'])
        ->middleware('permission:purchase-invoices-create')
        ->name('purchase-invoices.create');

    Route::post('purchase-invoices', [PurchaseInvoiceController::class, 'store'])
        ->middleware('permission:purchase-invoices-create')
        ->name('purchase-invoices.store');

    Route::get('purchase-invoices/{purchaseInvoice}', [PurchaseInvoiceController::class, 'show'])
        ->middleware('permission:purchase-invoices-view')
        ->name('purchase-invoices.show');

    Route::get('purchase-invoices/{purchaseInvoice}/edit', [PurchaseInvoiceController::class, 'edit'])
        ->middleware('permission:purchase-invoices-edit')
        ->name('purchase-invoices.edit');

    Route::put('purchase-invoices/{purchaseInvoice}', [PurchaseInvoiceController::class, 'update'])
        ->middleware('permission:purchase-invoices-edit')
        ->name('purchase-invoices.update');

    Route::delete('purchase-invoices/{purchaseInvoice}', [PurchaseInvoiceController::class, 'destroy'])
        ->middleware('permission:purchase-invoices-delete')
        ->name('purchase-invoices.destroy');

    Route::post('purchase-invoices/{purchaseInvoice}/cancel', [PurchaseInvoiceController::class, 'cancel'])
        ->middleware('permission:purchase-invoices-edit')
        ->name('purchase-invoices.cancel');

    // Supplier Payments
    Route::get('supplier-payments', [SupplierPaymentController::class, 'index'])
        ->middleware('permission:supplier-payments-view')
        ->name('supplier-payments.index');

    Route::get('supplier-payments/create', [SupplierPaymentController::class, 'create'])
        ->middleware('permission:supplier-payments-create')
        ->name('supplier-payments.create');

    Route::post('supplier-payments', [SupplierPaymentController::class, 'store'])
        ->middleware('permission:supplier-payments-create')
        ->name('supplier-payments.store');

    Route::get('supplier-payments/invoices', [SupplierPaymentController::class, 'invoices'])
        ->middleware('permission:supplier-payments-create')
        ->name('supplier-payments.invoices');

    Route::get('supplier-payments/{supplierPayment}', [SupplierPaymentController::class, 'show'])
        ->middleware('permission:supplier-payments-view')
        ->name('supplier-payments.show');

    Route::delete('supplier-payments/{supplierPayment}', [SupplierPaymentController::class, 'destroy'])
        ->middleware('permission:supplier-payments-delete')
        ->name('supplier-payments.destroy');

    // Purchase Returns
    Route::get('purchase-returns', [PurchaseReturnController::class, 'index'])
        ->middleware('permission:purchase-returns-view')
        ->name('purchase-returns.index');

    Route::get('purchase-returns/create', [PurchaseReturnController::class, 'create'])
        ->middleware('permission:purchase-returns-create')
        ->name('purchase-returns.create');

    Route::post('purchase-returns', [PurchaseReturnController::class, 'store'])
        ->middleware('permission:purchase-returns-create')
        ->name('purchase-returns.store');

    Route::get('purchase-returns/{purchaseReturn}', [PurchaseReturnController::class, 'show'])
        ->middleware('permission:purchase-returns-view')
        ->name('purchase-returns.show');

    Route::get('purchase-returns/{purchaseReturn}/edit', [PurchaseReturnController::class, 'edit'])
        ->middleware('permission:purchase-returns-edit')
        ->name('purchase-returns.edit');

    Route::put('purchase-returns/{purchaseReturn}', [PurchaseReturnController::class, 'update'])
        ->middleware('permission:purchase-returns-edit')
        ->name('purchase-returns.update');

    Route::delete('purchase-returns/{purchaseReturn}', [PurchaseReturnController::class, 'destroy'])
        ->middleware('permission:purchase-returns-delete')
        ->name('purchase-returns.destroy');

    Route::post('purchase-returns/{purchaseReturn}/post', [PurchaseReturnController::class, 'post'])
        ->middleware('permission:purchase-returns-post')
        ->name('purchase-returns.post');

    Route::post('purchase-returns/{purchaseReturn}/cancel', [PurchaseReturnController::class, 'cancel'])
        ->middleware('permission:purchase-returns-edit')
        ->name('purchase-returns.cancel');
});
