<?php

namespace App\Http\Requests\Locations\City;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $cityId = $this->route('city')?->id;

        return [
            'country_id' => ['required', 'integer', Rule::exists('countries', 'id')->whereNull('deleted_at')],
            'state_id'   => ['nullable', 'integer', Rule::exists('states', 'id')->whereNull('deleted_at')],
            'name'       => [
                'required',
                'string',
                'max:100',
                Rule::unique('cities')
                    ->where(fn ($q) => $q
                        ->where('country_id', $this->input('country_id'))
                        ->where('state_id', $this->input('state_id')))
                    ->whereNull('deleted_at')
                    ->ignore($cityId),
            ],
            'is_active'  => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A city with this name already exists in the selected country and state.',
        ];
    }
}
