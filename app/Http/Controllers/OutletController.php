<?php

namespace App\Http\Controllers;

use App\Http\Requests\Outlet\StoreOutletRequest;
use App\Services\OutletService;
use Illuminate\Http\JsonResponse;

class OutletController extends Controller
{
    public function __construct(private OutletService $outletService) {}

    public function store(StoreOutletRequest $request): JsonResponse
    {
        $outlet = $this->outletService->createOutlet($request->user(), $request->validated());

        return response()->json([
            'id'   => (string) $outlet->getKey(),
            'name' => $outlet->name,
        ], 201);
    }
}
