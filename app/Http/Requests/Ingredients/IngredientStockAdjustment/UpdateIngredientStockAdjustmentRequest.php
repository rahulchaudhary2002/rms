<?php

namespace App\Http\Requests\Ingredients\IngredientStockAdjustment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIngredientStockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id'    => ['required', 'integer', 'exists:warehouses,id'],
            'adjustment_date' => ['required', 'date'],
            'reason'          => ['nullable', 'string', 'max:2000'],

            'items'                          => ['required', 'array', 'min:1'],
            'items.*.ingredient_id'          => ['required', 'integer', 'exists:ingredients,id'],
            'items.*.ingredient_batch_id'    => ['nullable', 'integer', 'exists:ingredient_batches,id'],
            'items.*.actual_quantity'        => ['required', 'numeric', 'min:0'],
            'items.*.remarks'                => ['nullable', 'string', 'max:1000'],
        ];
    }
}
