<?php

namespace App\Http\Requests\Food\Recipe;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFoodRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'food_variant_id'  => ['nullable', 'integer', Rule::exists('food_variants', 'id')],
            'ingredient_id'    => ['required', 'integer', Rule::exists('ingredients', 'id')],
            'unit_id'          => ['required', 'integer', Rule::exists('units', 'id')],
            'quantity'         => ['required', 'numeric', 'min:0.0001'],
            'wastage_quantity' => ['nullable', 'numeric', 'min:0'],
            'is_active'        => ['nullable', 'boolean'],
        ];
    }
}
