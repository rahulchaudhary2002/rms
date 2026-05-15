<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Services\AddonGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FoodAddonGroupController extends Controller
{
    public function __construct(
        private AddonGroupService $service,
    ) {}

    public function sync(Request $request, Food $food): RedirectResponse
    {
        $request->validate([
            'addon_group_ids'   => ['present', 'array'],
            'addon_group_ids.*' => ['integer', 'exists:addon_groups,id'],
        ]);

        $this->service->syncFoodAddonGroups($food->id, $request->input('addon_group_ids', []));

        return back()->with('success', 'Add-on groups saved.');
    }

    public function attach(Request $request, Food $food): RedirectResponse
    {
        $request->validate([
            'addon_group_id' => ['required', 'integer', 'exists:addon_groups,id'],
        ]);

        $this->service->attachToFood($food->id, (int) $request->input('addon_group_id'));

        return back()->with('success', 'Add-on group attached.');
    }

    public function detach(Request $request, Food $food): RedirectResponse
    {
        $request->validate([
            'addon_group_id' => ['required', 'integer', 'exists:addon_groups,id'],
        ]);

        $this->service->detachFromFood($food->id, (int) $request->input('addon_group_id'));

        return back()->with('success', 'Add-on group removed.');
    }
}
