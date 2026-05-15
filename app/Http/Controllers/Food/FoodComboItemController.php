<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\ComboItem\StoreFoodComboItemRequest;
use App\Models\Food;
use App\Models\FoodComboItem;
use App\Services\FoodComboService;
use Illuminate\Http\RedirectResponse;

class FoodComboItemController extends Controller
{
    public function __construct(
        private FoodComboService $service,
    ) {}

    public function store(StoreFoodComboItemRequest $request, Food $food): RedirectResponse
    {
        $this->service->addComboItem($food, $request->validated());

        return back()->with('success', 'Combo item added.');
    }

    public function update(StoreFoodComboItemRequest $request, Food $food, FoodComboItem $comboItem): RedirectResponse
    {
        abort_unless($comboItem->combo_food_id === $food->id, 404);

        $this->service->updateComboItem($comboItem, $request->validated());

        return back()->with('success', 'Combo item updated.');
    }

    public function destroy(Food $food, FoodComboItem $comboItem): RedirectResponse
    {
        abort_unless($comboItem->combo_food_id === $food->id, 404);

        $this->service->removeComboItem($comboItem);

        return back()->with('success', 'Combo item removed.');
    }
}
