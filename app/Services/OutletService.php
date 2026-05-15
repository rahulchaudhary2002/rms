<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\User;
use App\Services\Concerns\PaginatesQuery;

class OutletService
{
    use PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function getIndexData(array $filters): array
    {
        $query = Outlet::withCount(['departments'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $b->where('name', 'like', '%'.$filters['search'].'%');
            })
            ->orderBy('name');

        $outletList = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('outletList', 'filters');
    }

    public function getEditData(Outlet $outlet): array
    {
        return compact('outlet');
    }

    public function createOutlet(User $actor, array $data): Outlet
    {
        if (! $this->accessControl->isSuperAdmin($actor) && ! $this->accessControl->userHasPermission($actor, 'outlets-create')) {
            abort(403, 'You do not have permission to create outlets.');
        }

        return Outlet::create(['name' => $data['name']]);
    }

    public function updateOutlet(Outlet $outlet, array $data): void
    {
        $outlet->update(['name' => $data['name']]);
    }

    public function deleteOutlet(Outlet $outlet): void
    {
        abort_if(
            $outlet->departments()->exists(),
            422,
            'Cannot delete outlet while it has departments.'
        );

        $outlet->delete();
    }
}
