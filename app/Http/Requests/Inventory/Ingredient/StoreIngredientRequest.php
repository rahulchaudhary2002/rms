<?php

namespace App\Http\Requests\Inventory\Ingredient;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ingredient_category_id'   => ['nullable', 'exists:ingredient_categories,id'],
            'name'                     => ['required', 'string', 'max:255'],
            'slug'                     => ['nullable', 'string', 'max:255', Rule::unique('ingredients', 'slug')],
            'code'                     => ['required', 'string', 'max:80', Rule::unique('ingredients', 'code')],
            'barcode'                  => ['nullable', 'string', Rule::unique('ingredients', 'barcode')],
            'base_unit_id'             => ['required', 'exists:units,id'],
            'default_purchase_unit_id' => ['nullable', 'exists:units,id'],
            'default_usage_unit_id'    => ['nullable', 'exists:units,id'],
            'is_perishable'            => ['boolean'],
            'track_expiry'             => ['boolean'],
            'description'              => ['nullable', 'string'],
            'is_active'                => ['boolean'],
        ];
    }
}
