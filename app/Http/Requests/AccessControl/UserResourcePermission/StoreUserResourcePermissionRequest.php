<?php

namespace App\Http\Requests\AccessControl\UserResourcePermission;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserResourcePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id'       => ['required', 'integer', 'exists:users,id'],
            'permission_id' => ['required', 'integer', 'exists:permissions,id'],
            'resource_type' => ['required', 'string', 'max:255'],
            'resource_id'   => ['required', 'integer', 'min:1'],
            'effect'        => ['required', 'in:allow,deny'],
            'reason'        => ['nullable', 'string', 'max:1000'],
            'is_active'     => ['boolean'],
        ];
    }
}
