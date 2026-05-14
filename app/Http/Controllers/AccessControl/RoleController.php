<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\Role\StoreRoleRequest;
use App\Http\Requests\AccessControl\Role\UpdateRoleRequest;
use App\Models\Role;
use App\Services\AccessControlService;
use App\Services\RoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AccessControlService $accessControl,
        private RoleService $roleService,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'level', 'is_active', 'per_page']);

        return Inertia::render('access-control/roles/index',
            $this->roleService->getRolesIndexData($request->user(), $filters));
    }

    public function show(Request $request, Role $role): Response
    {
        return Inertia::render('access-control/roles/show',
            $this->roleService->getRoleShowData($request->user(), $role));
    }

    public function create(): Response
    {
        return Inertia::render('access-control/roles/create');
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        Role::create($request->validated());

        return redirect($request->input('_redirect', route('access-control.roles.index')))
            ->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('access-control/roles/edit', ['role' => $role]);
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->roleService->updateRole($role, $request->validated());

        return redirect()->route('access-control.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->roleService->deleteRole($role);

        return redirect()->route('access-control.roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
