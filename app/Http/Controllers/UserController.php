<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRoleAssignment;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}
    public function index(Request $request): Response
    {
        $filters = [
            'search'   => $request->string('search')->toString(),
            'verified' => $request->string('verified')->toString(),
            'per_page' => $request->string('per_page')->toString(),
        ];

        $scope = $this->accessControl->resolveSessionScope($request);

        $query = User::query()
            ->where('is_superadmin', false)
            ->where('id', '!=', $request->user()->id)
            ->when($scope['type'] !== 'global', function ($builder) use ($scope) {
                $builder->where(function ($q) use ($scope) {
                    // Users with no active role assignments anywhere
                    $q->whereDoesntHave('roleAssignments', fn ($q2) => $q2->where('is_active', true));

                    // Users assigned to the current scope (including global roles)
                    $q->orWhereHas('roleAssignments', function ($q2) use ($scope) {
                        $q2->where('is_active', true)
                            ->where(function ($q3) use ($scope) {
                                $q3->where('scope_type', 'global');

                                if ($scope['type'] === 'outlet') {
                                    $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'outlet')->where('scope_id', $scope['scope_id']));
                                } elseif ($scope['type'] === 'warehouse') {
                                    if ($scope['outlet_id'] !== null) {
                                        $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'outlet')->where('scope_id', $scope['outlet_id']));
                                    }
                                    $q3->orWhere(fn ($q4) => $q4->where('scope_type', 'warehouse')->where('scope_id', $scope['scope_id']));
                                }
                            });
                    });
                });
            })
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

    public function show(Request $request, User $user): Response
    {
        abort_if($user->is_superadmin, 404);
        abort_if($user->id === $request->user()->id, 403);

        $actor               = $request->user();
        $actorMinRank        = $this->accessControl->getActorMinRank($actor);
        $actorPermissionIds  = $this->accessControl->getActorPermissionIds($actor);
        $actorAssignedScopes = $this->accessControl->getActorAssignedScopeIds($actor);
        $actorMaxScopeLevel  = $this->accessControl->getActorMaxScopeLevel($actor);
        $scope               = $this->accessControl->resolveSessionScope($request);

        // Determine which scopes the actor may assign roles in
        $hasGlobalRole = $this->accessControl->isSuperAdmin($actor)
            || UserRoleAssignment::where('user_id', $actor->id)
                ->where('is_active', true)
                ->where('scope_type', 'global')
                ->whereHas('role', fn ($q) => $q->where('is_active', true))
                ->exists();

        if ($hasGlobalRole) {
            $allowedScopes = null;
        } else {
            $actorAssignments = UserRoleAssignment::where('user_id', $actor->id)
                ->where('is_active', true)
                ->whereIn('scope_type', ['outlet', 'warehouse'])
                ->get(['scope_type', 'scope_id']);

            $allowedScopes = [
                'outlet'    => $actorAssignments->where('scope_type', 'outlet')->pluck('scope_id')->unique()->values()->toArray(),
                'warehouse' => $actorAssignments->where('scope_type', 'warehouse')->pluck('scope_id')->unique()->values()->toArray(),
            ];
        }

        $user->load([
            'roleAssignments' => function ($q) use ($scope) {
                $q->with(['role', 'assignedBy']);
                $this->accessControl->applyScopeFilter($q, $scope);
            },
            'permissionOverrides' => function ($q) use ($actorPermissionIds, $scope) {
                $q->with(['permission', 'assignedBy']);
                if ($actorPermissionIds !== null) {
                    $q->whereIn('permission_id', $actorPermissionIds);
                }
                $this->accessControl->applyScopeFilter($q, $scope);
            },
            'resourcePermissions' => function ($q) use ($actorPermissionIds, $actorAssignedScopes, $scope) {
                $q->with(['permission', 'assignedBy']);
                if ($actorPermissionIds !== null) {
                    $q->whereIn('permission_id', $actorPermissionIds);
                }
                if ($actorAssignedScopes !== null) {
                    $q->where(function ($q2) use ($actorAssignedScopes) {
                        $q2->where(function ($q3) use ($actorAssignedScopes) {
                            $q3->where('resource_type', 'outlet')
                               ->when(! empty($actorAssignedScopes['outlet_ids']), fn ($q4) => $q4->whereIn('resource_id', $actorAssignedScopes['outlet_ids']), fn ($q4) => $q4->whereRaw('1 = 0'));
                        });
                        $q2->orWhere(function ($q3) use ($actorAssignedScopes) {
                            $q3->where('resource_type', 'warehouse')
                               ->when(! empty($actorAssignedScopes['warehouse_ids']), fn ($q4) => $q4->whereIn('resource_id', $actorAssignedScopes['warehouse_ids']), fn ($q4) => $q4->whereRaw('1 = 0'));
                        });
                        $q2->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                    });
                }
                if ($scope['type'] !== 'global') {
                    $q->where(function ($q2) use ($scope) {
                        if ($scope['type'] === 'outlet') {
                            $q2->where(fn ($q3) => $q3->where('resource_type', 'outlet')->where('resource_id', $scope['scope_id']));
                            $q2->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                        } elseif ($scope['type'] === 'warehouse') {
                            $q2->where(fn ($q3) => $q3->where('resource_type', 'warehouse')->where('resource_id', $scope['scope_id']));
                            if ($scope['outlet_id'] !== null) {
                                $q2->orWhere(fn ($q3) => $q3->where('resource_type', 'outlet')->where('resource_id', $scope['outlet_id']));
                            }
                            $q2->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                        }
                    });
                }
            },
        ]);

        $roles = Role::where('is_active', true)
            ->when($actorMinRank !== null, fn ($q) => $q->where('rank', '>', $actorMinRank))
            ->orderBy('name')->get(['id', 'name', 'slug', 'level']);
        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);
        $scopeTypes = collect(config('access_control.scope_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values();

        $allowedScopeTypes = match ($actorMaxScopeLevel) {
            'global' => ['global', 'outlet', 'warehouse'],
            'outlet' => ['outlet', 'warehouse'],
            default  => ['warehouse'],
        };
        $resourceTypes = collect(config('access_control.resource_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values();

        return Inertia::render('access-control/users/show', [
            'user'               => $user,
            'roles'              => $roles,
            'permissions'        => $permissions,
            'scopeTypes'         => $scopeTypes,
            'resourceTypes'      => $resourceTypes,
            'allowedScopes'      => $allowedScopes,
            'allowedResourceIds' => $actorAssignedScopes,
            'allowedScopeTypes'  => $allowedScopeTypes,
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
