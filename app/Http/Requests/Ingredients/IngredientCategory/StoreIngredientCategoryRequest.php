<?php

namespace App\Http\Requests\Ingredients\IngredientCategory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIngredientCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'slug'      => ['nullable', 'string', 'max:255', Rule::unique('ingredient_categories', 'slug')],
            'code'      => ['nullable', 'string', 'max:50', Rule::unique('ingredient_categories', 'code')],
            'parent_id' => ['nullable', 'exists:ingredient_categories,id'],
            'is_active' => ['boolean'],
        ];
    }
}
