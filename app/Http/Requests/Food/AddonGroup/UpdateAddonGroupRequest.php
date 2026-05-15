<?php

namespace App\Http\Requests\Food\AddonGroup;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAddonGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'is_required' => ['nullable', 'boolean'],
            'min_select'  => ['nullable', 'integer', 'min:0'],
            'max_select'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['nullable', 'boolean'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $isRequired = $this->boolean('is_required');
            $minSelect  = (int) ($this->input('min_select') ?? 0);
            $maxSelect  = $this->input('max_select');

            if ($isRequired && $minSelect < 1) {
                $v->errors()->add('min_select', 'min_select must be at least 1 when the group is required.');
            }

            if ($maxSelect !== null && (int) $maxSelect < $minSelect) {
                $v->errors()->add('max_select', 'max_select must be greater than or equal to min_select.');
            }
        });
    }
}
