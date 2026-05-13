<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserRoleAssignmentRequest;
use App\Models\Role;
use App\Models\User;
use App\Models\UserRoleAssignment;
use App\Services\AccessControlService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleAssignmentController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $filters = [
            'search'     => $request->string('search')->toString(),
            'user_id'    => $request->string('user_id')->toString(),
            'role_id'    => $request->string('role_id')->toString(),
            'scope_type' => $request->string('scope_type')->toString(),
            'is_active'  => $request->string('is_active')->toString(),
            'per_page'   => $request->string('per_page')->toString(),
        ];

        $query = UserRoleAssignment::with(['user', 'role', 'assignedBy'])
            ->whereHas('user', fn ($q) => $q->where('is_superadmin', false))
            ->when($filters['search'] !== '', function ($builder) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $builder->whereHas('user', fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['user_id'] !== '', fn ($builder) => $builder->where('user_id', $filters['user_id']))
            ->when($filters['role_id'] !== '', fn ($builder) => $builder->where('role_id', $filters['role_id']))
            ->when($filters['scope_type'] !== '', fn ($builder) => $builder->where('scope_type', $filters['scope_type']))
            ->when($filters['is_active'] !== '', fn ($builder) => $builder->where('is_active', $filters['is_active'] === 'true'))
            ->orderByDesc('created_at');

        $perPage = $filters['per_page'] === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($filters['per_page'] ?: 10), 1);

        $assignments = $query->paginate($perPage)->withQueryString();

        $users = User::where('is_superadmin', false)->orderBy('name')->get(['id', 'name', 'email']);
        $roles = Role::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug', 'level']);

        return Inertia::render('access-control/user-roles/index', [
            'assignments' => $assignments,
            'users'       => $users,
            'roles'       => $roles,
            'filters'     => $filters,
        ]);
    }

    public function create(): Response
    {
        $actor = Auth::user();

        $users = User::where('is_superadmin', false)->orderBy('name')->get(['id', 'name', 'email']);
        $roles = Role::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug', 'level']);

        // Super admin sees all scopes; others only see their own assigned scopes.
        if ($this->accessControl->isSuperAdmin($actor)) {
            $allowedScopes = null; // null = no restriction
        } else {
            $assignments = UserRoleAssignment::where('user_id', $actor->id)
                ->where('is_active', true)
                ->whereIn('scope_type', ['outlet', 'warehouse'])
                ->get(['scope_type', 'scope_id']);

            $allowedScopes = [
                'outlet'    => $assignments->where('scope_type', 'outlet')->pluck('scope_id')->unique()->values(),
                'warehouse' => $assignments->where('scope_type', 'warehouse')->pluck('scope_id')->unique()->values(),
            ];
        }

        return Inertia::render('access-control/user-roles/create', [
            'users'         => $users,
            'roles'         => $roles,
            'allowedScopes' => $allowedScopes,
        ]);
    }

    public function store(StoreUserRoleAssignmentRequest $request): RedirectResponse
    {
        $actor = Auth::user();
        $targetRole = Role::findOrFail($request->role_id);

        $this->authorizeRoleAssignment($actor, $targetRole, $request->scope_type, $request->scope_id);

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
                    'assigned_by' => Auth::id(),
                ]
            );
        });

        $user = User::findOrFail($request->user_id);
        $this->accessControl->clearUserPermissionCache($user);

        $redirect = $request->input('_redirect', route('access-control.user-roles.index'));

        return redirect($redirect)->with('success', 'Role assigned successfully.');
    }

    private function authorizeRoleAssignment(User $actor, Role $targetRole, string $targetScopeType, ?int $targetScopeId): void
    {
        if (! $targetRole->is_active) {
            throw new AuthorizationException('Role is inactive.');
        }

        if (! $targetRole->is_assignable) {
            throw new AuthorizationException('This role cannot be assigned.');
        }

        // Super admin bypasses rank restriction
        if ($this->accessControl->isSuperAdmin($actor)) {
            return;
        }

        $actorRoleAssignment = UserRoleAssignment::with('role')
            ->where('user_id', $actor->id)
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('is_active', true))
            ->join('roles', 'roles.id', '=', 'user_role_assignments.role_id')
            ->orderBy('roles.rank')
            ->select('user_role_assignments.*')
            ->first();

        $actorRole = $actorRoleAssignment?->role;

        if (! $actorRole) {
            throw new AuthorizationException('You do not have a role that allows assigning roles.');
        }

        if ($targetRole->rank <= $actorRole->rank) {
            throw new AuthorizationException('You cannot assign equal or higher role.');
        }

        $actorScopeType = $actorRoleAssignment->scope_type;
        $actorScopeId   = $actorRoleAssignment->scope_id;

        if ($actorScopeType !== 'global' && $actorScopeType !== $targetScopeType) {
            throw new AuthorizationException('Invalid role assignment scope.');
        }

        if (in_array($actorScopeType, ['outlet', 'warehouse']) && $actorScopeId !== $targetScopeId) {
            throw new AuthorizationException('You cannot assign role outside your scope.');
        }
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
