<?php

namespace App\Http\Requests\AccessControl\Role;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'slug'          => ['required', 'string', 'max:255', 'unique:roles,slug', 'regex:/^[a-z0-9\-]+$/'],
            'level'         => ['required', 'in:global,outlet,warehouse'],
            'rank'          => ['required', 'integer', 'min:1', 'max:999'],
            'is_assignable' => ['boolean'],
            'description'   => ['nullable', 'string'],
            'is_active'     => ['boolean'],
        ];
    }
}
