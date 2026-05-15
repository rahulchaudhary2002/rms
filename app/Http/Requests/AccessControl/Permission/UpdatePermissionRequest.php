<?php

namespace App\Http\Requests\AccessControl\Permission;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $permissionId = $this->route('permission')?->id ?? $this->route('permission');

        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['required', 'string', 'max:255', Rule::unique('permissions', 'slug')->ignore($permissionId), 'regex:/^[a-z0-9\-\.]+$/'],
            'module'      => ['required', 'string', 'max:255'],
            'action'      => ['required', 'string', 'max:255'],
            'level'       => ['required', 'in:global,central_warehouse,outlet,outlet_warehouse,outlet_department,department_warehouse'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
        ];
    }
}
