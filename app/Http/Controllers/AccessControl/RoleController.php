<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreRoleRequest;
use App\Http\Requests\AccessControl\UpdateRoleRequest;
use App\Models\Role;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $query = Role::query()
            ->withCount(['permissions', 'userRoleAssignments']);

        if ($search = $request->input('search')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%"));
        }

        if ($level = $request->input('level')) {
            $query->where('level', $level);
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $roles = $query->orderBy('name')->paginate(20)->withQueryString();

        return Inertia::render('access-control/roles/index', [
            'roles'   => $roles,
            'filters' => $request->only('search', 'level', 'is_active'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('access-control/roles/create');
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        Role::create($request->validated());

        return redirect()->route('access-control.roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('access-control/roles/edit', [
            'role' => $role,
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        if ($role->is_system) {
            abort(403, 'System roles cannot be modified.');
        }

        $role->update($request->validated());

        $this->clearAffectedUsersCache($role);

        return redirect()->route('access-control.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            abort(403, 'System roles cannot be deleted.');
        }

        $this->clearAffectedUsersCache($role);
        $role->delete();

        return redirect()->route('access-control.roles.index')
            ->with('success', 'Role deleted successfully.');
    }

    private function clearAffectedUsersCache(Role $role): void
    {
        $role->userRoleAssignments()->with('user')->get()
            ->each(fn ($assignment) => $this->accessControl->clearUserPermissionCache($assignment->user));
    }
}
