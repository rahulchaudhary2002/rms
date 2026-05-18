<?php

namespace App\Http\Controllers\DiningAreas;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\DiningAreas\StoreDiningAreaRequest;
use App\Http\Requests\DiningAreas\ToggleActiveRequest;
use App\Http\Requests\DiningAreas\UpdateDiningAreaRequest;
use App\Models\DiningArea;
use App\Services\AccessControlService;
use App\Services\DiningAreaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiningAreaController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private DiningAreaService $diningAreaService,
        private AccessControlService $accessControl,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'outlet_id', 'is_active', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('dining-areas/index',
            $this->diningAreaService->getIndexData($filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('dining-areas/create',
            $this->diningAreaService->getCreateData($scope));
    }

    public function store(StoreDiningAreaRequest $request): RedirectResponse
    {
        $this->diningAreaService->createDiningArea($request->validated());

        return redirect($request->input('_redirect', route('dining-areas.index')))
            ->with('success', 'Dining area created successfully.');
    }

    public function edit(Request $request, DiningArea $diningArea): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('dining-areas/edit',
            $this->diningAreaService->getEditData($diningArea, $scope));
    }

    public function update(UpdateDiningAreaRequest $request, DiningArea $diningArea): RedirectResponse
    {
        $this->diningAreaService->updateDiningArea($diningArea, $request->validated());

        return redirect()->route('dining-areas.index')
            ->with('success', 'Dining area updated successfully.');
    }

    public function destroy(DiningArea $diningArea): RedirectResponse
    {
        $this->diningAreaService->deleteDiningArea($diningArea);

        return redirect()->route('dining-areas.index')
            ->with('success', 'Dining area deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, DiningArea $diningArea): RedirectResponse
    {
        $this->diningAreaService->toggleActive($diningArea, $request->boolean('is_active'));

        return redirect()->route('dining-areas.index')
            ->with('success', 'Dining area status updated.');
    }
}
