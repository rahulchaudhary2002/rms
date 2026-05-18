<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiningArea extends Model
{
    protected $fillable = [
        'outlet_id',
        'name',
        'code',
        'description',
        'layout_width',
        'layout_height',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'layout_width'  => 'float',
            'layout_height' => 'float',
            'sort_order'    => 'integer',
            'is_active'     => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function diningTables(): HasMany
    {
        return $this->hasMany(DiningTable::class);
    }
}
