<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoyaltyPointRule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'outlet_id',
        'name',
        'type',
        'earning_type',
        'earn_amount',
        'earn_points',
        'redeem_point_value',
        'minimum_redeem_points',
        'maximum_redeem_points',
        'maximum_redeem_percent',
        'points_expiry_days',
        'starts_at',
        'ends_at',
        'is_active',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'earn_amount'            => 'decimal:2',
            'redeem_point_value'     => 'decimal:2',
            'maximum_redeem_percent' => 'decimal:2',
            'starts_at'              => 'date',
            'ends_at'                => 'date',
            'is_active'              => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function slabs(): HasMany
    {
        return $this->hasMany(LoyaltyPointRuleSlab::class)->orderBy('sort_order')->orderBy('min_amount');
    }
}
