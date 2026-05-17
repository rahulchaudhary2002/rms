<?php

namespace App\Http\Controllers\Locations;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Locations\City\StoreCityRequest;
use App\Http\Requests\Locations\City\UpdateCityRequest;
use App\Http\Requests\Locations\ToggleActiveRequest;
use App\Models\City;
use App\Services\CityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CityController extends Controller
{
    use ExtractsFilters;

    public function __construct(private CityService $cityService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'country_id', 'state_id', 'is_active', 'per_page']);

        return Inertia::render('cities/index',
            $this->cityService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('cities/create',
            $this->cityService->getCreateData());
    }

    public function store(StoreCityRequest $request): RedirectResponse
    {
        $this->cityService->createCity($request->validated());

        return redirect($request->input('_redirect', route('cities.index')))
            ->with('success', 'City created successfully.');
    }

    public function edit(City $city): Response
    {
        return Inertia::render('cities/edit',
            $this->cityService->getEditData($city));
    }

    public function update(UpdateCityRequest $request, City $city): RedirectResponse
    {
        $this->cityService->updateCity($city, $request->validated());

        return redirect()->route('cities.index')
            ->with('success', 'City updated successfully.');
    }

    public function destroy(City $city): RedirectResponse
    {
        $this->cityService->deleteCity($city);

        return redirect()->route('cities.index')
            ->with('success', 'City deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, City $city): RedirectResponse
    {
        $this->cityService->toggleActive($city, $request->boolean('is_active'));

        return redirect()->route('cities.index')
            ->with('success', 'City status updated.');
    }
}
