<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OutletController extends Controller
{
    public function store(Request $request): JsonResponse
    {
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
