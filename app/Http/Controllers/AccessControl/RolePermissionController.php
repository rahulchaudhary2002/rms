<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreRolePermissionRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RolePermissionController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $filters = [
            'search'   => $request->string('search')->toString(),
            'level'    => $request->string('level')->toString(),
            'per_page' => $request->string('per_page')->toString(),
        ];

        $query = Role::with(['permissions' => fn ($q) => $q->orderBy('module')->orderBy('action')])
            ->withCount('permissions')
            ->when($filters['search'] !== '', function ($builder) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $builder->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('slug', 'like', $search));
            })
            ->when($filters['level'] !== '', fn ($builder) => $builder->where('level', $filters['level']))
            ->orderBy('name');

        $perPage = $filters['per_page'] === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($filters['per_page'] ?: 10), 1);

        $roles = $query->paginate($perPage)->withQueryString();

        $permissions = Permission::where('is_active', true)
            ->orderBy('module')
            ->orderBy('action')
            ->get(['id', 'name', 'slug', 'module', 'action', 'level']);

        return Inertia::render('access-control/role-permissions/index', [
            'roles'       => $roles,
            'permissions' => $permissions,
            'filters'     => $filters,
        ]);
    }

    public function store(StoreRolePermissionRequest $request): RedirectResponse
    {
        $role = Role::findOrFail($request->role_id);

        DB::transaction(function () use ($role, $request) {
            $role->permissions()->syncWithoutDetaching($request->permission_ids);
        });

        $this->clearAffectedUsersCache($role);

        return back()->with('success', 'Permissions assigned successfully.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'role_id'       => ['required', 'integer', 'exists:roles,id'],
            'permission_id' => ['required', 'integer', 'exists:permissions,id'],
        ]);

        $role = Role::findOrFail($request->role_id);

        DB::transaction(function () use ($role, $request) {
            $role->permissions()->detach($request->permission_id);
        });

        $this->clearAffectedUsersCache($role);

        return back()->with('success', 'Permission removed from role.');
    }

    private function clearAffectedUsersCache(Role $role): void
    {
        $role->userRoleAssignments()->with('user')->get()
            ->each(fn ($assignment) => $this->accessControl->clearUserPermissionCache($assignment->user));
    }
}
