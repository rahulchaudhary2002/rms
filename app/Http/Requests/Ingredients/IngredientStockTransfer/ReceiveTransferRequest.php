<?php

namespace App\Http\Requests\Ingredients\IngredientStockTransfer;

use Illuminate\Foundation\Http\FormRequest;

class ReceiveTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items'                         => ['required', 'array', 'min:1'],
            'items.*.id'                    => ['required', 'integer', 'exists:ingredient_stock_transfer_items,id'],
            'items.*.received_quantity'     => ['required', 'numeric', 'min:0'],
            'items.*.batch_no'              => ['nullable', 'string', 'max:255'],
            'items.*.expiry_date'           => ['nullable', 'date'],
        ];
    }
}
