<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'level',
        'rank',
        'description',
        'is_system',
        'is_active',
        'is_assignable',
    ];

    protected function casts(): array
    {
        return [
            'rank'          => 'integer',
            'is_system'     => 'boolean',
            'is_assignable' => 'boolean',
            'is_active'     => 'boolean',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->slug === 'super-admin';
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')
            ->withTimestamps();
    }

    public function rolePermissions(): HasMany
    {
        return $this->hasMany(RolePermission::class);
    }

    public function userRoleAssignments(): HasMany
    {
        return $this->hasMany(UserRoleAssignment::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_role_assignments')
            ->withPivot(['scope_type', 'outlet_id', 'outlet_department_id', 'warehouse_id', 'is_active', 'assigned_by'])
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
