<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search'   => $request->string('search')->toString(),
            'verified' => $request->string('verified')->toString(),
            'per_page' => $request->string('per_page')->toString(),
        ];

        $query = User::query()
            ->where('is_superadmin', false)
            ->withCount(['roleAssignments', 'permissionOverrides'])
            ->when($filters['search'] !== '', function ($builder) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $builder->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['verified'] === 'true', fn ($b) => $b->whereNotNull('email_verified_at'))
            ->when($filters['verified'] === 'false', fn ($b) => $b->whereNull('email_verified_at'))
            ->orderBy('name');

        $perPage = $filters['per_page'] === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($filters['per_page'] ?: 10), 1);

        $users = $query->paginate($perPage)->withQueryString();

        return Inertia::render('access-control/users/index', [
            'users'   => $users,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('access-control/users/create');
    }

    public function show(User $user): Response
    {
        abort_if($user->is_superadmin, 404);

        $user->load([
            'roleAssignments.role',
            'roleAssignments.assignedBy',
            'permissionOverrides.permission',
            'permissionOverrides.assignedBy',
            'resourcePermissions.permission',
            'resourcePermissions.assignedBy',
        ]);

        $roles = Role::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug', 'level']);
        $permissions = Permission::where('is_active', true)->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);
        $scopeTypes = collect(config('access_control.scope_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values();
        $resourceTypes = collect(config('access_control.resource_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values();

        return Inertia::render('access-control/users/show', [
            'user'          => $user,
            'roles'         => $roles,
            'permissions'   => $permissions,
            'scopeTypes'    => $scopeTypes,
            'resourceTypes' => $resourceTypes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        abort_if($user->is_superadmin, 404);

        return Inertia::render('access-control/users/edit', [
            'user' => $user->only(['id', 'name', 'email', 'is_superadmin', 'email_verified_at', 'created_at']),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user->name = $data['name'];
        $user->email = $data['email'];

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if($user->is_superadmin, 404);

        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'User deleted.');
    }
}
