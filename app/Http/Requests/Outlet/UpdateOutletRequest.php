<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOutletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $outletId = $this->route('outlet')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('outlets', 'name')->ignore($outletId)],
        ];
    }
}
