<?php

namespace App\Http\Controllers\Units;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ToggleActiveRequest;
use App\Http\Requests\Inventory\UnitConversion\StoreUnitConversionRequest;
use App\Http\Requests\Inventory\UnitConversion\UpdateUnitConversionRequest;
use App\Models\UnitConversion;
use App\Services\UnitConversionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitConversionController extends Controller
{
    use ExtractsFilters;

    public function __construct(private UnitConversionService $conversionService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['from_unit_id', 'to_unit_id', 'is_active', 'per_page']);

        return Inertia::render('unit-conversions/index',
            $this->conversionService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('unit-conversions/create',
            $this->conversionService->getCreateData());
    }

    public function store(StoreUnitConversionRequest $request): RedirectResponse
    {
        $this->conversionService->createConversion($request->validated());

        return redirect()->route('unit-conversions.index')
            ->with('success', 'Unit conversion created successfully.');
    }

    public function edit(UnitConversion $unitConversion): Response
    {
        return Inertia::render('unit-conversions/edit',
            $this->conversionService->getEditData($unitConversion));
    }

    public function update(UpdateUnitConversionRequest $request, UnitConversion $unitConversion): RedirectResponse
    {
        $this->conversionService->updateConversion($unitConversion, $request->validated());

        return redirect()->route('unit-conversions.index')
            ->with('success', 'Unit conversion updated successfully.');
    }

    public function destroy(UnitConversion $unitConversion): RedirectResponse
    {
        $this->conversionService->deleteConversion($unitConversion);

        return redirect()->route('unit-conversions.index')
            ->with('success', 'Unit conversion deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, UnitConversion $unitConversion): RedirectResponse
    {
        $this->conversionService->toggleActive($unitConversion, $request->boolean('is_active'));

        return redirect()->route('unit-conversions.index')
            ->with('success', 'Unit conversion status updated.');
    }
}
