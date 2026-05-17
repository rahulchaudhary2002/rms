<?php

namespace App\Http\Requests\Ingredients\IngredientStockCount;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIngredientStockCountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'count_date'   => ['nullable', 'date'],
            'remarks'      => ['nullable', 'string', 'max:2000'],

            'items'                       => ['required', 'array', 'min:1'],
            'items.*.id'                  => ['nullable', 'integer', 'exists:ingredient_stock_count_items,id'],
            'items.*.ingredient_id'       => ['nullable', 'integer', 'exists:ingredients,id'],
            'items.*.ingredient_batch_id' => ['nullable', 'integer', 'exists:ingredient_batches,id'],
            'items.*.counted_quantity'    => ['nullable', 'numeric', 'min:0'],
            'items.*.remarks'             => ['nullable', 'string', 'max:1000'],
        ];
    }
}
