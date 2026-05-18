<?php

namespace App\Http\Requests\DiningAreas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiningAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $diningAreaId = $this->route('diningArea')?->id;

        return [
            'outlet_id'     => ['required', 'exists:outlets,id'],
            'name'          => [
                'required',
                'string',
                'max:255',
                Rule::unique('dining_areas')
                    ->where(fn ($q) => $q->where('outlet_id', $this->input('outlet_id')))
                    ->ignore($diningAreaId),
            ],
            'code'          => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('dining_areas')
                    ->where(fn ($q) => $q->where('outlet_id', $this->input('outlet_id')))
                    ->ignore($diningAreaId),
            ],
            'description'   => ['nullable', 'string'],
            'layout_width'  => ['numeric', 'min:100'],
            'layout_height' => ['numeric', 'min:100'],
            'sort_order'    => ['integer', 'min:0'],
            'is_active'     => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A dining area with this name already exists for the selected outlet.',
            'code.unique' => 'A dining area with this code already exists for the selected outlet.',
        ];
    }
}
