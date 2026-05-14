<?php

namespace App\Http\Requests\Inventory\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $unitId = $this->route('unit')?->id;

        return [
            'name'       => ['required', 'string', 'max:255'],
            'short_name' => [
                'required',
                'string',
                'max:20',
                Rule::unique('units')
                    ->where(fn ($q) => $q->where('type', $this->input('type')))
                    ->ignore($unitId),
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
