<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'code'           => ['nullable', 'string', 'max:50', 'unique:suppliers,code'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:50'],
            'email'          => ['nullable', 'email', 'max:255'],
            'pan_vat_no'     => ['nullable', 'string', 'max:50'],
            'address'        => ['nullable', 'string'],
            'is_active'      => ['boolean'],
        ];
    }
}
