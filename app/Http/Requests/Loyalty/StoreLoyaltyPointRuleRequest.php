<?php

namespace App\Http\Requests\Loyalty;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreLoyaltyPointRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:255'],
            'type'                   => ['required', 'in:global,outlet,campaign'],
            'outlet_id'              => ['nullable', 'exists:outlets,id'],
            'earning_type'           => ['required', 'in:fixed_rate,fixed_slab'],
            'earn_amount'            => ['required_if:earning_type,fixed_rate', 'nullable', 'numeric', 'min:0.01'],
            'earn_points'            => ['required_if:earning_type,fixed_rate', 'nullable', 'integer', 'min:1'],
            'redeem_point_value'     => ['required', 'numeric', 'min:0'],
            'minimum_redeem_points'  => ['nullable', 'integer', 'min:0'],
            'maximum_redeem_points'  => ['nullable', 'integer', 'min:1'],
            'maximum_redeem_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'points_expiry_days'     => ['nullable', 'integer', 'min:1'],
            'starts_at'              => ['required_if:type,campaign', 'nullable', 'date'],
            'ends_at'                => ['required_if:type,campaign', 'nullable', 'date', 'after_or_equal:starts_at'],
            'is_active'              => ['nullable', 'boolean'],
            'priority'               => ['required', 'integer', 'min:1'],
            'slabs'                  => ['required_if:earning_type,fixed_slab', 'nullable', 'array', 'min:1'],
            'slabs.*.min_amount'     => ['required', 'numeric', 'min:0'],
            'slabs.*.max_amount'     => ['nullable', 'numeric', 'gt:slabs.*.min_amount'],
            'slabs.*.points'         => ['required', 'integer', 'min:1'],
            'slabs.*.sort_order'     => ['nullable', 'integer', 'min:0'],
            'slabs.*.is_active'      => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $type        = $this->input('type');
            $earningType = $this->input('earning_type');
            $outletId    = $this->input('outlet_id');
            $maxRedeem   = $this->input('maximum_redeem_points');
            $minRedeem   = $this->input('minimum_redeem_points', 0);

            if ($type === 'global' && $outletId !== null) {
                $v->errors()->add('outlet_id', 'Outlet must be empty when rule type is global.');
            }

            if ($type === 'outlet' && empty($outletId)) {
                $v->errors()->add('outlet_id', 'Outlet is required when rule type is outlet.');
            }

            if ($earningType === 'fixed_slab' && empty($this->input('slabs'))) {
                $v->errors()->add('slabs', 'At least one slab is required for slab-based earning.');
            }

            if ($maxRedeem !== null && $minRedeem !== null && (int) $maxRedeem < (int) $minRedeem) {
                $v->errors()->add('maximum_redeem_points', 'Maximum redeem points must be greater than or equal to minimum redeem points.');
            }
        });
    }
}
