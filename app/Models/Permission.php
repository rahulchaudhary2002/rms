<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Permission extends Model
{
    use HasSlug;

    protected $fillable = [
        'name',
        'slug',
        'module',
        'action',
        'level',
        'description',
        'is_system',
        'is_active',
    ];

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('name')
            ->saveSlugsTo('slug')
            ->slugsShouldBeNoLongerThan(255)
            ->usingSeparator('-')
            ->doNotGenerateSlugsOnUpdate();
    }

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions')
            ->withTimestamps();
    }

    public function rolePermissions(): HasMany
    {
        return $this->hasMany(RolePermission::class);
    }

    public function userOverrides(): HasMany
    {
        return $this->hasMany(UserPermissionOverride::class);
    }

    public function userResourcePermissions(): HasMany
    {
        return $this->hasMany(UserResourcePermission::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
