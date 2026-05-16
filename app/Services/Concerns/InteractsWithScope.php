<?php

namespace App\Services\Concerns;

use App\Models\User;
use App\Services\AccessControlService;
use Illuminate\Support\Facades\DB;

/**
 * @property-read AccessControlService $accessControl
 */
trait InteractsWithScope
{
    protected function resolveScopeProps(User $actor, ?array $sessionScope = null): array
    {
        if ($sessionScope !== null) {
            return $this->accessControl->resolveSessionConstrainedScopeProps($actor, $sessionScope);
        }

        return [
            'allowedScopes'     => $this->accessControl->resolveAllowedScopes($actor),
            'allowedScopeTypes' => $this->accessControl->resolveAllowedScopeTypes($actor),
            'scopeTypes'        => $this->accessControl->getScopeTypesConfig(),
        ];
    }

    protected function resolveResourceProps(User $actor, ?array $actorAssignedScopes = null): array
    {
        return [
            'allowedResourceIds' => $actorAssignedScopes ?? $this->accessControl->getActorAssignedScopeIds($actor),
            'resourceTypes'      => $this->accessControl->getResourceTypesConfig(),
        ];
    }

    protected function buildCurrentScope(array $scope): array
    {
        return [
            'type'                 => $scope['type'],
            'outlet_id'            => $scope['outlet_id'] ? (string) $scope['outlet_id'] : '',
            'outlet_department_id' => $scope['department_id'] ? (string) $scope['department_id'] : '',
            'warehouse_id'         => $scope['warehouse_id'] ? (string) $scope['warehouse_id'] : '',
        ];
    }

    protected function resolveSessionConstrainedResourceIds(?array $actorAssignedScopes, array $scope): ?array
    {
        if ($scope['type'] === 'outlet') {
            $outletId     = (int) $scope['outlet_id'];
            $warehouseIds = DB::table('warehouses')
                ->where('outlet_id', $outletId)->pluck('id')->map(fn ($id) => (int) $id)->toArray();

            if ($actorAssignedScopes === null) {
                return ['outlet_ids' => [$outletId], 'warehouse_ids' => $warehouseIds];
            }

            return [
                'outlet_ids'    => in_array($outletId, $actorAssignedScopes['outlet_ids'], true) ? [$outletId] : [],
                'warehouse_ids' => array_values(array_intersect($warehouseIds, $actorAssignedScopes['warehouse_ids'])),
            ];
        }

        if ($scope['type'] === 'outlet_warehouse') {
            $warehouseId = (int) $scope['warehouse_id'];

            return [
                'outlet_ids'    => [],
                'warehouse_ids' => $actorAssignedScopes === null || in_array($warehouseId, $actorAssignedScopes['warehouse_ids'], true)
                    ? [$warehouseId] : [],
            ];
        }

        if ($scope['type'] === 'outlet_department') {
            $deptId       = (int) $scope['department_id'];
            $warehouseIds = DB::table('warehouses')
                ->where('outlet_department_id', $deptId)->pluck('id')->map(fn ($id) => (int) $id)->toArray();

            if ($actorAssignedScopes === null) {
                return ['outlet_ids' => [], 'warehouse_ids' => $warehouseIds];
            }

            return [
                'outlet_ids'    => [],
                'warehouse_ids' => array_values(array_intersect($warehouseIds, $actorAssignedScopes['warehouse_ids'])),
            ];
        }

        if ($scope['type'] === 'department_warehouse' || $scope['type'] === 'central_warehouse') {
            $warehouseId = (int) $scope['warehouse_id'];

            return [
                'outlet_ids'    => [],
                'warehouse_ids' => $actorAssignedScopes === null || in_array($warehouseId, $actorAssignedScopes['warehouse_ids'], true)
                    ? [$warehouseId] : [],
            ];
        }

        return $actorAssignedScopes;
    }
}
