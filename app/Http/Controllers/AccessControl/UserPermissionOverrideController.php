<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\ToggleActiveRequest;
use App\Http\Requests\AccessControl\UserPermissionOverride\StoreUserPermissionOverrideRequest;
use App\Models\UserPermissionOverride;
use App\Services\AccessControlService;
use App\Services\UserPermissionOverrideService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserPermissionOverrideController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AccessControlService $accessControl,
        private UserPermissionOverrideService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'user_id', 'permission_id', 'scope_type', 'effect', 'is_active', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/user-permission-overrides/index',
            $this->service->getIndexData($request->user(), $filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/user-permission-overrides/create',
            $this->service->getCreateData($request->user(), $scope));
    }

    public function store(StoreUserPermissionOverrideRequest $request): RedirectResponse
    {
        $this->service->save($request->user(), $request->validated() + [
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect($request->input('_redirect', route('access-control.user-permission-overrides.index')))
            ->with('success', 'Permission override saved.');
    }

    public function update(ToggleActiveRequest $request, UserPermissionOverride $userPermissionOverride): RedirectResponse
    {
        $this->service->toggleActive($userPermissionOverride, $request->boolean('is_active'));

        return back()->with('success', 'Override updated.');
    }

    public function destroy(UserPermissionOverride $userPermissionOverride): RedirectResponse
    {
        $this->service->remove($userPermissionOverride);

        return back()->with('success', 'Override removed.');
    }
}
