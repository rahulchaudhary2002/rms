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
        $filters = [
            'search'    => $request->string('search')->toString(),
            'level'     => $request->string('level')->toString(),
            'is_active' => $request->string('is_active')->toString(),
            'per_page'  => $request->string('per_page')->toString(),
        ];

        $query = Role::query()
            ->withCount(['permissions', 'userRoleAssignments'])
            ->when($filters['search'] !== '', function ($builder) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $builder->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('slug', 'like', $search));
            })
            ->when($filters['level'] !== '', fn ($builder) => $builder->where('level', $filters['level']))
            ->when($filters['is_active'] !== '', fn ($builder) => $builder->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $perPage = $filters['per_page'] === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($filters['per_page'] ?: 10), 1);

        $roles = $query->paginate($perPage)->withQueryString();

        return Inertia::render('access-control/roles/index', [
            'roles'   => $roles,
            'filters' => $filters,
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
