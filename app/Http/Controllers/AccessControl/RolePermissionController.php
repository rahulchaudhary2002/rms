<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\RolePermission\DestroyRolePermissionRequest;
use App\Http\Requests\AccessControl\RolePermission\StoreRolePermissionRequest;
use App\Models\Role;
use App\Services\RoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RolePermissionController extends Controller
{
    use ExtractsFilters;

    public function __construct(private RoleService $roleService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'level', 'per_page']);

        return Inertia::render('access-control/role-permissions/index',
            $this->roleService->getRolePermissionsIndexData($request->user(), $filters));
    }

    public function store(StoreRolePermissionRequest $request): RedirectResponse
    {
        $this->roleService->assignPermissionsToRole(
            $request->user(),
            Role::findOrFail($request->role_id),
            $request->permission_ids,
        );

        return back()->with('success', 'Permissions assigned successfully.');
    }

    public function destroy(DestroyRolePermissionRequest $request): RedirectResponse
    {
        $this->roleService->removePermissionFromRole(
            $request->user(),
            Role::findOrFail($request->role_id),
            (int) $request->permission_id,
        );

        return back()->with('success', 'Permission removed from role.');
    }
}
