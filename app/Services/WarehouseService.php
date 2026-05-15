<?php

namespace App\Services;

use App\Models\User;
use App\Models\Warehouse;

class WarehouseService
{
    public function __construct(private AccessControlService $accessControl) {}

    public function createWarehouse(User $actor, array $data): Warehouse
    {
        if (! $this->accessControl->isSuperAdmin($actor) && ! $this->accessControl->userHasPermission($actor, 'warehouses-create')) {
            abort(403, 'You do not have permission to create warehouses.');
        }

        if (! $this->accessControl->hasGlobalScopeRole($actor)) {
            $allowedScopes = $this->accessControl->resolveAllowedScopes($actor);

            if ($allowedScopes !== null && ! in_array((int) $data['outlet_id'], $allowedScopes['outlet'], true)) {
                abort(403, 'You cannot create a warehouse in this outlet.');
            }
        }

        return Warehouse::create([
            'outlet_id' => $data['outlet_id'],
            'name'      => $data['name'],
        ]);
    }
}
