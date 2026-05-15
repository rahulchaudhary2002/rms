<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\User;
use App\Models\UserRoleAssignment;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ScopeSelectionService
{
    public function __construct(private AccessControlService $accessControl) {}

    public function selectScope(Request $request, User $actor, array $data): string
    {
        $redirectTo = (string) ($data['redirect_to'] ?? '/dashboard');

        if (! $this->accessControl->hasGlobalScopeRole($actor)) {
            $this->assertActorCanAccessScope($actor, $data);
        }

        if ($data['scope_type'] === 'global') {
            if (! $this->accessControl->hasGlobalScopeRole($actor)) {
                throw ValidationException::withMessages(['scope_type' => 'You do not have permission to use global scope.']);
            }

            $request->session()->put('current_scope_type', 'global');
            $request->session()->forget('current_outlet_id');
            $request->session()->forget('current_node_id');

            return $redirectTo;
        }

        if ($data['scope_type'] === 'outlet') {
            $outletId = (string) ($data['outlet_id'] ?? '');

            if ($outletId === '') {
                throw ValidationException::withMessages(['outlet_id' => 'Please select an outlet.']);
            }

            if (! Schema::hasTable('outlets')) {
                throw ValidationException::withMessages(['outlet_id' => 'Outlet data is not available yet.']);
            }

            if (! Outlet::query()->whereKey($outletId)->exists()) {
                throw ValidationException::withMessages(['outlet_id' => 'The selected outlet is not available.']);
            }

            $request->session()->put('current_scope_type', 'outlet');
            $request->session()->put('current_outlet_id', $outletId);
            $request->session()->forget('current_node_id');

            return $redirectTo;
        }

        $warehouseId = (string) ($data['warehouse_id'] ?? '');

        if ($warehouseId === '') {
            throw ValidationException::withMessages(['warehouse_id' => 'Please select a warehouse.']);
        }

        if (! Schema::hasTable('warehouses')) {
            throw ValidationException::withMessages(['warehouse_id' => 'Warehouse data is not available yet.']);
        }

        $warehouse = Warehouse::query()->select(['id', 'outlet_id'])->whereKey($warehouseId)->first();

        if ($warehouse === null) {
            throw ValidationException::withMessages(['warehouse_id' => 'The selected warehouse is not available.']);
        }

        $request->session()->put('current_scope_type', 'warehouse');
        $request->session()->put('current_node_id', (string) $warehouse->getKey());
        $request->session()->put('current_outlet_id', (string) ($warehouse->outlet_id ?? ''));

        return $redirectTo;
    }

    public function createNode(Request $request, User $actor, array $data): string
    {
        if (! $this->accessControl->isSuperAdmin($actor) && ! $this->accessControl->userHasPermission($actor, 'warehouses-create')) {
            abort(403, 'You do not have permission to register warehouses.');
        }

        if (! Schema::hasTable('outlets') || ! Schema::hasTable('warehouses')) {
            throw ValidationException::withMessages([
                'create_warehouse_name' => 'Outlet and warehouse tables are not available yet. Please run migrations first.',
            ]);
        }

        $outlet = null;

        if (! empty($data['create_outlet_id'])) {
            $outlet = Outlet::query()->find($data['create_outlet_id']);
        }

        if ($outlet === null) {
            if (! $this->accessControl->isSuperAdmin($actor) && ! $this->accessControl->userHasPermission($actor, 'outlets-create')) {
                throw ValidationException::withMessages([
                    'create_outlet_name' => 'You do not have permission to create outlets.',
                ]);
            }

            $outletName = trim((string) ($data['create_outlet_name'] ?? ''));

            if ($outletName === '') {
                throw ValidationException::withMessages(['create_outlet_name' => 'Please enter an outlet name.']);
            }

            $outlet = Outlet::query()->firstOrCreate(['name' => $outletName]);
        }

        $warehouseName = trim((string) $data['create_warehouse_name']);

        if ($warehouseName === '') {
            throw ValidationException::withMessages(['create_warehouse_name' => 'Please enter a warehouse name.']);
        }

        if (Warehouse::query()->where('outlet_id', $outlet->getKey())->whereRaw('LOWER(name) = ?', [mb_strtolower($warehouseName)])->exists()) {
            throw ValidationException::withMessages([
                'create_warehouse_name' => 'A warehouse with this name already exists in the selected outlet.',
            ]);
        }

        $warehouse = Warehouse::query()->create([
            'outlet_id' => $outlet->getKey(),
            'name'      => $warehouseName,
        ]);

        $request->session()->put('current_scope_type', 'warehouse');
        $request->session()->put('current_outlet_id', (string) $outlet->getKey());
        $request->session()->put('current_node_id', (string) $warehouse->getKey());

        return (string) ($data['redirect_to'] ?? '/dashboard');
    }

    private function assertActorCanAccessScope(User $actor, array $data): void
    {
        $assignments = UserRoleAssignment::where('user_id', $actor->id)
            ->where('is_active', true)
            ->where('scope_type', '!=', 'global')
            ->get(['scope_type', 'outlet_id', 'warehouse_id']);

        $allowedOutletIds    = $assignments->whereNotNull('outlet_id')->pluck('outlet_id')->toArray();
        $allowedWarehouseIds = $assignments->whereNotNull('warehouse_id')->pluck('warehouse_id')->toArray();

        if ($data['scope_type'] === 'outlet') {
            if (! in_array((int) ($data['outlet_id'] ?? 0), $allowedOutletIds, true)) {
                throw ValidationException::withMessages([
                    'outlet_id' => 'You do not have access to the selected outlet.',
                ]);
            }
        } else {
            $warehouse         = Warehouse::query()->select(['id', 'outlet_id'])->find($data['warehouse_id'] ?? null);
            $inDirectWarehouse = in_array((int) ($data['warehouse_id'] ?? 0), $allowedWarehouseIds, true);
            $inOutletWarehouse = $warehouse && in_array((int) $warehouse->outlet_id, $allowedOutletIds, true);

            if (! $inDirectWarehouse && ! $inOutletWarehouse) {
                throw ValidationException::withMessages([
                    'warehouse_id' => 'You do not have access to the selected warehouse.',
                ]);
            }
        }
    }
}
