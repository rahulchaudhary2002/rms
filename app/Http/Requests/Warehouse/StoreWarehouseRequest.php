<?php

namespace App\Http\Requests\Warehouse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outlet_id' => ['required', 'integer', 'exists:outlets,id'],
            'name'      => [
                'required',
                'string',
                'max:255',
                Rule::unique('warehouses', 'name')->where('outlet_id', $this->integer('outlet_id')),
            ],
        ];
    }
}
