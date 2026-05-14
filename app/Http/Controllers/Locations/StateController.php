<?php

namespace App\Http\Controllers\Locations;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Locations\State\StoreStateRequest;
use App\Http\Requests\Locations\State\UpdateStateRequest;
use App\Http\Requests\Locations\ToggleActiveRequest;
use App\Models\State;
use App\Services\StateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StateController extends Controller
{
    use ExtractsFilters;

    public function __construct(private StateService $stateService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'country_id', 'is_active', 'per_page']);

        return Inertia::render('states/index',
            $this->stateService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('states/create',
            $this->stateService->getCreateData());
    }

    public function store(StoreStateRequest $request): RedirectResponse
    {
        $this->stateService->createState($request->validated());

        return redirect($request->input('_redirect', route('states.index')))
            ->with('success', 'State created successfully.');
    }

    public function edit(State $state): Response
    {
        return Inertia::render('states/edit',
            $this->stateService->getEditData($state));
    }

    public function update(UpdateStateRequest $request, State $state): RedirectResponse
    {
        $this->stateService->updateState($state, $request->validated());

        return redirect()->route('states.index')
            ->with('success', 'State updated successfully.');
    }

    public function destroy(State $state): RedirectResponse
    {
        $this->stateService->deleteState($state);

        return redirect()->route('states.index')
            ->with('success', 'State deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, State $state): RedirectResponse
    {
        $this->stateService->toggleActive($state, $request->boolean('is_active'));

        return redirect()->route('states.index')
            ->with('success', 'State status updated.');
    }
}
