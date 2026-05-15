<?php

namespace App\Http\Requests\Ingredients\Ingredient;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $ingredientId = $this->route('ingredient')?->id;

        return [
            'ingredient_category_id'   => ['nullable', 'exists:ingredient_categories,id'],
            'name'                     => ['required', 'string', 'max:255'],
            'slug'                     => ['nullable', 'string', 'max:255', Rule::unique('ingredients', 'slug')->ignore($ingredientId)],
            'code'                     => ['required', 'string', 'max:80', Rule::unique('ingredients', 'code')->ignore($ingredientId)],
            'barcode'                  => ['nullable', 'string', Rule::unique('ingredients', 'barcode')->ignore($ingredientId)],
            'type'                     => ['required', Rule::in(['raw_material', 'ready_product', 'packaging', 'consumable'])],
            'base_unit_id'             => ['required', 'exists:units,id'],
            'default_purchase_unit_id' => ['nullable', 'exists:units,id'],
            'default_usage_unit_id'    => ['nullable', 'exists:units,id'],
            'minimum_stock'            => ['numeric', 'min:0'],
            'reorder_stock'            => ['numeric', 'min:0'],
            'costing_method'           => ['required', Rule::in(['fifo', 'lifo', 'weighted_average', 'moving_average', 'specific_identification'])],
            'is_perishable'            => ['boolean'],
            'track_expiry'             => ['boolean'],
            'description'              => ['nullable', 'string'],
            'is_active'                => ['boolean'],
        ];
    }
}
