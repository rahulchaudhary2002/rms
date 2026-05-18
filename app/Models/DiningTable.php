<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiningTable extends Model
{
    protected $fillable = [
        'outlet_id',
        'dining_area_id',
        'name',
        'code',
        'capacity',
        'status',
        'position_x',
        'position_y',
        'width',
        'height',
        'rotation',
        'shape',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'capacity'   => 'integer',
            'position_x' => 'float',
            'position_y' => 'float',
            'width'      => 'float',
            'height'     => 'float',
            'rotation'   => 'integer',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function diningArea(): BelongsTo
    {
        return $this->belongsTo(DiningArea::class);
    }
}
