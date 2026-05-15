<?php

namespace App\Http\Requests\Outlets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $outletId = $this->input('outlet_id');

        return [
            'outlet_id'   => ['required', 'exists:outlets,id'],
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['nullable', 'string', 'max:80', Rule::unique('outlet_departments', 'code')->where('outlet_id', $outletId)],
            'type'        => ['required', Rule::in(['kitchen', 'bar', 'counter', 'store', 'bakery', 'housekeeping', 'other'])],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
        ];
    }
}
