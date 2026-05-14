<?php

namespace App\Http\Requests\AccessControl\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')?->id ?? $this->route('role');

        return [
            'name'          => ['required', 'string', 'max:255'],
            'slug'          => ['required', 'string', 'max:255', Rule::unique('roles', 'slug')->ignore($roleId), 'regex:/^[a-z0-9\-]+$/'],
            'level'         => ['required', 'in:global,outlet,warehouse'],
            'rank'          => ['required', 'integer', 'min:1', 'max:999'],
            'is_assignable' => ['boolean'],
            'description'   => ['nullable', 'string'],
            'is_active'     => ['boolean'],
        ];
    }
}
