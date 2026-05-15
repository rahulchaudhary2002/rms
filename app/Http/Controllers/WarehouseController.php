<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Requests\Warehouse\StoreWarehouseRequest;
use App\Http\Requests\Warehouse\ToggleActiveRequest;
use App\Http\Requests\Warehouse\UpdateWarehouseRequest;
use App\Models\Warehouse;
use App\Services\WarehouseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    use ExtractsFilters;

    public function __construct(private WarehouseService $warehouseService) {}

    public function index(\Illuminate\Http\Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'outlet_id', 'type', 'is_active', 'per_page']);

        return Inertia::render('warehouses/index',
            $this->warehouseService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('warehouses/create',
            $this->warehouseService->getCreateData());
    }

    public function store(StoreWarehouseRequest $request): JsonResponse|RedirectResponse
    {
        $warehouse = $this->warehouseService->createWarehouse($request->user(), $request->validated());

        if ($request->wantsJson()) {
            return response()->json([
                'id'        => (string) $warehouse->getKey(),
                'name'      => $warehouse->name,
                'outlet_id' => (string) $warehouse->outlet_id,
            ], 201);
        }

        return redirect()->route('warehouses.index')
            ->with('success', 'Warehouse created successfully.');
    }

    public function edit(Warehouse $warehouse): Response
    {
        return Inertia::render('warehouses/edit',
            $this->warehouseService->getEditData($warehouse));
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $this->warehouseService->updateWarehouse($warehouse, $request->validated());

        return redirect()->route('warehouses.index')
            ->with('success', 'Warehouse updated successfully.');
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $this->warehouseService->deleteWarehouse($warehouse);

        return redirect()->route('warehouses.index')
            ->with('success', 'Warehouse deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $this->warehouseService->toggleActive($warehouse, $request->boolean('is_active'));

        return back()->with('success', 'Warehouse status updated.');
    }
}
