<?php

namespace App\Http\Middleware;

use App\Models\UserRoleAssignment;
use App\Services\AccessControlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(private AccessControlService $accessControl) {}
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => fn () => $this->sharedAuth($request),
            'nodeSelection' => fn () => $this->nodeSelection($request),
            'outlets' => fn () => $this->sharedOutlets($request),
            'warehouses' => fn () => $this->sharedWarehouses($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function sharedAuth(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return ['user' => null, 'roles' => [], 'permissions' => [], 'can' => []];
        }

        [$scopeType, $outletId, $departmentId, $warehouseId] = $this->resolveCurrentScope($request);

        $permissions = $this->accessControl->getUserPermissions($user, $scopeType, $outletId, $departmentId, $warehouseId);
        $roles = $this->accessControl->getUserRoles($user, $scopeType, $outletId, $departmentId, $warehouseId)
            ->map(fn ($role) => ['id' => $role->id, 'name' => $role->name, 'slug' => $role->slug, 'level' => $role->level])
            ->values()
            ->all();

        return [
            'user'        => $user,
            'roles'       => $roles,
            'permissions' => array_keys(array_filter($permissions)),
            'can'         => $permissions,
        ];
    }

    /**
     * @return array{0: string, 1: int|null, 2: int|null}
     */
    private function resolveCurrentScope(Request $request): array
    {
        $scopeType    = (string) $request->session()->get('current_scope_type', 'global');
        $outletId     = $request->session()->get('current_outlet_id');
        $departmentId = $request->session()->get('current_department_id');
        $nodeId       = $request->session()->get('current_node_id');

        return match ($scopeType) {
            'central_warehouse'    => [$scopeType, null,                              null,                                          $nodeId ? (int) $nodeId : null],
            'outlet'               => [$scopeType, $outletId ? (int) $outletId : null, null,                                        null],
            'outlet_warehouse'     => [$scopeType, $outletId ? (int) $outletId : null, null,                                        $nodeId ? (int) $nodeId : null],
            'outlet_department'    => [$scopeType, $outletId ? (int) $outletId : null, $departmentId ? (int) $departmentId : null,  null],
            'department_warehouse' => [$scopeType, $outletId ? (int) $outletId : null, $departmentId ? (int) $departmentId : null,  $nodeId ? (int) $nodeId : null],
            default                => ['global', null, null, null],
        };
    }

    /**
     * Returns allowed outlet/warehouse IDs for the user, or null if unrestricted (super admin).
     *
     * @return array{outlet: int[], warehouse: int[]}|null
     */
    private function allowedScopeIds(Request $request): ?array
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        // Global-scope role users (super-admin, admin, etc.) → unrestricted, show everything.
        if ($this->accessControl->hasGlobalScopeRole($user)) {
            return null;
        }

        $assignments = UserRoleAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->where('scope_type', '!=', 'global')
            ->get(['scope_type', 'outlet_id', 'outlet_department_id', 'warehouse_id']);

        return [
            'outlet'     => $assignments->whereNotNull('outlet_id')->pluck('outlet_id')->unique()->filter()->values()->toArray(),
            'department' => $assignments->whereNotNull('outlet_department_id')->pluck('outlet_department_id')->unique()->filter()->values()->toArray(),
            'warehouse'  => $assignments->whereNotNull('warehouse_id')->pluck('warehouse_id')->unique()->filter()->values()->toArray(),
        ];
    }

    /**
     * @return array<int, array{id: string, name: string}>
     */
    private function sharedOutlets(Request $request): array
    {
        if (! $request->user() || ! Schema::hasTable('outlets')) {
            return [];
        }

        if (! Schema::hasColumns('outlets', ['id', 'name'])) {
            return [];
        }

        $allowed = $this->allowedScopeIds($request);

        return DB::table('outlets')
            ->when($allowed !== null, function ($q) use ($allowed) {
                $outletIdsFromDepts = Schema::hasTable('outlet_departments') && count($allowed['department']) > 0
                    ? DB::table('outlet_departments')->whereIn('id', $allowed['department'])->pluck('outlet_id')->toArray()
                    : [];
                $outletIdsFromWarehouses = count($allowed['warehouse']) > 0
                    ? DB::table('warehouses')->whereIn('id', $allowed['warehouse'])->pluck('outlet_id')->toArray()
                    : [];
                $q->whereIn('id', array_unique(array_merge($allowed['outlet'], $outletIdsFromDepts, $outletIdsFromWarehouses)));
            })
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($outlet) => [
                'id'   => (string) ($outlet->id ?? ''),
                'name' => (string) ($outlet->name ?? ''),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: string, outlet_id: string, name: string}>
     */
    private function sharedWarehouses(Request $request): array
    {
        if (! $request->user() || ! Schema::hasTable('warehouses')) {
            return [];
        }

        if (! Schema::hasColumns('warehouses', ['id', 'outlet_id', 'name'])) {
            return [];
        }

        $allowed = $this->allowedScopeIds($request);

        return DB::table('warehouses')
            ->when($allowed !== null, function ($q) use ($allowed) {
                $q->where(function ($q2) use ($allowed) {
                    $q2->whereIn('outlet_id', $allowed['outlet'])
                        ->orWhereIn('outlet_department_id', $allowed['department'])
                        ->orWhereIn('id', $allowed['warehouse']);
                });
            })
            ->orderBy('name')
            ->get(['id', 'outlet_id', 'name'])
            ->map(fn ($warehouse) => [
                'id'        => (string) ($warehouse->id ?? ''),
                'outlet_id' => (string) ($warehouse->outlet_id ?? ''),
                'name'      => (string) ($warehouse->name ?? ''),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function nodeSelection(Request $request): array
    {
        if (! $request->user()) {
            return $this->emptyNodeSelection();
        }

        if (! Schema::hasTable('warehouses') || ! Schema::hasTable('outlets')) {
            return [...$this->emptyNodeSelection(), 'setup_completed' => true, 'selection_url' => '/scope-selection'];
        }

        if (! Schema::hasColumns('warehouses', ['id', 'name', 'type', 'outlet_id']) || ! Schema::hasColumns('outlets', ['id', 'name'])) {
            return [...$this->emptyNodeSelection(), 'setup_completed' => true, 'selection_url' => '/scope-selection'];
        }

        $user            = $request->user();
        $canSelectGlobal = $user && $this->accessControl->hasGlobalScopeRole($user);
        $allowed         = $this->allowedScopeIds($request);

        // --- Compute allowed outlet IDs (direct + via dept/warehouse) ---
        $allAllowedOutletIds = null;
        if ($allowed !== null) {
            $outletIdsFromDepts = Schema::hasTable('outlet_departments') && count($allowed['department']) > 0
                ? DB::table('outlet_departments')->whereIn('id', $allowed['department'])->pluck('outlet_id')->toArray()
                : [];
            $outletIdsFromWarehouses = count($allowed['warehouse']) > 0
                ? DB::table('warehouses')->whereIn('id', $allowed['warehouse'])->whereNotNull('outlet_id')->pluck('outlet_id')->toArray()
                : [];
            $allAllowedOutletIds = array_unique(array_merge($allowed['outlet'], $outletIdsFromDepts, $outletIdsFromWarehouses));
        }

        // --- Direct-assignment IDs for selectability flags ---
        $directOutletIds = [];
        $directDeptIds   = [];

        if ($allowed !== null) {
            $rawAssignments = UserRoleAssignment::where('user_id', $user->id)
                ->where('is_active', true)
                ->get(['scope_type', 'outlet_id', 'outlet_department_id']);

            $directOutletIds = $rawAssignments
                ->where('scope_type', 'outlet')
                ->whereNotNull('outlet_id')
                ->pluck('outlet_id')
                ->map(fn ($id) => (int) $id)
                ->unique()->values()->toArray();

            $directDeptIds = $rawAssignments
                ->where('scope_type', 'outlet_department')
                ->whereNotNull('outlet_department_id')
                ->pluck('outlet_department_id')
                ->map(fn ($id) => (int) $id)
                ->unique()->values()->toArray();
        }

        // --- Central warehouses ---
        $centralWarehouses = DB::table('warehouses')
            ->where('type', 'central')
            ->whereNull('deleted_at')
            ->when($allowed !== null, fn ($q) => $q->whereIn('id', $allowed['warehouse']))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($w) => ['id' => (string) $w->id, 'name' => (string) $w->name])
            ->values()
            ->all();

        // --- Outlets ---
        $outlets = DB::table('outlets')
            ->when($allAllowedOutletIds !== null, fn ($q) => $q->whereIn('id', $allAllowedOutletIds))
            ->orderBy('name')
            ->get(['id', 'name']);

        $outletIds = $outlets->pluck('id')->toArray();

        // --- Outlet-direct warehouses (type = 'outlet', no department) ---
        $outletWarehouses = count($outletIds) > 0
            ? DB::table('warehouses')
                ->where('type', 'outlet')
                ->whereIn('outlet_id', $outletIds)
                ->whereNull('outlet_department_id')
                ->whereNull('deleted_at')
                ->when($allowed !== null, fn ($q) => $q->where(function ($q2) use ($allowed) {
                    $q2->whereIn('outlet_id', $allowed['outlet'])->orWhereIn('id', $allowed['warehouse']);
                }))
                ->orderBy('name')
                ->get(['id', 'outlet_id', 'name'])
            : collect();

        // --- Departments and their warehouses ---
        $hasDeptTable = Schema::hasTable('outlet_departments');
        $depts        = collect();
        $deptWhs      = collect();

        if ($hasDeptTable && count($outletIds) > 0) {
            $depts = DB::table('outlet_departments')
                ->whereIn('outlet_id', $outletIds)
                ->whereNull('deleted_at')
                ->when($allowed !== null, fn ($q) => $q->where(function ($q2) use ($allowed) {
                    $q2->whereIn('outlet_id', $allowed['outlet'])->orWhereIn('id', $allowed['department']);
                }))
                ->orderBy('name')
                ->get(['id', 'outlet_id', 'name']);

            $deptIds = $depts->pluck('id')->toArray();

            if (count($deptIds) > 0) {
                $deptWhs = DB::table('warehouses')
                    ->where('type', 'department')
                    ->whereIn('outlet_department_id', $deptIds)
                    ->whereNull('deleted_at')
                    ->when($allowed !== null, fn ($q) => $q->where(function ($q2) use ($allowed) {
                        $q2->whereIn('outlet_id', $allowed['outlet'])
                            ->orWhereIn('outlet_department_id', $allowed['department'])
                            ->orWhereIn('id', $allowed['warehouse']);
                    }))
                    ->orderBy('name')
                    ->get(['id', 'outlet_department_id', 'name']);
            }
        }

        // --- Group by parent ---
        $whByOutlet  = $outletWarehouses->groupBy('outlet_id');
        $deptByOutlet = $depts->groupBy('outlet_id');
        $whByDept    = $deptWhs->groupBy('outlet_department_id');

        $outletData = $outlets->map(function ($outlet) use ($whByOutlet, $deptByOutlet, $whByDept, $allowed, $directOutletIds, $directDeptIds) {
            $directWhs = ($whByOutlet[$outlet->id] ?? collect())
                ->map(fn ($w) => ['id' => (string) $w->id, 'name' => (string) $w->name])
                ->values()->all();

            $deptList = ($deptByOutlet[$outlet->id] ?? collect())->map(function ($dept) use ($whByDept, $allowed, $directDeptIds, $directOutletIds) {
                return [
                    'id'         => (string) $dept->id,
                    'name'       => (string) $dept->name,
                    'selectable' => $allowed === null
                        || in_array((int) $dept->id, $directDeptIds)
                        || in_array((int) $dept->outlet_id, $directOutletIds),
                    'warehouses' => ($whByDept[$dept->id] ?? collect())
                        ->map(fn ($w) => ['id' => (string) $w->id, 'name' => (string) $w->name])
                        ->values()->all(),
                ];
            })->values()->all();

            return [
                'id'          => (string) $outlet->id,
                'name'        => (string) $outlet->name,
                'selectable'  => $allowed === null || in_array((int) $outlet->id, $directOutletIds),
                'warehouses'  => $directWhs,
                'departments' => $deptList,
            ];
        })->values()->all();

        // --- Current session state ---
        $currentScopeType   = (string) $request->session()->get('current_scope_type', '');
        $currentOutletId    = (string) $request->session()->get('current_outlet_id', '');
        $currentDeptId      = (string) $request->session()->get('current_department_id', '');
        $currentNodeId      = (string) $request->session()->get('current_node_id', '');
        $currentLabel       = $this->resolveCurrentLabel($currentScopeType, $currentOutletId, $currentDeptId, $currentNodeId);

        return [
            'setup_completed'      => true,
            'selection_url'        => '/scope-selection',
            'setup_url'            => null,
            'can_select_global'    => $canSelectGlobal,
            'current_scope_type'   => $currentScopeType ?: null,
            'current_outlet_id'    => $currentOutletId ?: null,
            'current_department_id'=> $currentDeptId ?: null,
            'current_node_id'      => $currentNodeId ?: null,
            'current_label'        => $currentLabel,
            'central_warehouses'   => $centralWarehouses,
            'outlets'              => $outletData,
        ];
    }

    private function resolveCurrentLabel(string $scopeType, string $outletId, string $deptId, string $nodeId): ?string
    {
        if ($scopeType === 'global') {
            return 'Global';
        }

        $outletName = $outletId ? DB::table('outlets')->where('id', $outletId)->value('name') : null;
        $deptName   = $deptId ? (Schema::hasTable('outlet_departments') ? DB::table('outlet_departments')->where('id', $deptId)->value('name') : null) : null;
        $whName     = $nodeId ? DB::table('warehouses')->where('id', $nodeId)->value('name') : null;

        return match ($scopeType) {
            'central_warehouse'    => $whName,
            'outlet'               => $outletName,
            'outlet_warehouse'     => implode(' / ', array_filter([$outletName, $whName])) ?: null,
            'outlet_department'    => implode(' / ', array_filter([$outletName, $deptName])) ?: null,
            'department_warehouse' => implode(' / ', array_filter([$outletName, $deptName, $whName])) ?: null,
            default                => null,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyNodeSelection(): array
    {
        return [
            'setup_completed'      => false,
            'selection_url'        => null,
            'setup_url'            => null,
            'can_select_global'    => false,
            'current_scope_type'   => null,
            'current_outlet_id'    => null,
            'current_department_id'=> null,
            'current_node_id'      => null,
            'current_label'        => null,
            'central_warehouses'   => [],
            'outlets'              => [],
        ];
    }
}
