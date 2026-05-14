<?php

namespace App\Http\Requests\Ingredients\IngredientCategory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIngredientCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('ingredientCategory')?->id;

        return [
            'name'      => ['required', 'string', 'max:255'],
            'slug'      => ['nullable', 'string', 'max:255', Rule::unique('ingredient_categories', 'slug')->ignore($categoryId)],
            'code'      => ['nullable', 'string', 'max:50', Rule::unique('ingredient_categories', 'code')->ignore($categoryId)],
            'parent_id' => ['nullable', 'exists:ingredient_categories,id', Rule::notIn([$categoryId])],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'parent_id.not_in' => 'A category cannot be its own parent.',
        ];
    }
}
