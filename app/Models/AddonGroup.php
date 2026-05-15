<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AddonGroup extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'is_required',
        'min_select',
        'max_select',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'min_select'  => 'integer',
            'max_select'  => 'integer',
            'is_active'   => 'boolean',
            'sort_order'  => 'integer',
        ];
    }

    public function addons(): HasMany
    {
        return $this->hasMany(Addon::class)->orderBy('sort_order');
    }

    public function foods(): BelongsToMany
    {
        return $this->belongsToMany(Food::class, 'food_addon_groups');
    }
}
