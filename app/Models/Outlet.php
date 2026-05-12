<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class Outlet extends Model
{
    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }
}
