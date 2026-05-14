<?php

namespace App\Http\Requests\Locations\Country;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $countryId = $this->route('country')?->id;

        return [
            'name'      => ['required', 'string', 'max:100', Rule::unique('countries')->whereNull('deleted_at')->ignore($countryId)],
            'code'      => ['nullable', 'string', 'max:10', Rule::unique('countries')->whereNull('deleted_at')->ignore($countryId)],
            'is_active' => ['boolean'],
        ];
    }
}
