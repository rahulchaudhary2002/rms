<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserPermissionOverrideRequest;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserPermissionOverride;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserPermissionOverrideController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $query = UserPermissionOverride::with(['user', 'permission', 'assignedBy'])
            ->orderByDesc('created_at');

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($permissionId = $request->input('permission_id')) {
            $query->where('permission_id', $permissionId);
        }

        if ($scopeType = $request->input('scope_type')) {
            $query->where('scope_type', $scopeType);
        }

        if ($effect = $request->input('effect')) {
            $query->where('effect', $effect);
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $overrides = $query->paginate(20)->withQueryString();

        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        $permissions = Permission::where('is_active', true)->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);

        return Inertia::render('access-control/user-permission-overrides', [
            'overrides'   => $overrides,
            'users'       => $users,
            'permissions' => $permissions,
            'filters'     => $request->only('user_id', 'permission_id', 'scope_type', 'effect', 'is_active'),
        ]);
    }

    public function store(StoreUserPermissionOverrideRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            UserPermissionOverride::updateOrCreate(
                [
                    'user_id'       => $request->user_id,
                    'permission_id' => $request->permission_id,
                    'scope_type'    => $request->scope_type,
                    'scope_id'      => $request->scope_type === 'global' ? null : $request->scope_id,
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

        return back()->with('success', 'Permission override saved.');
    }

    public function update(Request $request, UserPermissionOverride $userPermissionOverride): RedirectResponse
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        $userPermissionOverride->update(['is_active' => $request->boolean('is_active')]);
        $this->accessControl->clearUserPermissionCache($userPermissionOverride->user);

        return back()->with('success', 'Override updated.');
    }

    public function destroy(UserPermissionOverride $userPermissionOverride): RedirectResponse
    {
        $user = $userPermissionOverride->user;
        $userPermissionOverride->delete();
        $this->accessControl->clearUserPermissionCache($user);

        return back()->with('success', 'Override removed.');
    }
}
