<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\Permission\StorePermissionRequest;
use App\Http\Requests\AccessControl\Permission\UpdatePermissionRequest;
use App\Models\Permission;
use App\Services\AccessControlService;
use App\Services\PermissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private PermissionService $permissionService,
        private AccessControlService $accessControl,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'module', 'action', 'level', 'is_active', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/permissions/index',
            $this->permissionService->getIndexData($filters, $scope['type']));
    }

    public function create(Request $request): Response
    {
        $scope        = $this->accessControl->resolveSessionScope($request);
        $levelOptions = $this->resolveLevelOptions($scope['type']);

        return Inertia::render('access-control/permissions/create', compact('levelOptions'));
    }

    public function store(StorePermissionRequest $request): RedirectResponse
    {
        $scope         = $this->accessControl->resolveSessionScope($request);
        $allowedLevels = $this->accessControl->resolveAllowedLevelsForScope($scope['type']);

        if ($allowedLevels !== null && ! in_array($request->input('level'), $allowedLevels, true)) {
            abort(403, 'You cannot create a permission at this level.');
        }

        $this->permissionService->createPermission($request->validated());

        return redirect($request->input('_redirect', route('access-control.permissions.index')))
            ->with('success', 'Permission created successfully.');
    }

    public function edit(Request $request, Permission $permission): Response
    {
        $scope        = $this->accessControl->resolveSessionScope($request);
        $levelOptions = $this->resolveLevelOptions($scope['type']);

        return Inertia::render('access-control/permissions/edit', compact('permission', 'levelOptions'));
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        $scope         = $this->accessControl->resolveSessionScope($request);
        $allowedLevels = $this->accessControl->resolveAllowedLevelsForScope($scope['type']);

        if ($allowedLevels !== null && ! in_array($request->input('level'), $allowedLevels, true)) {
            abort(403, 'You cannot set a permission to this level.');
        }

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
}
