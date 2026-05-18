<?php

namespace App\Http\Requests\DiningTables;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outlet_id'      => ['required', 'exists:outlets,id'],
            'dining_area_id' => [
                'required',
                Rule::exists('dining_areas', 'id')->where(fn ($q) => $q->where('outlet_id', $this->input('outlet_id'))),
            ],
            'tables'               => ['required', 'array', 'min:1'],
            'tables.*.id'          => ['required', 'integer'],
            'tables.*.position_x'  => ['required', 'numeric', 'min:0'],
            'tables.*.position_y'  => ['required', 'numeric', 'min:0'],
            'tables.*.width'       => ['required', 'numeric', 'min:20'],
            'tables.*.height'      => ['required', 'numeric', 'min:20'],
            'tables.*.rotation'    => ['required', 'integer', 'min:0', 'max:360'],
        ];
    }

    public function messages(): array
    {
        return [
            'dining_area_id.exists' => 'The selected dining area does not belong to the selected outlet.',
        ];
    }
}
