<?php

namespace App\Http\Requests\AccessControl;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['required', 'string', 'max:255', 'unique:permissions,slug', 'regex:/^[a-z0-9\-\.]+$/'],
            'module'      => ['required', 'string', 'max:255'],
            'action'      => ['required', 'string', 'max:255'],
            'level'       => ['required', 'in:global,outlet,warehouse'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
        ];
    }
}
