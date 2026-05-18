<?php

namespace App\Http\Controllers\DiningTables;

use App\Http\Controllers\Controller;
use App\Http\Requests\DiningTables\UpdateLayoutRequest;
use App\Services\AccessControlService;
use App\Services\DiningTableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiningTableLayoutController extends Controller
{
    public function __construct(
        private DiningTableService $diningTableService,
        private AccessControlService $accessControl,
    ) {}

    public function index(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('dining-tables/layout',
            $this->diningTableService->getLayoutData($scope));
    }

    public function update(UpdateLayoutRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $this->diningTableService->updateLayout(
            (int) $validated['outlet_id'],
            (int) $validated['dining_area_id'],
            $validated['tables']
        );

        return response()->json(['message' => 'Layout saved successfully.']);
    }
}
