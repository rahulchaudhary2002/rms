<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserRoleAssignmentRequest;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRoleAssignment;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleAssignmentController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $query = UserRoleAssignment::with(['user', 'role', 'assignedBy'])
            ->orderByDesc('created_at');

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($roleId = $request->input('role_id')) {
            $query->where('role_id', $roleId);
        }

        if ($scopeType = $request->input('scope_type')) {
            $query->where('scope_type', $scopeType);
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $assignments = $query->paginate(20)->withQueryString();

        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        $roles = Role::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug', 'level']);

        return Inertia::render('access-control/user-roles', [
            'assignments' => $assignments,
            'users'       => $users,
            'roles'       => $roles,
            'filters'     => $request->only('user_id', 'role_id', 'scope_type', 'is_active'),
        ]);
    }

    public function store(StoreUserRoleAssignmentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            UserRoleAssignment::firstOrCreate(
                [
                    'user_id'    => $request->user_id,
                    'role_id'    => $request->role_id,
                    'scope_type' => $request->scope_type,
                    'scope_id'   => $request->scope_type === 'global' ? null : $request->scope_id,
                ],
                [
                    'is_active'   => $request->boolean('is_active', true),
                    'assigned_by' => auth()->id(),
                ]
            );
        });

        $user = User::findOrFail($request->user_id);
        $this->accessControl->clearUserPermissionCache($user);

        return back()->with('success', 'Role assigned successfully.');
    }

    public function update(Request $request, UserRoleAssignment $userRoleAssignment): RedirectResponse
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        $userRoleAssignment->update(['is_active' => $request->boolean('is_active')]);
        $this->accessControl->clearUserPermissionCache($userRoleAssignment->user);

        return back()->with('success', 'Assignment updated.');
    }

    public function destroy(UserRoleAssignment $userRoleAssignment): RedirectResponse
    {
        $user = $userRoleAssignment->user;
        $userRoleAssignment->delete();
        $this->accessControl->clearUserPermissionCache($user);

        return back()->with('success', 'Role assignment removed.');
    }
}
