<?php

namespace App\Http\Requests\AccessControl\UserPermissionOverride;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserPermissionOverrideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id'              => ['required', 'integer', 'exists:users,id'],
            'permission_id'        => ['required', 'integer', 'exists:permissions,id'],
            'scope_type'           => ['required', 'in:global,central_warehouse,outlet,outlet_warehouse,outlet_department,department_warehouse'],
            'outlet_id'            => ['nullable', 'integer', 'exists:outlets,id'],
            'outlet_department_id' => ['nullable', 'integer', 'exists:outlet_departments,id'],
            'warehouse_id'         => ['nullable', 'integer', 'exists:warehouses,id'],
            'effect'               => ['required', 'in:allow,deny'],
            'reason'               => ['nullable', 'string', 'max:1000'],
            'is_active'            => ['boolean'],
            'starts_at'            => ['nullable', 'date'],
            'ends_at'              => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
