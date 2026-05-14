<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerOutlet extends Model
{
    protected $fillable = [
        'customer_id',
        'outlet_id',
        'first_visited_at',
        'last_visited_at',
        'visit_count',
        'is_favorite_outlet',
    ];

    protected function casts(): array
    {
        return [
            'first_visited_at'   => 'datetime',
            'last_visited_at'    => 'datetime',
            'is_favorite_outlet' => 'boolean',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
