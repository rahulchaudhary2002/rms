<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseReceiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purchase_order_id'               => ['nullable', 'exists:purchase_orders,id'],
            'supplier_id'                     => ['required', 'exists:suppliers,id'],
            'warehouse_id'                    => ['required', 'exists:warehouses,id'],
            'received_date'                   => ['required', 'date'],
            'notes'                           => ['nullable', 'string'],
            'items'                           => ['required', 'array', 'min:1'],
            'items.*.purchase_order_item_id'  => ['nullable', 'exists:purchase_order_items,id'],
            'items.*.ingredient_id'           => ['required', 'exists:ingredients,id'],
            'items.*.unit_id'                 => ['required', 'exists:units,id'],
            'items.*.ordered_quantity'        => ['nullable', 'numeric', 'min:0'],
            'items.*.received_quantity'       => ['required', 'numeric', 'min:0.0001'],
            'items.*.rejected_quantity'       => ['nullable', 'numeric', 'min:0', 'lte:items.*.received_quantity'],
            'items.*.unit_price'              => ['nullable', 'numeric', 'min:0'],
            'items.*.batch_no'                => ['nullable', 'string', 'max:100'],
            'items.*.manufactured_date'       => ['nullable', 'date'],
            'items.*.expiry_date'             => ['nullable', 'date'],
            'items.*.remarks'                 => ['nullable', 'string'],
        ];
    }
}
