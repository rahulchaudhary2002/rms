<?php

namespace App\Http\Requests\Customers\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'    => ['required', 'string', 'max:255'],
            'phone'   => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('customers', 'phone')->ignore($this->route('customer')),
            ],
            'email'   => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers', 'email')->ignore($this->route('customer')),
            ],
            'address'   => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
