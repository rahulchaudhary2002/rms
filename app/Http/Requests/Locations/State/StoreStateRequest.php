<?php

namespace App\Http\Requests\Locations\State;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'country_id' => ['required', 'integer', Rule::exists('countries', 'id')->whereNull('deleted_at')],
            'name'       => [
                'required',
                'string',
                'max:100',
                Rule::unique('states')
                    ->where(fn ($q) => $q->where('country_id', $this->input('country_id')))
                    ->whereNull('deleted_at'),
            ],
            'code'       => ['nullable', 'string', 'max:20'],
            'is_active'  => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A state with this name already exists in the selected country.',
        ];
    }
}
