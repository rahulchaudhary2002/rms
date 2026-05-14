<?php

namespace App\Http\Requests\AccessControl\RolePermission;

use Illuminate\Foundation\Http\FormRequest;

class DestroyRolePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role_id'       => ['required', 'integer', 'exists:roles,id'],
            'permission_id' => ['required', 'integer', 'exists:permissions,id'],
        ];
    }
}
