<?php

namespace App\Http\Requests\AccessControl;

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
            'user_id'       => ['required', 'integer', 'exists:users,id'],
            'permission_id' => ['required', 'integer', 'exists:permissions,id'],
            'scope_type'    => ['required', 'in:global,outlet,warehouse'],
            'scope_id'      => ['nullable', 'integer', 'required_unless:scope_type,global'],
            'effect'        => ['required', 'in:allow,deny'],
            'reason'        => ['nullable', 'string', 'max:1000'],
            'is_active'     => ['boolean'],
        ];
    }
}
