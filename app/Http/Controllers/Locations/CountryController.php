<?php

namespace App\Http\Controllers\Locations;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Locations\Country\StoreCountryRequest;
use App\Http\Requests\Locations\Country\UpdateCountryRequest;
use App\Http\Requests\Locations\ToggleActiveRequest;
use App\Models\Country;
use App\Services\CountryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CountryController extends Controller
{
    use ExtractsFilters;

    public function __construct(private CountryService $countryService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'is_active', 'per_page']);

        return Inertia::render('countries/index',
            $this->countryService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('countries/create');
    }

    public function store(StoreCountryRequest $request): RedirectResponse
    {
        $this->countryService->createCountry($request->validated());

        return redirect($request->input('_redirect', route('countries.index')))
            ->with('success', 'Country created successfully.');
    }

    public function edit(Country $country): Response
    {
        return Inertia::render('countries/edit', ['country' => $country]);
    }

    public function update(UpdateCountryRequest $request, Country $country): RedirectResponse
    {
        $this->countryService->updateCountry($country, $request->validated());

        return redirect()->route('countries.index')
            ->with('success', 'Country updated successfully.');
    }

    public function destroy(Country $country): RedirectResponse
    {
        $this->countryService->deleteCountry($country);

        return redirect()->route('countries.index')
            ->with('success', 'Country deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, Country $country): RedirectResponse
    {
        $this->countryService->toggleActive($country, $request->boolean('is_active'));

        return redirect()->route('countries.index')
            ->with('success', 'Country status updated.');
    }
}
