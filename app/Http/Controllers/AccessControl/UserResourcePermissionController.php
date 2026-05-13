<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserResourcePermissionRequest;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserResourcePermission;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserResourcePermissionController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $query = UserResourcePermission::with(['user', 'permission', 'assignedBy'])
            ->orderByDesc('created_at');

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($permissionId = $request->input('permission_id')) {
            $query->where('permission_id', $permissionId);
        }

        if ($resourceType = $request->input('resource_type')) {
            $query->where('resource_type', $resourceType);
        }

        if ($effect = $request->input('effect')) {
            $query->where('effect', $effect);
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $resourcePerms = $query->paginate(20)->withQueryString();

        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        $permissions = Permission::where('is_active', true)->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);
        $resourceTypes = UserResourcePermission::distinct()->orderBy('resource_type')->pluck('resource_type');

        return Inertia::render('access-control/user-resource-permissions', [
            'resourcePerms' => $resourcePerms,
            'users'         => $users,
            'permissions'   => $permissions,
            'resourceTypes' => $resourceTypes,
            'filters'       => $request->only('user_id', 'permission_id', 'resource_type', 'effect', 'is_active'),
        ]);
    }

    public function store(StoreUserResourcePermissionRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            UserResourcePermission::updateOrCreate(
                [
                    'user_id'       => $request->user_id,
                    'permission_id' => $request->permission_id,
                    'resource_type' => $request->resource_type,
                    'resource_id'   => $request->resource_id,
                ],
                [
                    'effect'      => $request->effect,
                    'reason'      => $request->reason,
                    'is_active'   => $request->boolean('is_active', true),
                    'assigned_by' => auth()->id(),
                ]
            );
        });

        $user = User::findOrFail($request->user_id);
        $this->accessControl->clearUserPermissionCache($user);

        return back()->with('success', 'Resource permission saved.');
    }

    public function update(Request $request, UserResourcePermission $userResourcePermission): RedirectResponse
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        $userResourcePermission->update(['is_active' => $request->boolean('is_active')]);
        $this->accessControl->clearUserPermissionCache($userResourcePermission->user);

        return back()->with('success', 'Resource permission updated.');
    }

    public function destroy(UserResourcePermission $userResourcePermission): RedirectResponse
    {
        $user = $userResourcePermission->user;
        $userResourcePermission->delete();
        $this->accessControl->clearUserPermissionCache($user);

        return back()->with('success', 'Resource permission removed.');
    }
}
