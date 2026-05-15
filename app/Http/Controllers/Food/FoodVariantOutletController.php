<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\UpsertOutletPriceRequest;
use App\Models\Food;
use App\Models\FoodVariant;
use App\Services\FoodVariantService;
use Illuminate\Http\RedirectResponse;

class FoodVariantOutletController extends Controller
{
    public function __construct(
        private FoodVariantService $service,
    ) {}

    public function upsert(UpsertOutletPriceRequest $request, Food $food, FoodVariant $foodVariant): RedirectResponse
    {
        abort_unless($foodVariant->food_id === $food->id, 404);

        $data     = $request->validated();
        $outletId = (int) $data['outlet_id'];

        $this->service->upsertOutletPrice($foodVariant, $outletId, $data);

        return back()->with('success', 'Variant outlet price saved.');
    }
}
