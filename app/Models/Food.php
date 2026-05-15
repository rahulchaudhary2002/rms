<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Food extends Model
{
    use HasSlug, SoftDeletes;

    protected $table = 'foods';

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('name')
            ->saveSlugsTo('slug');
    }

    protected $fillable = [
        'food_category_id',
        'name',
        'slug',
        'sku',
        'short_description',
        'description',
        'image',
        'food_type',
        'item_type',
        'base_price',
        'has_variants',
        'has_addons',
        'is_recipe_enabled',
        'is_taxable',
        'is_discountable',
        'is_featured',
        'is_active',
        'preparation_time',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'base_price'        => 'decimal:2',
            'has_variants'      => 'boolean',
            'has_addons'        => 'boolean',
            'is_recipe_enabled' => 'boolean',
            'is_taxable'        => 'boolean',
            'is_discountable'   => 'boolean',
            'is_featured'       => 'boolean',
            'is_active'         => 'boolean',
            'sort_order'        => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FoodCategory::class, 'food_category_id');
    }

    public function outlets(): HasMany
    {
        return $this->hasMany(FoodOutlet::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(FoodVariant::class)->orderBy('sort_order');
    }

    public function addonGroups(): BelongsToMany
    {
        return $this->belongsToMany(AddonGroup::class, 'food_addon_groups');
    }

    public function foodAddonGroups(): HasMany
    {
        return $this->hasMany(FoodAddonGroup::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(FoodRecipe::class)->whereNull('food_variant_id');
    }

    public function allRecipes(): HasMany
    {
        return $this->hasMany(FoodRecipe::class);
    }

    public function availabilitySchedules(): HasMany
    {
        return $this->hasMany(FoodAvailabilitySchedule::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(FoodImage::class)->orderBy('sort_order');
    }

    public function comboItems(): HasMany
    {
        return $this->hasMany(FoodComboItem::class, 'combo_food_id');
    }

    public function includedInCombos(): HasMany
    {
        return $this->hasMany(FoodComboItem::class, 'food_id');
    }
}
