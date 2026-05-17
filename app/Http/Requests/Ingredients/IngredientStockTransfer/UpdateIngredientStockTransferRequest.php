<?php

namespace App\Http\Requests\Ingredients\IngredientStockTransfer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIngredientStockTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'to_warehouse_id'   => [
                'required',
                'integer',
                'exists:warehouses,id',
                Rule::notIn([$this->input('from_warehouse_id')]),
            ],
            'transfer_date' => ['required', 'date'],
            'remarks'       => ['nullable', 'string', 'max:2000'],

            'items'                          => ['required', 'array', 'min:1'],
            'items.*.ingredient_id'          => ['required', 'integer', 'exists:ingredients,id'],
            'items.*.ingredient_batch_id'    => ['nullable', 'integer', 'exists:ingredient_batches,id'],
            'items.*.requested_quantity'     => ['required', 'numeric', 'min:0.0001'],
            'items.*.remarks'                => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'to_warehouse_id.not_in' => 'Source and destination warehouses must be different.',
        ];
    }
}
