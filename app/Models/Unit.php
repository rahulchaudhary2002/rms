<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'short_name',
        'type',
        'is_base',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_base'   => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function fromConversions(): HasMany
    {
        return $this->hasMany(UnitConversion::class, 'from_unit_id');
    }

    public function toConversions(): HasMany
    {
        return $this->hasMany(UnitConversion::class, 'to_unit_id');
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(Ingredient::class, 'base_unit_id');
    }

    public function purchaseIngredients(): HasMany
    {
        return $this->hasMany(Ingredient::class, 'default_purchase_unit_id');
    }

    public function usageIngredients(): HasMany
    {
        return $this->hasMany(Ingredient::class, 'default_usage_unit_id');
    }
}
