<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Services\AccessControlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WarehouseController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $this->accessControl->isSuperAdmin($user) && ! $this->accessControl->userHasPermission($user, 'warehouses-create')) {
            abort(403, 'You do not have permission to create warehouses.');
        }

        $validated = $request->validate([
            'outlet_id' => ['required', 'integer', 'exists:outlets,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('warehouses', 'name')->where('outlet_id', $request->integer('outlet_id')),
            ],
        ]);

        $warehouse = Warehouse::create([
            'outlet_id' => $validated['outlet_id'],
            'name' => $validated['name'],
        ]);

        return response()->json([
            'id' => (string) $warehouse->getKey(),
            'name' => $warehouse->name,
            'outlet_id' => (string) $warehouse->outlet_id,
        ], 201);
    }
}
