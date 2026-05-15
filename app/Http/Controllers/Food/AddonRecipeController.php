<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Recipe\StoreAddonRecipeRequest;
use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\AddonRecipe;
use App\Services\FoodRecipeService;
use Illuminate\Http\RedirectResponse;

class AddonRecipeController extends Controller
{
    public function __construct(
        private FoodRecipeService $service,
    ) {}

    public function upsert(StoreAddonRecipeRequest $request, AddonGroup $addonGroup, Addon $addon): RedirectResponse
    {
        abort_unless($addon->addon_group_id === $addonGroup->id, 404);

        $this->service->upsertAddonRecipe($addon, $request->validated());

        return back()->with('success', 'Recipe saved.');
    }

    public function destroy(AddonGroup $addonGroup, Addon $addon, AddonRecipe $addonRecipe): RedirectResponse
    {
        abort_unless($addon->addon_group_id === $addonGroup->id, 404);
        abort_unless($addonRecipe->addon_id === $addon->id, 404);

        $this->service->deleteAddonRecipe($addonRecipe);

        return back()->with('success', 'Recipe item removed.');
    }

    public function upsertForAddon(StoreAddonRecipeRequest $request, Addon $addon): RedirectResponse
    {
        $this->service->upsertAddonRecipe($addon, $request->validated());

        return back()->with('success', 'Recipe saved.');
    }

    public function destroyForAddon(Addon $addon, AddonRecipe $addonRecipe): RedirectResponse
    {
        abort_unless($addonRecipe->addon_id === $addon->id, 404);

        $this->service->deleteAddonRecipe($addonRecipe);

        return back()->with('success', 'Recipe item removed.');
    }
}
