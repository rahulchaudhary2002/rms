<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ScopeSelectionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'scope_type' => ['required', 'string', 'in:outlet,warehouse'],
            'outlet_id' => ['nullable', 'required_if:scope_type,outlet'],
            'warehouse_id' => ['nullable', 'required_if:scope_type,warehouse'],
            'redirect_to' => ['nullable', 'string'],
        ]);

        $redirectTo = (string) ($validated['redirect_to'] ?? '/dashboard');

        if ($validated['scope_type'] === 'outlet') {
            $outletId = (string) ($validated['outlet_id'] ?? '');

            if ($outletId === '') {
                throw ValidationException::withMessages([
                    'outlet_id' => 'Please select an outlet.',
                ]);
            }

            if (! Schema::hasTable('outlets')) {
                throw ValidationException::withMessages([
                    'outlet_id' => 'Outlet data is not available yet.',
                ]);
            }

            $exists = Outlet::query()->whereKey($outletId)->exists();

            if (! $exists) {
                throw ValidationException::withMessages([
                    'outlet_id' => 'The selected outlet is not available.',
                ]);
            }

            $request->session()->put('current_scope_type', 'outlet');
            $request->session()->put('current_outlet_id', $outletId);
            $request->session()->forget('current_node_id');

            return redirect()->to($redirectTo);
        }

        $warehouseId = (string) ($validated['warehouse_id'] ?? '');

        if ($warehouseId === '') {
            throw ValidationException::withMessages([
                'warehouse_id' => 'Please select a warehouse.',
            ]);
        }

        if (! Schema::hasTable('warehouses')) {
            throw ValidationException::withMessages([
                'warehouse_id' => 'Warehouse data is not available yet.',
            ]);
        }

        $warehouse = Warehouse::query()
            ->select(['id', 'outlet_id'])
            ->whereKey($warehouseId)
            ->first();

        if ($warehouse === null) {
            throw ValidationException::withMessages([
                'warehouse_id' => 'The selected warehouse is not available.',
            ]);
        }

        $request->session()->put('current_scope_type', 'warehouse');
        $request->session()->put('current_node_id', (string) $warehouse->getKey());
        $request->session()->put('current_outlet_id', (string) ($warehouse->outlet_id ?? ''));

        return redirect()->to($redirectTo);
    }

    public function storeNode(Request $request): RedirectResponse
    {
        if (! Schema::hasTable('outlets') || ! Schema::hasTable('warehouses')) {
            throw ValidationException::withMessages([
                'create_warehouse_name' => 'Outlet and warehouse tables are not available yet. Please run migrations first.',
            ]);
        }

        $validated = $request->validate([
            'create_outlet_id' => ['nullable', 'integer', 'exists:outlets,id'],
            'create_outlet_name' => ['nullable', 'required_without:create_outlet_id', 'string', 'max:255'],
            'create_warehouse_name' => ['required', 'string', 'max:255'],
            'redirect_to' => ['nullable', 'string'],
        ]);

        $outlet = null;

        if (! empty($validated['create_outlet_id'])) {
            $outlet = Outlet::query()->find($validated['create_outlet_id']);
        }

        if ($outlet === null) {
            $outletName = trim((string) ($validated['create_outlet_name'] ?? ''));

            if ($outletName === '') {
                throw ValidationException::withMessages([
                    'create_outlet_name' => 'Please enter an outlet name.',
                ]);
            }

            $outlet = Outlet::query()->firstOrCreate([
                'name' => $outletName,
            ]);
        }

        $warehouseName = trim((string) $validated['create_warehouse_name']);

        if ($warehouseName === '') {
            throw ValidationException::withMessages([
                'create_warehouse_name' => 'Please enter a warehouse name.',
            ]);
        }

        $exists = Warehouse::query()
            ->where('outlet_id', $outlet->getKey())
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($warehouseName)])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'create_warehouse_name' => 'A warehouse with this name already exists in the selected outlet.',
            ]);
        }

        $warehouse = Warehouse::query()->create([
            'outlet_id' => $outlet->getKey(),
            'name' => $warehouseName,
        ]);

        $request->session()->put('current_scope_type', 'warehouse');
        $request->session()->put('current_outlet_id', (string) $outlet->getKey());
        $request->session()->put('current_node_id', (string) $warehouse->getKey());

        $redirectTo = (string) ($validated['redirect_to'] ?? '/dashboard');
        return redirect()->to($redirectTo);
    }
}
