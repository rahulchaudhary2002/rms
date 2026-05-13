<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StorePermissionRequest;
use App\Http\Requests\AccessControl\UpdatePermissionRequest;
use App\Models\Permission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search'    => $request->string('search')->toString(),
            'module'    => $request->string('module')->toString(),
            'action'    => $request->string('action')->toString(),
            'level'     => $request->string('level')->toString(),
            'is_active' => $request->string('is_active')->toString(),
            'per_page'  => $request->string('per_page')->toString(),
        ];

        $query = Permission::query()
            ->when($filters['search'] !== '', function ($builder) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $builder->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('slug', 'like', $search));
            })
            ->when($filters['module'] !== '', fn ($builder) => $builder->where('module', $filters['module']))
            ->when($filters['action'] !== '', fn ($builder) => $builder->where('action', $filters['action']))
            ->when($filters['level'] !== '', fn ($builder) => $builder->where('level', $filters['level']))
            ->when($filters['is_active'] !== '', fn ($builder) => $builder->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('module')
            ->orderBy('action');

        $perPage = $filters['per_page'] === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($filters['per_page'] ?: 10), 1);

        $permissions = $query->paginate($perPage)->withQueryString();

        $modules = Permission::distinct()->orderBy('module')->pluck('module');
        $actions = Permission::distinct()->orderBy('action')->pluck('action');

        return Inertia::render('access-control/permissions/index', [
            'permissions' => $permissions,
            'modules'     => $modules,
            'actions'     => $actions,
            'filters'     => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('access-control/permissions/create');
    }

    public function store(StorePermissionRequest $request): RedirectResponse
    {
        Permission::create($request->validated());

        return redirect()->route('access-control.permissions.index')
            ->with('success', 'Permission created successfully.');
    }

    public function edit(Permission $permission): Response
    {
        return Inertia::render('access-control/permissions/edit', [
            'permission' => $permission,
        ]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        if ($permission->is_system) {
            abort(403, 'System permissions cannot be modified.');
        }

        $permission->update($request->validated());

        return redirect()->route('access-control.permissions.index')
            ->with('success', 'Permission updated successfully.');
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        if ($permission->is_system) {
            abort(403, 'System permissions cannot be deleted.');
        }

        $permission->delete();

        return redirect()->route('access-control.permissions.index')
            ->with('success', 'Permission deleted successfully.');
    }
}
