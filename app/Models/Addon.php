<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Addon extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'addon_group_id',
        'name',
        'price',
        'is_recipe_enabled',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price'             => 'decimal:2',
            'is_recipe_enabled' => 'boolean',
            'is_active'         => 'boolean',
            'sort_order'        => 'integer',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(AddonGroup::class, 'addon_group_id');
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(AddonRecipe::class);
    }
}
