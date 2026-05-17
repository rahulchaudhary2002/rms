<?php

namespace App\Http\Requests\Ingredients\IngredientStockTransfer;

use Illuminate\Foundation\Http\FormRequest;

class DispatchTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items'                           => ['required', 'array', 'min:1'],
            'items.*.id'                      => ['required', 'integer', 'exists:ingredient_stock_transfer_items,id'],
            'items.*.dispatched_quantity'     => ['required', 'numeric', 'min:0.0001'],
            'items.*.ingredient_batch_id'     => ['nullable', 'integer', 'exists:ingredient_batches,id'],
        ];
    }
}
