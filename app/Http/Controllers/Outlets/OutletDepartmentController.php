<?php

namespace App\Http\Controllers\Outlets;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Outlets\StoreDepartmentRequest;
use App\Http\Requests\Outlets\ToggleActiveRequest;
use App\Http\Requests\Outlets\UpdateDepartmentRequest;
use App\Models\OutletDepartment;
use App\Services\OutletDepartmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutletDepartmentController extends Controller
{
    use ExtractsFilters;

    public function __construct(private OutletDepartmentService $departmentService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'outlet_id', 'type', 'is_active', 'per_page']);

        return Inertia::render('outlet-departments/index',
            $this->departmentService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('outlet-departments/create',
            $this->departmentService->getCreateData());
    }

    public function store(StoreDepartmentRequest $request): RedirectResponse
    {
        $this->departmentService->createDepartment($request->validated());

        return redirect($request->input('_redirect', route('outlet-departments.index')))
            ->with('success', 'Department created successfully.');
    }

    public function edit(OutletDepartment $outletDepartment): Response
    {
        return Inertia::render('outlet-departments/edit',
            $this->departmentService->getEditData($outletDepartment));
    }

    public function update(UpdateDepartmentRequest $request, OutletDepartment $outletDepartment): RedirectResponse
    {
        $this->departmentService->updateDepartment($outletDepartment, $request->validated());

        return redirect()->route('outlet-departments.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(OutletDepartment $outletDepartment): RedirectResponse
    {
        $this->departmentService->deleteDepartment($outletDepartment);

        return redirect()->route('outlet-departments.index')
            ->with('success', 'Department deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, OutletDepartment $outletDepartment): RedirectResponse
    {
        $this->departmentService->toggleActive($outletDepartment, $request->boolean('is_active'));

        return redirect()->route('outlet-departments.index')
            ->with('success', 'Department status updated.');
    }
}
