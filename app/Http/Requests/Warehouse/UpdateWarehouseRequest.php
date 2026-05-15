<?php

namespace App\Http\Requests\Warehouse;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $warehouseId = $this->route('warehouse')?->id;

        return [
            'outlet_id'            => ['nullable', 'integer', 'exists:outlets,id'],
            'outlet_department_id' => ['nullable', 'integer', 'exists:outlet_departments,id'],
            'name'                 => ['required', 'string', 'max:255'],
            'code'                 => ['required', 'string', 'max:80', Rule::unique('warehouses', 'code')->ignore($warehouseId)],
            'type'                 => ['required', Rule::in(['central', 'outlet', 'department'])],
            'address'              => ['nullable', 'string', 'max:1000'],
            'is_default'           => ['boolean'],
            'is_active'            => ['boolean'],
        ];
    }
}
