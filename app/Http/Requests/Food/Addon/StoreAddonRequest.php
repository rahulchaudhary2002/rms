<?php

namespace App\Http\Requests\Food\Addon;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddonRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $group = $this->route('addon_group');

        if ($group && ! $this->input('addon_group_id')) {
            $this->merge([
                'addon_group_id' => is_object($group) && method_exists($group, 'getKey') ? $group->getKey() : $group,
            ]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'addon_group_id'    => ['required', 'integer', 'exists:addon_groups,id'],
            'name'              => ['required', 'string', 'max:255'],
            'price'             => ['nullable', 'numeric', 'min:0'],
            'is_recipe_enabled' => ['nullable', 'boolean'],
            'is_active'         => ['nullable', 'boolean'],
            'sort_order'        => ['nullable', 'integer', 'min:0'],
        ];
    }
}
