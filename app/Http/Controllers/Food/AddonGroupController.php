<?php

namespace App\Http\Controllers\Food;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Food\AddonGroup\StoreAddonGroupRequest;
use App\Http\Requests\Food\AddonGroup\UpdateAddonGroupRequest;
use App\Models\AddonGroup;
use App\Services\AddonGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AddonGroupController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AddonGroupService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'is_active', 'per_page']);

        return Inertia::render('food/addon-groups/index', $this->service->list($filters));
    }

    public function create(): Response
    {
        return Inertia::render('food/addon-groups/create');
    }

    public function store(StoreAddonGroupRequest $request): RedirectResponse
    {
        $group = $this->service->create(
            $request->validated() + ['is_active' => $request->boolean('is_active', true)]
        );

        return redirect($request->input('_redirect', route('addon-groups.show', $group)))
            ->with('success', 'Add-on group created successfully.');
    }

    public function show(AddonGroup $addonGroup): Response
    {
        return Inertia::render('food/addon-groups/show', [
            'group' => $this->service->find($addonGroup->id),
        ]);
    }

    public function edit(AddonGroup $addonGroup): Response
    {
        return Inertia::render('food/addon-groups/edit', [
            'group' => $this->service->find($addonGroup->id),
        ]);
    }

    public function update(UpdateAddonGroupRequest $request, AddonGroup $addonGroup): RedirectResponse
    {
        $this->service->update(
            $addonGroup,
            $request->validated() + ['is_active' => $request->boolean('is_active', true)]
        );

        return redirect()->route('addon-groups.show', $addonGroup)
            ->with('success', 'Add-on group updated.');
    }

    public function destroy(AddonGroup $addonGroup): RedirectResponse
    {
        $this->service->delete($addonGroup);

        return redirect()->route('addon-groups.index')
            ->with('success', 'Add-on group deleted.');
    }

    public function toggleStatus(AddonGroup $addonGroup): RedirectResponse
    {
        $this->service->toggleStatus($addonGroup);

        return back()->with('success', 'Add-on group status updated.');
    }
}
