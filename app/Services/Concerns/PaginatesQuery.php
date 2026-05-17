<?php

namespace App\Services\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

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

    /**
     * Returns warehouse IDs allowed by the current scope, or null for global (no restriction).
     *
     * @param  array{type: string, warehouse_id: int|null, outlet_id: int|null, department_id: int|null} $scope
     * @return int[]|null
     */
    protected function warehouseIdsForScope(array $scope): ?array
    {
        if ($scope['warehouse_id'] !== null) {
            return [(int) $scope['warehouse_id']];
        }

        if ($scope['department_id'] !== null) {
            return DB::table('warehouses')
                ->where('outlet_department_id', $scope['department_id'])
                ->pluck('id')->map(fn ($id) => (int) $id)->all();
        }

        if ($scope['outlet_id'] !== null) {
            return DB::table('warehouses')
                ->where('outlet_id', $scope['outlet_id'])
                ->pluck('id')->map(fn ($id) => (int) $id)->all();
        }

        return null; // global — no restriction
    }

    /**
     * Returns the single warehouse ID to pre-select based on scope, or empty string.
     *
     * Only pre-selects when the scope targets one specific warehouse
     * (central_warehouse, outlet_warehouse, department_warehouse).
     *
     * @param  array{type: string, warehouse_id: int|null, outlet_id: int|null, department_id: int|null} $scope
     */
    protected function defaultWarehouseId(array $scope): string
    {
        return $scope['warehouse_id'] !== null ? (string) $scope['warehouse_id'] : '';
    }
}
