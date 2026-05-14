<?php

namespace App\Http\Requests\Scope;

use Illuminate\Foundation\Http\FormRequest;

class StoreNodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'create_outlet_id'      => ['nullable', 'integer', 'exists:outlets,id'],
            'create_outlet_name'    => ['nullable', 'required_without:create_outlet_id', 'string', 'max:255'],
            'create_warehouse_name' => ['required', 'string', 'max:255'],
            'redirect_to'           => ['nullable', 'string'],
        ];
    }
}
