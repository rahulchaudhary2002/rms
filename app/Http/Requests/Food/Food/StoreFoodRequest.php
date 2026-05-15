<?php

namespace App\Http\Requests\Food\Food;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'food_category_id'  => ['nullable', 'integer', Rule::exists('food_categories', 'id')->whereNull('deleted_at')],
            'name'              => ['required', 'string', 'max:255'],
            'slug'              => ['nullable', 'string', 'max:255', Rule::unique('foods', 'slug')],
            'sku'               => ['nullable', 'string', 'max:100', Rule::unique('foods', 'sku')],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description'       => ['nullable', 'string'],
            'food_type'         => ['nullable', Rule::in(['veg', 'non_veg', 'egg', 'vegan'])],
            'item_type'         => ['required', Rule::in(['food', 'beverage', 'combo'])],
            'base_price'        => ['nullable', 'numeric', 'min:0'],
            'has_variants'      => ['nullable', 'boolean'],
            'has_addons'        => ['nullable', 'boolean'],
            'is_recipe_enabled' => ['nullable', 'boolean'],
            'is_taxable'        => ['nullable', 'boolean'],
            'is_discountable'   => ['nullable', 'boolean'],
            'is_featured'       => ['nullable', 'boolean'],
            'is_active'         => ['nullable', 'boolean'],
            'preparation_time'  => ['nullable', 'integer', 'min:0'],
            'sort_order'        => ['nullable', 'integer', 'min:0'],
        ];
    }
}
