<?php

namespace App\Http\Requests\Units\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:255'],
            'short_name' => [
                'required',
                'string',
                'max:20',
                Rule::unique('units')->where(fn ($q) => $q->where('type', $this->input('type'))),
            ],
            'type'      => ['required', 'in:weight,volume,quantity,custom'],
            'is_base'   => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'short_name.unique' => 'This short name is already used for the selected unit type.',
        ];
    }
}
