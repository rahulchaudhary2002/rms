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
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/roles/index',
            $this->roleService->getRolesIndexData($request->user(), $filters, $scope['type']));
    }

    public function show(Request $request, Role $role): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/roles/show',
            $this->roleService->getRoleShowData($request->user(), $role, $scope['type']));
    }

    public function create(Request $request): Response
    {
        $scope        = $this->accessControl->resolveSessionScope($request);
        $levelOptions = $this->resolveLevelOptions($scope['type']);

        return Inertia::render('access-control/roles/create', compact('levelOptions'));
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $scope         = $this->accessControl->resolveSessionScope($request);
        $allowedLevels = $this->accessControl->resolveAllowedLevelsForScope($scope['type']);

        if ($allowedLevels !== null && ! in_array($request->input('level'), $allowedLevels, true)) {
            abort(403, 'You cannot create a role at this level.');
        }

        Role::create($request->validated());

        return redirect($request->input('_redirect', route('access-control.roles.index')))
            ->with('success', 'Role created successfully.');
    }

    public function edit(Request $request, Role $role): Response
    {
        $scope        = $this->accessControl->resolveSessionScope($request);
        $levelOptions = $this->resolveLevelOptions($scope['type']);

        return Inertia::render('access-control/roles/edit', compact('role', 'levelOptions'));
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $scope         = $this->accessControl->resolveSessionScope($request);
        $allowedLevels = $this->accessControl->resolveAllowedLevelsForScope($scope['type']);

        if ($allowedLevels !== null && ! in_array($request->input('level'), $allowedLevels, true)) {
            abort(403, 'You cannot set a role to this level.');
        }

        $this->roleService->updateRole($role, $request->validated());

        return redirect()->route('access-control.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    /**
     * @return array<int, array{type: string, label: string}>
     */
    private function resolveLevelOptions(string $scopeType): array
    {
        $allowedLevels = $this->accessControl->resolveAllowedLevelsForScope($scopeType);
        $allOptions    = $this->accessControl->getScopeTypesConfig();

        if ($allowedLevels === null) {
            return $allOptions;
        }

        return array_values(array_filter($allOptions, fn ($opt) => in_array($opt['type'], $allowedLevels, true)));
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->roleService->deleteRole($role);

        return redirect()->route('access-control.roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
