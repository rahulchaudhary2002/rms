<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id'              => ['required', 'exists:suppliers,id'],
            'warehouse_id'             => ['required', 'exists:warehouses,id'],
            'order_date'               => ['required', 'date'],
            'expected_delivery_date'   => ['nullable', 'date', 'after_or_equal:order_date'],
            'discount_amount'          => ['nullable', 'numeric', 'min:0'],
            'tax_amount'               => ['nullable', 'numeric', 'min:0'],
            'shipping_amount'          => ['nullable', 'numeric', 'min:0'],
            'notes'                    => ['nullable', 'string'],
            'items'                    => ['required', 'array', 'min:1'],
            'items.*.ingredient_id'    => ['required', 'exists:ingredients,id'],
            'items.*.unit_id'          => ['required', 'exists:units,id'],
            'items.*.quantity'         => ['required', 'numeric', 'min:0.0001'],
            'items.*.unit_price'       => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount'  => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_amount'       => ['nullable', 'numeric', 'min:0'],
            'items.*.notes'            => ['nullable', 'string'],
        ];
    }
}
