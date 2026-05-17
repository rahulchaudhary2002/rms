<?php

namespace App\Http\Requests\Ingredients\IngredientStockOut;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIngredientStockOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id'  => ['required', 'integer', 'exists:warehouses,id'],
            'stock_out_date' => ['required', 'date'],
            'purpose'       => ['required', Rule::in(['production_use', 'kitchen_use', 'sample', 'distribution', 'other'])],
            'remarks'       => ['nullable', 'string', 'max:2000'],

            'items'                       => ['required', 'array', 'min:1'],
            'items.*.ingredient_id'       => ['required', 'integer', 'exists:ingredients,id'],
            'items.*.ingredient_batch_id' => ['nullable', 'integer', 'exists:ingredient_batches,id'],
            'items.*.quantity'            => ['required', 'numeric', 'min:0.0001'],
        ];
    }
}
