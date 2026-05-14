<?php

namespace App\Services\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Shared pagination helper for service classes.
 */
trait PaginatesQuery
{
    protected function perPage(Builder $query, string $perPage): int
    {
        return $perPage === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($perPage ?: 10), 1);
    }
}
