<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\UpsertOutletPriceRequest;
use App\Models\Food;
use App\Services\FoodService;
use Illuminate\Http\RedirectResponse;

class FoodOutletController extends Controller
{
    public function __construct(
        private FoodService $service,
    ) {}

    public function upsert(UpsertOutletPriceRequest $request, Food $food): RedirectResponse
    {
        $data     = $request->validated();
        $outletId = (int) $data['outlet_id'];

        $this->service->upsertOutletPrice($food, $outletId, $data);

        return back()->with('success', 'Outlet price saved.');
    }
}
