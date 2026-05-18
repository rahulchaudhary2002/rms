<?php

namespace App\Http\Requests\DiningTables;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiningTableRequest extends FormRequest
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
            'name'           => [
                'required',
                'string',
                'max:255',
                Rule::unique('dining_tables')->where(fn ($q) => $q
                    ->where('outlet_id', $this->input('outlet_id'))
                    ->where('dining_area_id', $this->input('dining_area_id'))),
            ],
            'code'           => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('dining_tables')->where(fn ($q) => $q
                    ->where('outlet_id', $this->input('outlet_id'))
                    ->where('dining_area_id', $this->input('dining_area_id'))),
            ],
            'capacity'       => ['required', 'integer', 'min:1'],
            'status'         => ['required', Rule::in(['available', 'occupied', 'reserved', 'cleaning', 'inactive'])],
            'position_x'     => ['numeric', 'min:0'],
            'position_y'     => ['numeric', 'min:0'],
            'width'          => ['numeric', 'min:20'],
            'height'         => ['numeric', 'min:20'],
            'rotation'       => ['integer', 'min:0', 'max:360'],
            'shape'          => ['required', Rule::in(['rectangle', 'square', 'circle', 'oval'])],
            'sort_order'     => ['integer', 'min:0'],
            'is_active'      => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'dining_area_id.exists' => 'The selected dining area does not belong to the selected outlet.',
            'name.unique'           => 'A table with this name already exists in the selected dining area.',
            'code.unique'           => 'A table with this code already exists in the selected dining area.',
        ];
    }
}
