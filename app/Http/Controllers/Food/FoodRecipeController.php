<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Recipe\StoreFoodRecipeRequest;
use App\Models\Food;
use App\Models\FoodRecipe;
use App\Services\FoodRecipeService;
use Illuminate\Http\RedirectResponse;

class FoodRecipeController extends Controller
{
    public function __construct(
        private FoodRecipeService $service,
    ) {}

    public function upsert(StoreFoodRecipeRequest $request, Food $food): RedirectResponse
    {
        $data      = $request->validated();
        $variantId = isset($data['food_variant_id']) ? (int) $data['food_variant_id'] : null;

        $this->service->validateVariantBelongsToFood($food->id, $variantId);
        $this->service->upsertFoodRecipe($food, $data, $variantId);

        return back()->with('success', 'Recipe saved.');
    }

    public function destroy(Food $food, FoodRecipe $foodRecipe): RedirectResponse
    {
        abort_unless($foodRecipe->food_id === $food->id, 404);

        $this->service->deleteFoodRecipe($foodRecipe);

        return back()->with('success', 'Recipe item removed.');
    }
}
