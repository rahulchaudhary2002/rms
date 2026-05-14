<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\ToggleActiveRequest;
use App\Http\Requests\AccessControl\UserRoleAssignment\StoreUserRoleAssignmentRequest;
use App\Models\UserRoleAssignment;
use App\Services\AccessControlService;
use App\Services\UserRoleAssignmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleAssignmentController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AccessControlService $accessControl,
        private UserRoleAssignmentService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'user_id', 'role_id', 'scope_type', 'is_active', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/user-roles/index',
            $this->service->getIndexData($request->user(), $filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/user-roles/create',
            $this->service->getCreateData($request->user(), $scope));
    }

    public function store(StoreUserRoleAssignmentRequest $request): RedirectResponse
    {
        $this->service->assign($request->user(), $request->validated() + ['is_active' => $request->boolean('is_active', true)]);

        return redirect($request->input('_redirect', route('access-control.user-roles.index')))
            ->with('success', 'Role assigned successfully.');
    }

    public function update(ToggleActiveRequest $request, UserRoleAssignment $userRoleAssignment): RedirectResponse
    {
        $this->service->toggleActive($userRoleAssignment, $request->boolean('is_active'));

        return back()->with('success', 'Assignment updated.');
    }

    public function destroy(UserRoleAssignment $userRoleAssignment): RedirectResponse
    {
        $this->service->remove($userRoleAssignment);

        return back()->with('success', 'Role assignment removed.');
    }
}
