<?php

namespace App\Http\Controllers\DiningTables;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\DiningTables\StoreDiningTableRequest;
use App\Http\Requests\DiningTables\ToggleActiveRequest;
use App\Http\Requests\DiningTables\UpdateDiningTableRequest;
use App\Models\DiningTable;
use App\Services\AccessControlService;
use App\Services\DiningTableService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiningTableController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private DiningTableService $diningTableService,
        private AccessControlService $accessControl,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'outlet_id', 'dining_area_id', 'status', 'is_active', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('dining-tables/index',
            $this->diningTableService->getIndexData($filters, $scope));
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('dining-tables/create',
            $this->diningTableService->getCreateData($scope));
    }

    public function store(StoreDiningTableRequest $request): RedirectResponse
    {
        $this->diningTableService->createDiningTable($request->validated());

        return redirect($request->input('_redirect', route('dining-tables.index')))
            ->with('success', 'Dining table created successfully.');
    }

    public function edit(Request $request, DiningTable $diningTable): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('dining-tables/edit',
            $this->diningTableService->getEditData($diningTable, $scope));
    }

    public function update(UpdateDiningTableRequest $request, DiningTable $diningTable): RedirectResponse
    {
        $this->diningTableService->updateDiningTable($diningTable, $request->validated());

        return redirect()->route('dining-tables.index')
            ->with('success', 'Dining table updated successfully.');
    }

    public function destroy(DiningTable $diningTable): RedirectResponse
    {
        $this->diningTableService->deleteDiningTable($diningTable);

        return redirect()->route('dining-tables.index')
            ->with('success', 'Dining table deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, DiningTable $diningTable): RedirectResponse
    {
        $this->diningTableService->toggleActive($diningTable, $request->boolean('is_active'));

        return redirect()->route('dining-tables.index')
            ->with('success', 'Dining table status updated.');
    }
}
