<?php

namespace App\Http\Requests\Ingredients\IngredientWastage;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIngredientWastageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id'  => ['required', 'integer', 'exists:warehouses,id'],
            'wastage_date'  => ['required', 'date'],
            'reason'        => ['required', Rule::in(['expired', 'damaged', 'spoiled', 'over_preparation', 'staff_error', 'other'])],
            'remarks'       => ['nullable', 'string', 'max:2000'],

            'items'                       => ['required', 'array', 'min:1'],
            'items.*.ingredient_id'       => ['required', 'integer', 'exists:ingredients,id'],
            'items.*.ingredient_batch_id' => ['nullable', 'integer', 'exists:ingredient_batches,id'],
            'items.*.quantity'            => ['required', 'numeric', 'min:0.0001'],
        ];
    }
}
