<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodAddonGroup extends Model
{
    protected $fillable = [
        'food_id',
        'addon_group_id',
    ];

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function addonGroup(): BelongsTo
    {
        return $this->belongsTo(AddonGroup::class);
    }
}
