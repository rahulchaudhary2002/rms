<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Ingredient extends Model
{
    use HasSlug, SoftDeletes;

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('name')
            ->saveSlugsTo('slug');
    }

    protected $fillable = [
        'ingredient_category_id',
        'name',
        'slug',
        'code',
        'barcode',
        'base_unit_id',
        'default_purchase_unit_id',
        'default_usage_unit_id',
        'is_perishable',
        'track_expiry',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_perishable' => 'boolean',
            'track_expiry'  => 'boolean',
            'is_active'     => 'boolean',
        ];
    }

    public function ingredientCategory(): BelongsTo
    {
        return $this->belongsTo(IngredientCategory::class, 'ingredient_category_id');
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    public function defaultPurchaseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'default_purchase_unit_id');
    }

    public function defaultUsageUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'default_usage_unit_id');
    }
}
