<?php

namespace App\Http\Requests\Food\ComboItem;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFoodComboItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'combo_food_variant_id' => ['nullable', 'integer', Rule::exists('food_variants', 'id')],
            'food_id'               => ['required', 'integer', Rule::exists('foods', 'id')],
            'food_variant_id'       => ['nullable', 'integer', Rule::exists('food_variants', 'id')],
            'quantity'              => ['nullable', 'integer', 'min:1'],
        ];
    }
}
