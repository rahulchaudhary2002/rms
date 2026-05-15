<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Variant\StoreFoodVariantRequest;
use App\Http\Requests\Food\Variant\UpdateFoodVariantRequest;
use App\Models\Food;
use App\Models\FoodVariant;
use App\Services\FoodVariantService;
use Illuminate\Http\RedirectResponse;

class FoodVariantController extends Controller
{
    public function __construct(
        private FoodVariantService $service,
    ) {}

    public function store(StoreFoodVariantRequest $request, Food $food): RedirectResponse
    {
        $this->service->create($food, $request->validated());

        return back()->with('success', 'Variant added successfully.');
    }

    public function update(UpdateFoodVariantRequest $request, Food $food, FoodVariant $foodVariant): RedirectResponse
    {
        abort_unless($foodVariant->food_id === $food->id, 404);

        $this->service->update($foodVariant, $request->validated());

        return back()->with('success', 'Variant updated.');
    }

    public function destroy(Food $food, FoodVariant $foodVariant): RedirectResponse
    {
        abort_unless($foodVariant->food_id === $food->id, 404);

        $this->service->delete($foodVariant);

        return back()->with('success', 'Variant deleted.');
    }

    public function toggleStatus(Food $food, FoodVariant $foodVariant): RedirectResponse
    {
        abort_unless($foodVariant->food_id === $food->id, 404);

        $this->service->toggleStatus($foodVariant);

        return back()->with('success', 'Variant status updated.');
    }
}
