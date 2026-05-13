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

        [$scopeType, $scopeId] = $this->resolveCurrentScope($request);

        $permissions = $this->accessControl->getUserPermissions($user, $scopeType, $scopeId);
        $roles = $this->accessControl->getUserRoles($user, $scopeType, $scopeId)
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
     * @return array{0: string, 1: int|null}
     */
    private function resolveCurrentScope(Request $request): array
    {
        $scopeType = (string) $request->session()->get('current_scope_type', 'global');
        $nodeId = $request->session()->get('current_node_id');
        $outletId = $request->session()->get('current_outlet_id');

        if ($scopeType === 'warehouse' && $nodeId) {
            return ['warehouse', (int) $nodeId];
        }

        if ($scopeType === 'outlet' && $outletId) {
            return ['outlet', (int) $outletId];
        }

        return ['global', null];
    }

    /**
     * Returns allowed outlet/warehouse IDs for the user, or null if unrestricted (super admin).
     *
     * @return array{outlet: int[], warehouse: int[]}|null
     */
    private function allowedScopeIds(Request $request): ?array
    {
        $user = $request->user();

        if (! $user || $this->accessControl->isSuperAdmin($user)) {
            return null;
        }

        $assignments = UserRoleAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->whereIn('scope_type', ['outlet', 'warehouse'])
            ->get(['scope_type', 'scope_id']);

        return [
            'outlet'    => $assignments->where('scope_type', 'outlet')->pluck('scope_id')->unique()->filter()->values()->toArray(),
            'warehouse' => $assignments->where('scope_type', 'warehouse')->pluck('scope_id')->unique()->filter()->values()->toArray(),
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
                // Show outlets the user is directly assigned to, or that contain their assigned warehouses.
                $outletIdsFromWarehouses = DB::table('warehouses')
                    ->whereIn('id', $allowed['warehouse'])
                    ->pluck('outlet_id');

                $q->whereIn('id', array_merge($allowed['outlet'], $outletIdsFromWarehouses->toArray()));
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
                // Show warehouses in the user's assigned outlets, or directly assigned warehouses.
                $q->where(function ($q2) use ($allowed) {
                    $q2->whereIn('outlet_id', $allowed['outlet'])
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
            return [
                ...$this->emptyNodeSelection(),
                'setup_completed' => true,
                'selection_url' => '/scope-selection',
            ];
        }

        if (
            ! Schema::hasColumns('warehouses', ['id', 'name', 'outlet_id']) ||
            ! Schema::hasColumns('outlets', ['id', 'name'])
        ) {
            return [
                ...$this->emptyNodeSelection(),
                'setup_completed' => true,
                'selection_url' => '/scope-selection',
            ];
        }

        $allowed = $this->allowedScopeIds($request);

        // Get warehouses with their outlets, filtered by the user's allowed scopes.
        $warehouses = DB::table('warehouses')
            ->leftJoin('outlets', 'outlets.id', '=', 'warehouses.outlet_id')
            ->when($allowed !== null, function ($q) use ($allowed) {
                $q->where(function ($q2) use ($allowed) {
                    $q2->whereIn('warehouses.outlet_id', $allowed['outlet'])
                        ->orWhereIn('warehouses.id', $allowed['warehouse']);
                });
            })
            ->orderBy('outlets.name')
            ->orderBy('warehouses.name')
            ->get([
                'warehouses.id as id',
                'warehouses.name as node',
                'warehouses.outlet_id as outlet_id',
                'outlets.name as outlet',
            ]);

        // Get outlets without warehouses, filtered by the user's allowed scopes.
        $outlets = DB::table('outlets')
            ->whereNotIn('id', $warehouses->pluck('outlet_id')->filter())
            ->when($allowed !== null, fn ($q) => $q->whereIn('id', $allowed['outlet']))
            ->orderBy('name')
            ->get(['id', 'name']);

        // Build items array with warehouses
        $items = $warehouses
            ->map(fn ($warehouse) => [
                'id' => (string) ($warehouse->id ?? ''),
                'outlet_id' => (string) ($warehouse->outlet_id ?? ''),
                'outlet' => (string) ($warehouse->outlet ?? ''),
                'node' => (string) ($warehouse->node ?? ''),
            ])
            ->values()
            ->all();

        // Add outlets without warehouses as selectable items
        foreach ($outlets as $outlet) {
            $items[] = [
                'id' => '',
                'outlet_id' => (string) ($outlet->id ?? ''),
                'outlet' => (string) ($outlet->name ?? ''),
                'node' => 'All warehouses',
            ];
        }

        $currentScopeType = (string) $request->session()->get('current_scope_type', 'warehouse');
        $currentNodeId = (string) $request->session()->get('current_node_id', '');
        $currentOutletId = (string) $request->session()->get('current_outlet_id', '');

        $currentNode = $warehouses->first(fn ($warehouse) => (string) ($warehouse->id ?? '') === $currentNodeId);
        $currentOutlet = null;

        if ($currentNode !== null) {
            $currentScopeType = 'warehouse';
            $currentOutlet = (object) [
                'id' => (string) ($currentNode->outlet_id ?? ''),
                'name' => (string) ($currentNode->outlet ?? ''),
            ];
        } elseif ($currentOutletId !== '') {
            $outlet = DB::table('outlets')
                ->where('id', $currentOutletId)
                ->first(['id', 'name']);

            if ($outlet !== null) {
                $currentScopeType = 'outlet';
                $currentOutlet = $outlet;
            }
        }

        return [
            'setup_completed' => true,
            'selection_url' => '/scope-selection',
            'setup_url' => null,
            'current_scope_type' => $currentOutlet !== null ? $currentScopeType : null,
            'current_outlet_id' => $currentOutlet !== null ? (string) ($currentOutlet->id ?? '') : null,
            'current_outlet_label' => $currentOutlet !== null ? (string) ($currentOutlet->name ?? '') : null,
            'current_node_id' => $currentNode !== null ? (string) ($currentNode->id ?? '') : null,
            'current_node_label' => $currentNode !== null
                ? trim(implode(' / ', array_filter([
                    (string) ($currentNode->outlet ?? ''),
                    (string) ($currentNode->node ?? ''),
                ])))
                : null,
            'items' => $items,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyNodeSelection(): array
    {
        return [
            'setup_completed' => false,
            'selection_url' => null,
            'setup_url' => null,
            'current_scope_type' => null,
            'current_outlet_id' => null,
            'current_outlet_label' => null,
            'current_node_id' => null,
            'current_node_label' => null,
            'items' => [],
        ];
    }
}
