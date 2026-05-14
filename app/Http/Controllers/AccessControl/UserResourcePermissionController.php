<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\ToggleActiveRequest;
use App\Http\Requests\AccessControl\UserResourcePermission\StoreUserResourcePermissionRequest;
use App\Models\UserResourcePermission;
use App\Services\AccessControlService;
use App\Services\UserResourcePermissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserResourcePermissionController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AccessControlService $accessControl,
        private UserResourcePermissionService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'user_id', 'permission_id', 'resource_type', 'effect', 'is_active', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/user-resource-permissions/index',
            $this->service->getIndexData($request->user(), $filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/user-resource-permissions/create',
            $this->service->getCreateData($request->user(), $scope));
    }

    public function store(StoreUserResourcePermissionRequest $request): RedirectResponse
    {
        $this->service->save($request->user(), $request->validated() + [
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect($request->input('_redirect', route('access-control.user-resource-permissions.index')))
            ->with('success', 'Resource permission saved.');
    }

    public function update(ToggleActiveRequest $request, UserResourcePermission $userResourcePermission): RedirectResponse
    {
        $this->service->toggleActive($userResourcePermission, $request->boolean('is_active'));

        return back()->with('success', 'Resource permission updated.');
    }

    public function destroy(UserResourcePermission $userResourcePermission): RedirectResponse
    {
        $this->service->remove($userResourcePermission);

        return back()->with('success', 'Resource permission removed.');
    }
}
