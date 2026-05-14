<?php

namespace App\Http\Requests\Locations\Country;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:100', Rule::unique('countries')->whereNull('deleted_at')],
            'code'      => ['nullable', 'string', 'max:10', Rule::unique('countries')->whereNull('deleted_at')],
            'is_active' => ['boolean'],
        ];
    }
}
