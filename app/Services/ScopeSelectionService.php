<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\OutletDepartment;
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
        $scopeType  = $data['scope_type'];

        if ($scopeType === 'global') {
            if (! $this->accessControl->hasGlobalScopeRole($actor)) {
                throw ValidationException::withMessages(['scope_type' => 'You do not have permission to use global scope.']);
            }

            $request->session()->put('current_scope_type', 'global');
            $request->session()->forget(['current_outlet_id', 'current_department_id', 'current_node_id']);

            return $redirectTo;
        }

        if (! $this->accessControl->hasGlobalScopeRole($actor)) {
            $this->assertActorCanAccessScope($actor, $data);
        }

        match ($scopeType) {
            'central_warehouse'    => $this->storeCentralWarehouseScope($request, $data),
            'outlet'               => $this->storeOutletScope($request, $data),
            'outlet_warehouse'     => $this->storeOutletWarehouseScope($request, $data),
            'outlet_department'    => $this->storeOutletDepartmentScope($request, $data),
            'department_warehouse' => $this->storeDepartmentWarehouseScope($request, $data),
            default                => throw ValidationException::withMessages(['scope_type' => 'Invalid scope type.']),
        };

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
        $request->session()->forget('current_department_id');
        $request->session()->put('current_node_id', (string) $warehouse->getKey());

        return (string) ($data['redirect_to'] ?? '/dashboard');
    }

    private function storeCentralWarehouseScope(Request $request, array $data): void
    {
        $warehouseId = (string) ($data['warehouse_id'] ?? '');

        if ($warehouseId === '') {
            throw ValidationException::withMessages(['warehouse_id' => 'Please select a central warehouse.']);
        }

        $warehouse = Warehouse::query()->where('type', 'central')->find($warehouseId);

        if (! $warehouse) {
            throw ValidationException::withMessages(['warehouse_id' => 'The selected central warehouse is not available.']);
        }

        $request->session()->put('current_scope_type', 'central_warehouse');
        $request->session()->put('current_node_id', $warehouseId);
        $request->session()->forget(['current_outlet_id', 'current_department_id']);
    }

    private function storeOutletScope(Request $request, array $data): void
    {
        $outletId = (string) ($data['outlet_id'] ?? '');

        if ($outletId === '' || ! Outlet::query()->whereKey($outletId)->exists()) {
            throw ValidationException::withMessages(['outlet_id' => 'Please select a valid outlet.']);
        }

        $request->session()->put('current_scope_type', 'outlet');
        $request->session()->put('current_outlet_id', $outletId);
        $request->session()->forget(['current_department_id', 'current_node_id']);
    }

    private function storeOutletWarehouseScope(Request $request, array $data): void
    {
        $outletId    = (string) ($data['outlet_id'] ?? '');
        $warehouseId = (string) ($data['warehouse_id'] ?? '');

        if ($outletId === '' || $warehouseId === '') {
            throw ValidationException::withMessages(['warehouse_id' => 'Please select an outlet and warehouse.']);
        }

        $warehouse = Warehouse::query()->where('type', 'outlet')->where('outlet_id', $outletId)->find($warehouseId);

        if (! $warehouse) {
            throw ValidationException::withMessages(['warehouse_id' => 'The selected warehouse is not available for this outlet.']);
        }

        $request->session()->put('current_scope_type', 'outlet_warehouse');
        $request->session()->put('current_outlet_id', $outletId);
        $request->session()->put('current_node_id', $warehouseId);
        $request->session()->forget('current_department_id');
    }

    private function storeOutletDepartmentScope(Request $request, array $data): void
    {
        $outletId     = (string) ($data['outlet_id'] ?? '');
        $departmentId = (string) ($data['department_id'] ?? '');

        if ($outletId === '' || $departmentId === '') {
            throw ValidationException::withMessages(['department_id' => 'Please select an outlet and department.']);
        }

        if (! OutletDepartment::query()->whereKey($departmentId)->where('outlet_id', $outletId)->exists()) {
            throw ValidationException::withMessages(['department_id' => 'The selected department is not available.']);
        }

        $request->session()->put('current_scope_type', 'outlet_department');
        $request->session()->put('current_outlet_id', $outletId);
        $request->session()->put('current_department_id', $departmentId);
        $request->session()->forget('current_node_id');
    }

    private function storeDepartmentWarehouseScope(Request $request, array $data): void
    {
        $outletId     = (string) ($data['outlet_id'] ?? '');
        $departmentId = (string) ($data['department_id'] ?? '');
        $warehouseId  = (string) ($data['warehouse_id'] ?? '');

        if ($outletId === '' || $departmentId === '' || $warehouseId === '') {
            throw ValidationException::withMessages(['warehouse_id' => 'Please select an outlet, department, and warehouse.']);
        }

        $warehouse = Warehouse::query()->where('type', 'department')->where('outlet_department_id', $departmentId)->find($warehouseId);

        if (! $warehouse) {
            throw ValidationException::withMessages(['warehouse_id' => 'The selected warehouse is not available for this department.']);
        }

        $request->session()->put('current_scope_type', 'department_warehouse');
        $request->session()->put('current_outlet_id', $outletId);
        $request->session()->put('current_department_id', $departmentId);
        $request->session()->put('current_node_id', $warehouseId);
    }

    private function assertActorCanAccessScope(User $actor, array $data): void
    {
        $assignments = UserRoleAssignment::where('user_id', $actor->id)
            ->where('is_active', true)
            ->where('scope_type', '!=', 'global')
            ->get(['scope_type', 'outlet_id', 'outlet_department_id', 'warehouse_id']);

        $allowedOutletIds        = $assignments->where('scope_type', 'outlet')->whereNotNull('outlet_id')->pluck('outlet_id')->unique()->values()->toArray();
        $allowedOutletWhIds      = $assignments->where('scope_type', 'outlet_warehouse')->whereNotNull('warehouse_id')->pluck('warehouse_id')->unique()->values()->toArray();
        $allowedDeptIds          = $assignments->where('scope_type', 'outlet_department')->whereNotNull('outlet_department_id')->pluck('outlet_department_id')->unique()->values()->toArray();
        $allowedDeptWhIds        = $assignments->where('scope_type', 'department_warehouse')->whereNotNull('warehouse_id')->pluck('warehouse_id')->unique()->values()->toArray();
        $allowedCentralWhIds     = $assignments->where('scope_type', 'central_warehouse')->whereNotNull('warehouse_id')->pluck('warehouse_id')->unique()->values()->toArray();

        $outletId     = (int) ($data['outlet_id'] ?? 0);
        $departmentId = (int) ($data['department_id'] ?? 0);
        $warehouseId  = (int) ($data['warehouse_id'] ?? 0);

        $error = match ($data['scope_type']) {
            // strict: only a direct outlet assignment grants outlet scope
            'central_warehouse'    => ! in_array($warehouseId, $allowedCentralWhIds, true),
            'outlet'               => ! in_array($outletId, $allowedOutletIds, true),

            // sub-scopes: a parent-level assignment also grants access (containment is verified in the store* methods)
            'outlet_warehouse'     => ! in_array($warehouseId, $allowedOutletWhIds, true)   && ! in_array($outletId, $allowedOutletIds, true),
            'outlet_department'    => ! in_array($departmentId, $allowedDeptIds, true)       && ! in_array($outletId, $allowedOutletIds, true),
            'department_warehouse' => ! in_array($warehouseId, $allowedDeptWhIds, true)      && ! in_array($departmentId, $allowedDeptIds, true) && ! in_array($outletId, $allowedOutletIds, true),
            default                => true,
        };

        if ($error) {
            throw ValidationException::withMessages(['scope_type' => 'You do not have access to the selected scope.']);
        }
    }
}
