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

        return Warehouse::create([
            'outlet_id' => $data['outlet_id'],
            'name'      => $data['name'],
        ]);
    }
}
