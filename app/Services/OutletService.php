<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\User;

class OutletService
{
    public function __construct(private AccessControlService $accessControl) {}

    public function createOutlet(User $actor, array $data): Outlet
    {
        if (! $this->accessControl->isSuperAdmin($actor) && ! $this->accessControl->userHasPermission($actor, 'outlets-create')) {
            abort(403, 'You do not have permission to create outlets.');
        }

        return Outlet::create(['name' => $data['name']]);
    }
}
