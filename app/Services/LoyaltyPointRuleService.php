<?php

namespace App\Services;

use App\Models\LoyaltyPointRule;
use App\Models\LoyaltyPointRuleSlab;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoyaltyPointRuleService
{
    use PaginatesQuery;

    public function list(array $filters, array $scope): array
    {
        $scopeOutletId = $this->outletIdFromScope($scope);

        $query = LoyaltyPointRule::with('outlet:id,name')
            ->withCount('slabs')
            ->when($scopeOutletId !== null, function ($b) use ($scopeOutletId) {
                $b->where(function ($q) use ($scopeOutletId) {
                    $q->where(fn ($q2) => $q2->where('type', 'global')->whereNull('outlet_id'))
                      ->orWhere('outlet_id', $scopeOutletId);
                });
            })
            ->when($filters['search'] !== '', fn ($b) => $b->where('name', 'like', '%'.$filters['search'].'%'))
            ->when($filters['type'] !== '', fn ($b) => $b->where('type', $filters['type']))
            ->when($filters['earning_type'] !== '', fn ($b) => $b->where('earning_type', $filters['earning_type']))
            ->when($filters['outlet_id'] !== '', fn ($b) => $b->where('outlet_id', $filters['outlet_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('priority')
            ->orderByDesc('created_at');

        $rules = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('rules', 'filters');
    }

    private function outletIdFromScope(array $scope): ?int
    {
        if ($scope['type'] === 'outlet') {
            return $scope['outlet_id'] !== null ? (int) $scope['outlet_id'] : null;
        }

        if ($scope['type'] === 'warehouse') {
            return $scope['outlet_id'] !== null ? (int) $scope['outlet_id'] : null;
        }

        return null;
    }

    public function find(int $id): LoyaltyPointRule
    {
        return LoyaltyPointRule::with(['outlet:id,name', 'slabs'])->findOrFail($id);
    }

    public function create(array $data): LoyaltyPointRule
    {
        $this->validateRuleConflict($data);

        if ($data['earning_type'] === 'fixed_slab' && ! empty($data['slabs'])) {
            $this->validateSlabs($data['slabs']);
        }

        return DB::transaction(function () use ($data) {
            $rule = LoyaltyPointRule::create([
                'outlet_id'              => $data['outlet_id'] ?? null,
                'name'                   => $data['name'],
                'type'                   => $data['type'],
                'earning_type'           => $data['earning_type'],
                'earn_amount'            => $data['earning_type'] === 'fixed_rate' ? $data['earn_amount'] : null,
                'earn_points'            => $data['earning_type'] === 'fixed_rate' ? $data['earn_points'] : null,
                'redeem_point_value'     => $data['redeem_point_value'],
                'minimum_redeem_points'  => $data['minimum_redeem_points'] ?? 0,
                'maximum_redeem_points'  => $data['maximum_redeem_points'] ?? null,
                'maximum_redeem_percent' => $data['maximum_redeem_percent'] ?? null,
                'points_expiry_days'     => $data['points_expiry_days'] ?? null,
                'starts_at'              => $data['starts_at'] ?? null,
                'ends_at'                => $data['ends_at'] ?? null,
                'is_active'              => $data['is_active'] ?? true,
                'priority'               => $data['priority'],
            ]);

            if ($rule->earning_type === 'fixed_slab' && ! empty($data['slabs'])) {
                $this->syncSlabs($rule, $data['slabs']);
            }

            return $rule;
        });
    }

    public function update(LoyaltyPointRule $rule, array $data): void
    {
        $this->validateRuleConflict($data, $rule);

        if ($data['earning_type'] === 'fixed_slab' && ! empty($data['slabs'])) {
            $this->validateSlabs($data['slabs']);
        }

        DB::transaction(function () use ($rule, $data) {
            $rule->update([
                'outlet_id'              => $data['outlet_id'] ?? null,
                'name'                   => $data['name'],
                'type'                   => $data['type'],
                'earning_type'           => $data['earning_type'],
                'earn_amount'            => $data['earning_type'] === 'fixed_rate' ? $data['earn_amount'] : null,
                'earn_points'            => $data['earning_type'] === 'fixed_rate' ? $data['earn_points'] : null,
                'redeem_point_value'     => $data['redeem_point_value'],
                'minimum_redeem_points'  => $data['minimum_redeem_points'] ?? 0,
                'maximum_redeem_points'  => $data['maximum_redeem_points'] ?? null,
                'maximum_redeem_percent' => $data['maximum_redeem_percent'] ?? null,
                'points_expiry_days'     => $data['points_expiry_days'] ?? null,
                'starts_at'              => $data['starts_at'] ?? null,
                'ends_at'                => $data['ends_at'] ?? null,
                'is_active'              => $data['is_active'] ?? true,
                'priority'               => $data['priority'],
            ]);

            if ($rule->earning_type === 'fixed_slab') {
                $this->syncSlabs($rule, $data['slabs'] ?? []);
            } else {
                $rule->slabs()->delete();
            }
        });
    }

    public function delete(LoyaltyPointRule $rule): void
    {
        $rule->delete();
    }

    public function toggleStatus(LoyaltyPointRule $rule): void
    {
        $activating = ! $rule->is_active;

        if ($activating) {
            $this->validateRuleConflict($rule->toArray(), $rule);
        }

        $rule->update(['is_active' => $activating]);
    }

    public function validateRuleConflict(array $data, ?LoyaltyPointRule $ignoreRule = null): void
    {
        $isActive = isset($data['is_active']) ? (bool) $data['is_active'] : true;

        if (! $isActive) {
            return;
        }

        $type = $data['type'];

        if ($type === 'global') {
            $exists = LoyaltyPointRule::where('type', 'global')
                ->where('is_active', true)
                ->whereNull('outlet_id')
                ->when($ignoreRule, fn ($q) => $q->where('id', '!=', $ignoreRule->id))
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'type' => 'Only one active global loyalty point rule is allowed.',
                ]);
            }
        }

        if ($type === 'outlet') {
            $outletId = $data['outlet_id'] ?? null;

            $exists = LoyaltyPointRule::where('type', 'outlet')
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->when($ignoreRule, fn ($q) => $q->where('id', '!=', $ignoreRule->id))
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'outlet_id' => 'Only one active loyalty point rule is allowed for this outlet.',
                ]);
            }
        }
    }

    public function syncSlabs(LoyaltyPointRule $rule, array $slabs): void
    {
        $rule->slabs()->delete();

        foreach ($slabs as $slab) {
            LoyaltyPointRuleSlab::create([
                'loyalty_point_rule_id' => $rule->id,
                'min_amount'            => $slab['min_amount'],
                'max_amount'            => $slab['max_amount'] ?? null,
                'points'                => $slab['points'],
                'sort_order'            => $slab['sort_order'] ?? 0,
                'is_active'             => $slab['is_active'] ?? true,
            ]);
        }
    }

    public function getApplicableRule(?int $outletId = null, ?string $date = null): ?LoyaltyPointRule
    {
        $date = $date ?? now()->toDateString();

        $campaign = LoyaltyPointRule::with('slabs')
            ->where('type', 'campaign')
            ->where('is_active', true)
            ->where('starts_at', '<=', $date)
            ->where('ends_at', '>=', $date)
            ->where(function ($q) use ($outletId) {
                $q->whereNull('outlet_id')
                  ->orWhere('outlet_id', $outletId);
            })
            ->orderBy('priority')
            ->orderByDesc('created_at')
            ->first();

        if ($campaign) {
            return $campaign;
        }

        if ($outletId !== null) {
            $outletRule = LoyaltyPointRule::with('slabs')
                ->where('type', 'outlet')
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->first();

            if ($outletRule) {
                return $outletRule;
            }
        }

        return LoyaltyPointRule::with('slabs')
            ->where('type', 'global')
            ->whereNull('outlet_id')
            ->where('is_active', true)
            ->first();
    }

    public function calculateEarnedPoints(LoyaltyPointRule $rule, float $amount): int
    {
        if ($rule->earning_type === 'fixed_rate') {
            if (! $rule->earn_amount || $rule->earn_amount <= 0) {
                return 0;
            }

            return (int) floor($amount / (float) $rule->earn_amount) * (int) $rule->earn_points;
        }

        $slab = $rule->slabs
            ->where('is_active', true)
            ->first(function (LoyaltyPointRuleSlab $slab) use ($amount) {
                $aboveMin = (float) $slab->min_amount <= $amount;
                $belowMax = $slab->max_amount === null || (float) $slab->max_amount >= $amount;

                return $aboveMin && $belowMax;
            });

        return $slab ? (int) $slab->points : 0;
    }

    private function validateSlabs(array $slabs): void
    {
        $active = array_values(array_filter($slabs, fn ($s) => ($s['is_active'] ?? true) !== false));

        for ($i = 0; $i < count($active); $i++) {
            for ($j = $i + 1; $j < count($active); $j++) {
                $a    = $active[$i];
                $b    = $active[$j];
                $maxA = isset($a['max_amount']) && $a['max_amount'] !== null ? (float) $a['max_amount'] : PHP_FLOAT_MAX;
                $maxB = isset($b['max_amount']) && $b['max_amount'] !== null ? (float) $b['max_amount'] : PHP_FLOAT_MAX;
                $minA = (float) $a['min_amount'];
                $minB = (float) $b['min_amount'];

                if ($minA < $maxB && $minB < $maxA) {
                    throw ValidationException::withMessages([
                        'slabs' => 'Slabs must not overlap. Check the min/max amount ranges.',
                    ]);
                }
            }
        }
    }
}
