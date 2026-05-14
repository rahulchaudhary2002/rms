<?php

namespace App\Http\Requests\Units\UnitConversion;

use App\Models\Unit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['from_unit_id', 'to_unit_id'])) {
                    return;
                }

                $from = Unit::find($this->input('from_unit_id'));
                $to   = Unit::find($this->input('to_unit_id'));

                if ($from && $to && $from->type !== $to->type) {
                    $validator->errors()->add(
                        'to_unit_id',
                        "Both units must be of the same type. '{$from->name}' is {$from->type} but '{$to->name}' is {$to->type}."
                    );
                }
            },
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
