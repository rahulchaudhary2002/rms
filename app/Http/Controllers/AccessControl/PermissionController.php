<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\Permission\StorePermissionRequest;
use App\Http\Requests\AccessControl\Permission\UpdatePermissionRequest;
use App\Models\Permission;
use App\Services\PermissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    use ExtractsFilters;

    public function __construct(private PermissionService $permissionService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'module', 'action', 'level', 'is_active', 'per_page']);

        return Inertia::render('access-control/permissions/index',
            $this->permissionService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('access-control/permissions/create');
    }

    public function store(StorePermissionRequest $request): RedirectResponse
    {
        $this->permissionService->createPermission($request->validated());

        return redirect()->route('access-control.permissions.index')
            ->with('success', 'Permission created successfully.');
    }

    public function edit(Permission $permission): Response
    {
        return Inertia::render('access-control/permissions/edit', [
            'permission' => $permission,
        ]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        $this->permissionService->updatePermission($permission, $request->validated());

        return redirect()->route('access-control.permissions.index')
            ->with('success', 'Permission updated successfully.');
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        $this->permissionService->deletePermission($permission);

        return redirect()->route('access-control.permissions.index')
            ->with('success', 'Permission deleted successfully.');
    }
}
