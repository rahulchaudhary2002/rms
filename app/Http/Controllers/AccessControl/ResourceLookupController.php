<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use App\Services\ResourceLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceLookupController extends Controller
{
    public function __construct(private ResourceLookupService $lookupService) {}

    public function index(Request $request): JsonResponse
    {
        $type       = $request->string('type')->toString();
        $search     = $request->string('search')->toString();
        $page       = max((int) $request->input('page', 1), 1);
        $allowedIds = $request->filled('allowed_ids')
            ? array_map('intval', explode(',', $request->string('allowed_ids')->toString()))
            : null;

        return response()->json($this->lookupService->lookup($type, $search, $page, $allowedIds));
    }
}
