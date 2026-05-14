<?php

namespace App\Http\Controllers;

use App\Http\Requests\Warehouse\StoreWarehouseRequest;
use App\Services\WarehouseService;
use Illuminate\Http\JsonResponse;

class WarehouseController extends Controller
{
    public function __construct(private WarehouseService $warehouseService) {}

    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $warehouse = $this->warehouseService->createWarehouse($request->user(), $request->validated());

        return response()->json([
            'id'        => (string) $warehouse->getKey(),
            'name'      => $warehouse->name,
            'outlet_id' => (string) $warehouse->outlet_id,
        ], 201);
    }
}
