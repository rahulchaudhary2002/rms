<?php

namespace App\Http\Requests\Inventory\UnitConversion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnitConversionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_unit_id' => [
                'required',
                'exists:units,id',
                'different:to_unit_id',
                Rule::unique('unit_conversions')->where(fn ($q) => $q->where('to_unit_id', $this->input('to_unit_id'))),
            ],
            'to_unit_id' => ['required', 'exists:units,id', 'different:from_unit_id'],
            'multiplier' => ['required', 'numeric', 'gt:0'],
            'is_active'  => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'from_unit_id.different' => 'The from unit and to unit cannot be the same.',
            'to_unit_id.different'   => 'The from unit and to unit cannot be the same.',
            'from_unit_id.unique'    => 'A conversion between these two units already exists.',
        ];
    }
}
