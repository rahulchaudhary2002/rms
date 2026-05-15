<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyPointRuleSlab extends Model
{
    protected $fillable = [
        'loyalty_point_rule_id',
        'min_amount',
        'max_amount',
        'points',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
            'is_active'  => 'boolean',
        ];
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(LoyaltyPointRule::class, 'loyalty_point_rule_id');
    }
}
