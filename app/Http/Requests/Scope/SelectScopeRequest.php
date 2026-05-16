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
            'scope_type'    => ['required', 'string', 'in:global,central_warehouse,outlet,outlet_warehouse,outlet_department,department_warehouse'],
            'outlet_id'     => ['nullable', 'integer'],
            'department_id' => ['nullable', 'integer'],
            'warehouse_id'  => ['nullable', 'integer'],
            'redirect_to'   => ['nullable', 'string'],
        ];
    }
}
