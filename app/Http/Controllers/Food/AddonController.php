<?php

namespace App\Http\Controllers\Food;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Addon\StoreAddonRequest;
use App\Http\Requests\Food\Addon\UpdateAddonRequest;
use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Services\AddonGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AddonController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AddonGroupService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'is_active', 'per_page']);

        return Inertia::render('food/addons/index', $this->service->listAddons($filters));
    }

    public function create(): Response
    {
        return Inertia::render('food/addons/create', [
            'groups' => AddonGroup::orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreAddonRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $addon = $this->service->createAddon($data);

        return redirect($request->input('_redirect', route('addons.show', $addon)))
            ->with('success', 'Add-on created.');
    }

    public function show(Addon $addon): Response
    {
        return Inertia::render('food/addons/show', [
            'addon'       => $this->service->findAddon($addon->id),
            'ingredients' => Ingredient::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'units'       => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']),
        ]);
    }

    public function edit(Addon $addon): Response
    {
        return Inertia::render('food/addons/edit', [
            'addon'  => $this->service->findAddon($addon->id),
            'groups' => AddonGroup::orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateAddonRequest $request, Addon $addon): RedirectResponse
    {
        $data = $request->validated();
        $this->service->updateAddon($addon, $data);

        return redirect()->route('addons.show', $addon)
            ->with('success', 'Add-on updated.');
    }

    public function destroy(Addon $addon): RedirectResponse
    {
        $this->service->deleteAddon($addon);

        return redirect()->route('addons.index')
            ->with('success', 'Add-on deleted.');
    }

    public function toggleStatus(Addon $addon): RedirectResponse
    {
        $this->service->toggleAddonStatus($addon);

        return back()->with('success', 'Add-on status updated.');
    }

    public function storeForGroup(StoreAddonRequest $request, AddonGroup $addonGroup): RedirectResponse
    {
        $addon = $this->service->createAddon($request->validated() + ['addon_group_id' => $addonGroup->id]);

        return redirect($request->input('_redirect', route('addons.show', $addon)))
            ->with('success', 'Add-on created.');
    }

    public function updateForGroup(UpdateAddonRequest $request, AddonGroup $addonGroup, Addon $addon): RedirectResponse
    {
        abort_unless($addon->addon_group_id === $addonGroup->id, 404);

        $this->service->updateAddon($addon, $request->validated() + ['addon_group_id' => $addonGroup->id]);

        return back()->with('success', 'Add-on updated.');
    }

    public function destroyForGroup(AddonGroup $addonGroup, Addon $addon): RedirectResponse
    {
        abort_unless($addon->addon_group_id === $addonGroup->id, 404);

        $this->service->deleteAddon($addon);

        return back()->with('success', 'Add-on deleted.');
    }
}
