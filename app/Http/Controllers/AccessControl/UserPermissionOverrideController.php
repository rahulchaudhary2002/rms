<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserPermissionOverrideRequest;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserPermissionOverride;
use App\Models\UserRoleAssignment;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserPermissionOverrideController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $filters = [
            'search'        => $request->string('search')->toString(),
            'user_id'       => $request->string('user_id')->toString(),
            'permission_id' => $request->string('permission_id')->toString(),
            'scope_type'    => $request->string('scope_type')->toString(),
            'effect'        => $request->string('effect')->toString(),
            'is_active'     => $request->string('is_active')->toString(),
            'per_page'      => $request->string('per_page')->toString(),
        ];

        $actorPermissionIds = $this->accessControl->getActorPermissionIds($request->user());
        $actorId            = $request->user()->id;
        $scope              = $this->accessControl->resolveSessionScope($request);

        $query = UserPermissionOverride::with(['user', 'permission', 'assignedBy'])
            ->where('user_id', '!=', $actorId)
            ->whereHas('user', fn ($q) => $q->where('is_superadmin', false))
            ->when($actorPermissionIds !== null, fn ($builder) => $builder->whereIn('permission_id', $actorPermissionIds));

        $this->accessControl->applyScopeFilter($query, $scope);

        $query->when($filters['search'] !== '', function ($builder) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $builder->whereHas('user', fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['user_id'] !== '', fn ($builder) => $builder->where('user_id', $filters['user_id']))
            ->when($filters['permission_id'] !== '', fn ($builder) => $builder->where('permission_id', $filters['permission_id']))
            ->when($filters['scope_type'] !== '', fn ($builder) => $builder->where('scope_type', $filters['scope_type']))
            ->when($filters['effect'] !== '', fn ($builder) => $builder->where('effect', $filters['effect']))
            ->when($filters['is_active'] !== '', fn ($builder) => $builder->where('is_active', $filters['is_active'] === 'true'))
            ->orderByDesc('created_at');

        $perPage = $filters['per_page'] === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($filters['per_page'] ?: 10), 1);

        $overrides = $query->paginate($perPage)->withQueryString();

        $users = User::where('is_superadmin', false)->where('id', '!=', $actorId)->orderBy('name')->get(['id', 'name', 'email']);
        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);

        return Inertia::render('access-control/user-permission-overrides/index', [
            'overrides'   => $overrides,
            'users'       => $users,
            'permissions' => $permissions,
            'filters'     => $filters,
        ]);
    }

    public function create(Request $request): Response
    {
        $actor              = Auth::user();
        $actorPermissionIds = $this->accessControl->getActorPermissionIds($actor);
        $actorMaxScopeLevel = $this->accessControl->getActorMaxScopeLevel($actor);
        $scope              = $this->accessControl->resolveSessionScope($request);

        $allowedScopes = $this->resolveAllowedScopes($actor);

        $users = User::where('is_superadmin', false)
            ->where('id', '!=', $actor->id)
            ->when($scope['type'] !== 'global', function ($builder) use ($scope) {
                $builder->where(function ($q) use ($scope) {
                    $q->whereDoesntHave('roleAssignments', fn ($q2) => $q2->where('is_active', true));
                    $q->orWhereHas('roleAssignments', function ($q2) use ($scope) {
                        $q2->where('is_active', true)->where(function ($q3) use ($scope) {
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
            ->orderBy('name')->get(['id', 'name', 'email']);

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

        return Inertia::render('access-control/user-permission-overrides/create', [
            'users'              => $users,
            'permissions'        => $permissions,
            'scopeTypes'         => $scopeTypes,
            'allowedScopes'      => $allowedScopes,
            'allowedScopeTypes'  => $allowedScopeTypes,
        ]);
    }

    private function resolveAllowedScopes(\App\Models\User $actor): ?array
    {
        $hasGlobalRole = $this->accessControl->isSuperAdmin($actor)
            || UserRoleAssignment::where('user_id', $actor->id)
                ->where('is_active', true)
                ->where('scope_type', 'global')
                ->whereHas('role', fn ($q) => $q->where('is_active', true))
                ->exists();

        if ($hasGlobalRole) {
            return null;
        }

        $assignments = UserRoleAssignment::where('user_id', $actor->id)
            ->where('is_active', true)
            ->whereIn('scope_type', ['outlet', 'warehouse'])
            ->get(['scope_type', 'scope_id']);

        return [
            'outlet'    => $assignments->where('scope_type', 'outlet')->pluck('scope_id')->unique()->values()->toArray(),
            'warehouse' => $assignments->where('scope_type', 'warehouse')->pluck('scope_id')->unique()->values()->toArray(),
        ];
    }

    public function store(StoreUserPermissionOverrideRequest $request): RedirectResponse
    {
        $actorPermissionIds = $this->accessControl->getActorPermissionIds(Auth::user());

        if ($actorPermissionIds !== null && ! in_array((int) $request->permission_id, $actorPermissionIds)) {
            abort(403, 'You can only override permissions assigned to your roles.');
        }

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
                    'assigned_by' => Auth::id(),
                ]
            );
        });

        $user = User::findOrFail($request->user_id);
        $this->accessControl->clearUserPermissionCache($user);

        $redirect = $request->input('_redirect', route('access-control.user-permission-overrides.index'));

        return redirect($redirect)->with('success', 'Permission override saved.');
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
