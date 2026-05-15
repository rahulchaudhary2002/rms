<?php

namespace App\Http\Requests\Food\Variant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFoodVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('food_variant')?->id;

        return [
            'name'       => ['required', 'string', 'max:255'],
            'sku'        => ['nullable', 'string', 'max:100', Rule::unique('food_variants', 'sku')->ignore($id)],
            'price'      => ['nullable', 'numeric', 'min:0'],
            'is_default' => ['nullable', 'boolean'],
            'is_active'  => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
