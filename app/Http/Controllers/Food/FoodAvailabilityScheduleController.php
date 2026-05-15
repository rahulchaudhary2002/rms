<?php

namespace App\Http\Controllers\Food;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Schedule\StoreFoodScheduleRequest;
use App\Models\Food;
use App\Models\FoodAvailabilitySchedule;
use App\Services\FoodAvailabilityService;
use Illuminate\Http\RedirectResponse;

class FoodAvailabilityScheduleController extends Controller
{
    public function __construct(
        private FoodAvailabilityService $service,
    ) {}

    public function upsert(StoreFoodScheduleRequest $request, Food $food): RedirectResponse
    {
        $this->service->upsertSchedule($food, $request->validated());

        return back()->with('success', 'Schedule saved.');
    }

    public function destroy(Food $food, FoodAvailabilitySchedule $schedule): RedirectResponse
    {
        abort_unless($schedule->food_id === $food->id, 404);

        $this->service->deleteSchedule($schedule);

        return back()->with('success', 'Schedule removed.');
    }
}
