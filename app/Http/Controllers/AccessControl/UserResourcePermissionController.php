<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccessControl\StoreUserResourcePermissionRequest;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserResourcePermission;
use App\Models\UserRoleAssignment;
use App\Services\AccessControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserResourcePermissionController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $filters = [
            'search'        => $request->string('search')->toString(),
            'user_id'       => $request->string('user_id')->toString(),
            'permission_id' => $request->string('permission_id')->toString(),
            'resource_type' => $request->string('resource_type')->toString(),
            'effect'        => $request->string('effect')->toString(),
            'is_active'     => $request->string('is_active')->toString(),
            'per_page'      => $request->string('per_page')->toString(),
        ];

        $actorPermissionIds  = $this->accessControl->getActorPermissionIds($request->user());
        $actorAssignedScopes = $this->accessControl->getActorAssignedScopeIds($request->user());
        $actorId             = $request->user()->id;
        $scope               = $this->accessControl->resolveSessionScope($request);

        $query = UserResourcePermission::with(['user', 'permission', 'assignedBy'])
            ->where('user_id', '!=', $actorId)
            ->whereHas('user', fn ($q) => $q->where('is_superadmin', false))
            ->when($actorPermissionIds !== null, fn ($builder) => $builder->whereIn('permission_id', $actorPermissionIds))
            // Filter outlet/warehouse resource rows by what the actor is assigned to
            ->when($actorAssignedScopes !== null, function ($builder) use ($actorAssignedScopes) {
                $builder->where(function ($q) use ($actorAssignedScopes) {
                    // Geographic resource types — restrict to actor's assigned outlets/warehouses
                    $q->where(function ($q2) use ($actorAssignedScopes) {
                        $q2->where('resource_type', 'outlet')
                           ->when(
                               ! empty($actorAssignedScopes['outlet_ids']),
                               fn ($q3) => $q3->whereIn('resource_id', $actorAssignedScopes['outlet_ids']),
                               fn ($q3) => $q3->whereRaw('1 = 0') // no assigned outlets → hide all outlet rows
                           );
                    });
                    $q->orWhere(function ($q2) use ($actorAssignedScopes) {
                        $q2->where('resource_type', 'warehouse')
                           ->when(
                               ! empty($actorAssignedScopes['warehouse_ids']),
                               fn ($q3) => $q3->whereIn('resource_id', $actorAssignedScopes['warehouse_ids']),
                               fn ($q3) => $q3->whereRaw('1 = 0')
                           );
                    });
                    // Non-geographic resource types (user, role, permission) — no assignment restriction
                    $q->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                });
            })
            // Additionally narrow to the selected session scope
            ->when($scope['type'] !== 'global', function ($builder) use ($scope) {
                $builder->where(function ($q) use ($scope) {
                    if ($scope['type'] === 'outlet') {
                        $q->where(fn ($q2) => $q2->where('resource_type', 'outlet')->where('resource_id', $scope['scope_id']));
                        $q->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                    } elseif ($scope['type'] === 'warehouse') {
                        $q->where(fn ($q2) => $q2->where('resource_type', 'warehouse')->where('resource_id', $scope['scope_id']));
                        if ($scope['outlet_id'] !== null) {
                            $q->orWhere(fn ($q2) => $q2->where('resource_type', 'outlet')->where('resource_id', $scope['outlet_id']));
                        }
                        $q->orWhereNotIn('resource_type', ['outlet', 'warehouse']);
                    }
                });
            })
            ->when($filters['search'] !== '', function ($builder) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $builder->whereHas('user', fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->when($filters['user_id'] !== '', fn ($builder) => $builder->where('user_id', $filters['user_id']))
            ->when($filters['permission_id'] !== '', fn ($builder) => $builder->where('permission_id', $filters['permission_id']))
            ->when($filters['resource_type'] !== '', fn ($builder) => $builder->where('resource_type', $filters['resource_type']))
            ->when($filters['effect'] !== '', fn ($builder) => $builder->where('effect', $filters['effect']))
            ->when($filters['is_active'] !== '', fn ($builder) => $builder->where('is_active', $filters['is_active'] === 'true'))
            ->orderByDesc('created_at');

        $perPage = $filters['per_page'] === 'all'
            ? max((clone $query)->count(), 1)
            : max((int) ($filters['per_page'] ?: 10), 1);

        $resourcePerms = $query->paginate($perPage)->withQueryString();

        $users = User::where('is_superadmin', false)->where('id', '!=', $actorId)->orderBy('name')->get(['id', 'name', 'email']);
        $permissions = Permission::where('is_active', true)
            ->when($actorPermissionIds !== null, fn ($q) => $q->whereIn('id', $actorPermissionIds))
            ->orderBy('module')->orderBy('action')->get(['id', 'name', 'slug', 'module', 'action']);
        $resourceTypes = UserResourcePermission::distinct()->orderBy('resource_type')->pluck('resource_type');

        return Inertia::render('access-control/user-resource-permissions/index', [
            'resourcePerms' => $resourcePerms,
            'users'         => $users,
            'permissions'   => $permissions,
            'resourceTypes' => $resourceTypes,
            'filters'       => $filters,
        ]);
    }

    public function create(Request $request): Response
    {
        $actor               = Auth::user();
        $actorPermissionIds  = $this->accessControl->getActorPermissionIds($actor);
        $actorAssignedScopes = $this->accessControl->getActorAssignedScopeIds($actor);
        $scope               = $this->accessControl->resolveSessionScope($request);

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

        $resourceTypes = collect(config('access_control.resource_types', []))
            ->map(fn ($cfg, $key) => ['type' => $key, 'label' => $cfg['label']])
            ->values();

        return Inertia::render('access-control/user-resource-permissions/create', [
            'users'              => $users,
            'permissions'        => $permissions,
            'resourceTypes'      => $resourceTypes,
            'allowedScopes'      => $allowedScopes,
            'allowedResourceIds' => $actorAssignedScopes,
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

    public function store(StoreUserResourcePermissionRequest $request): RedirectResponse
    {
        $actorPermissionIds = $this->accessControl->getActorPermissionIds(Auth::user());

        if ($actorPermissionIds !== null && ! in_array((int) $request->permission_id, $actorPermissionIds)) {
            abort(403, 'You can only grant permissions assigned to your roles.');
        }

        DB::transaction(function () use ($request) {
            UserResourcePermission::updateOrCreate(
                [
                    'user_id'       => $request->user_id,
                    'permission_id' => $request->permission_id,
                    'resource_type' => $request->resource_type,
                    'resource_id'   => $request->resource_id,
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

        $redirect = $request->input('_redirect', route('access-control.user-resource-permissions.index'));

        return redirect($redirect)->with('success', 'Resource permission saved.');
    }

    public function update(Request $request, UserResourcePermission $userResourcePermission): RedirectResponse
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        $userResourcePermission->update(['is_active' => $request->boolean('is_active')]);
        $this->accessControl->clearUserPermissionCache($userResourcePermission->user);

        return back()->with('success', 'Resource permission updated.');
    }

    public function destroy(UserResourcePermission $userResourcePermission): RedirectResponse
    {
        $user = $userResourcePermission->user;
        $userResourcePermission->delete();
        $this->accessControl->clearUserPermissionCache($user);

        return back()->with('success', 'Resource permission removed.');
    }
}
