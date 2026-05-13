<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Services\AccessControlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OutletController extends Controller
{
    public function __construct(private AccessControlService $accessControl) {}

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $this->accessControl->isSuperAdmin($user) && ! $this->accessControl->userHasPermission($user, 'outlets-create')) {
            abort(403, 'You do not have permission to create outlets.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('outlets', 'name')],
        ]);

        $outlet = Outlet::create(['name' => $validated['name']]);

        return response()->json([
            'id' => (string) $outlet->getKey(),
            'name' => $outlet->name,
        ], 201);
    }
}
