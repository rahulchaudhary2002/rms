<?php

namespace App\Http\Requests\AccessControl\UserRoleAssignment;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRoleAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id'    => ['required', 'integer', 'exists:users,id'],
            'role_id'    => ['required', 'integer', 'exists:roles,id'],
            'scope_type' => ['required', 'in:global,outlet,warehouse'],
            'scope_id'   => ['nullable', 'integer', 'required_unless:scope_type,global'],
            'is_active'  => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'scope_id.required_unless' => 'Scope ID is required when scope type is outlet or warehouse.',
        ];
    }
}
