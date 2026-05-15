<?php

namespace App\Http\Requests\Outlets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $department = $this->route('outletDepartment');
        $outletId   = $this->input('outlet_id', $department?->outlet_id);

        return [
            'outlet_id'   => ['required', 'exists:outlets,id'],
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['nullable', 'string', 'max:80', Rule::unique('outlet_departments', 'code')->where('outlet_id', $outletId)->ignore($department?->id)],
            'type'        => ['required', Rule::in(['kitchen', 'bar', 'counter', 'store', 'bakery', 'housekeeping', 'other'])],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
        ];
    }
}
