<?php

namespace App\Http\Requests\Scope;

use Illuminate\Foundation\Http\FormRequest;

class SelectScopeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scope_type'   => ['required', 'string', 'in:outlet,warehouse,global'],
            'outlet_id'    => ['nullable', 'required_if:scope_type,outlet'],
            'warehouse_id' => ['nullable', 'required_if:scope_type,warehouse'],
            'redirect_to'  => ['nullable', 'string'],
        ];
    }
}
