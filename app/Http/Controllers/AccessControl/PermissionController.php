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
        $query = Permission::query();

        if ($search = $request->input('search')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%"));
        }

        if ($module = $request->input('module')) {
            $query->where('module', $module);
        }

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($level = $request->input('level')) {
            $query->where('level', $level);
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $permissions = $query->orderBy('module')->orderBy('action')->paginate(30)->withQueryString();

        $modules = Permission::distinct()->orderBy('module')->pluck('module');
        $actions = Permission::distinct()->orderBy('action')->pluck('action');

        return Inertia::render('access-control/permissions/index', [
            'permissions' => $permissions,
            'modules'     => $modules,
            'actions'     => $actions,
            'filters'     => $request->only('search', 'module', 'action', 'level', 'is_active'),
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
