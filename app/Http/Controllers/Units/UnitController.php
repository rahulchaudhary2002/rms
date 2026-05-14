<?php

namespace App\Http\Controllers\Units;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Units\ToggleActiveRequest;
use App\Http\Requests\Units\Unit\StoreUnitRequest;
use App\Http\Requests\Units\Unit\UpdateUnitRequest;
use App\Models\Unit;
use App\Services\UnitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    use ExtractsFilters;

    public function __construct(private UnitService $unitService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'type', 'is_active', 'per_page']);

        return Inertia::render('units/index',
            $this->unitService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('units/create');
    }

    public function store(StoreUnitRequest $request): RedirectResponse
    {
        $this->unitService->createUnit($request->validated());

        return redirect($request->input('_redirect', route('units.index')))
            ->with('success', 'Unit created successfully.');
    }

    public function edit(Unit $unit): Response
    {
        return Inertia::render('units/edit', ['unit' => $unit]);
    }

    public function update(UpdateUnitRequest $request, Unit $unit): RedirectResponse
    {
        $this->unitService->updateUnit($unit, $request->validated());

        return redirect()->route('units.index')
            ->with('success', 'Unit updated successfully.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        $this->unitService->deleteUnit($unit);

        return redirect()->route('units.index')
            ->with('success', 'Unit deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, Unit $unit): RedirectResponse
    {
        $this->unitService->toggleActive($unit, $request->boolean('is_active'));

        return redirect()->route('units.index')
            ->with('success', 'Unit status updated.');
    }
}
