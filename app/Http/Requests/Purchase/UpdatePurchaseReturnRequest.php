<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id'                     => ['required', 'exists:suppliers,id'],
            'warehouse_id'                    => ['required', 'exists:warehouses,id'],
            'purchase_receive_id'             => ['nullable', 'exists:purchase_receives,id'],
            'purchase_invoice_id'             => ['nullable', 'exists:purchase_invoices,id'],
            'return_date'                     => ['required', 'date'],
            'tax_amount'                      => ['nullable', 'numeric', 'min:0'],
            'reason'                          => ['nullable', 'string'],
            'items'                           => ['required', 'array', 'min:1'],
            'items.*.ingredient_id'           => ['required', 'exists:ingredients,id'],
            'items.*.ingredient_batch_id'     => ['nullable', 'exists:ingredient_batches,id'],
            'items.*.unit_id'                 => ['required', 'exists:units,id'],
            'items.*.quantity'                => ['required', 'numeric', 'min:0.0001'],
            'items.*.unit_price'              => ['nullable', 'numeric', 'min:0'],
            'items.*.reason'                  => ['nullable', 'string'],
        ];
    }
}
