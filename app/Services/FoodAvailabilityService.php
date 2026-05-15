<?php

namespace App\Services;

use App\Models\Food;
use App\Models\FoodAvailabilitySchedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FoodAvailabilityService
{
    public function isAvailableNow(Food $food, ?int $outletId = null): bool
    {
        if (! $food->is_active) {
            return false;
        }

        $now      = Carbon::now();
        $dayName  = strtolower($now->format('l'));
        $timeNow  = $now->format('H:i:s');

        $schedules = FoodAvailabilitySchedule::where('food_id', $food->id)
            ->where(fn ($q) => $q->whereNull('outlet_id')->orWhere('outlet_id', $outletId))
            ->where('day_of_week', $dayName)
            ->get();

        if ($schedules->isEmpty()) {
            return true;
        }

        foreach ($schedules as $schedule) {
            if (! $schedule->is_available) {
                continue;
            }

            if ($schedule->start_time === null && $schedule->end_time === null) {
                return true;
            }

            $start = $schedule->start_time ?? '00:00:00';
            $end   = $schedule->end_time   ?? '23:59:59';

            if ($timeNow >= $start && $timeNow <= $end) {
                return true;
            }
        }

        return false;
    }

    public function getSchedulesForFood(Food $food): \Illuminate\Database\Eloquent\Collection
    {
        return FoodAvailabilitySchedule::with('outlet:id,name')
            ->where('food_id', $food->id)
            ->orderByRaw("FIELD(day_of_week,'sunday','monday','tuesday','wednesday','thursday','friday','saturday')")
            ->orderBy('start_time')
            ->get();
    }

    public function upsertSchedule(Food $food, array $data): FoodAvailabilitySchedule
    {
        return FoodAvailabilitySchedule::updateOrCreate(
            [
                'food_id'     => $food->id,
                'outlet_id'   => $data['outlet_id'] ?? null,
                'day_of_week' => $data['day_of_week'],
                'start_time'  => $data['start_time'] ?? null,
                'end_time'    => $data['end_time'] ?? null,
            ],
            ['is_available' => $data['is_available'] ?? true]
        );
    }

    public function deleteSchedule(FoodAvailabilitySchedule $schedule): void
    {
        $schedule->delete();
    }

    public function syncSchedules(Food $food, array $schedules): void
    {
        DB::transaction(function () use ($food, $schedules) {
            FoodAvailabilitySchedule::where('food_id', $food->id)->delete();

            foreach ($schedules as $schedule) {
                FoodAvailabilitySchedule::create([
                    'food_id'     => $food->id,
                    'outlet_id'   => $schedule['outlet_id'] ?? null,
                    'day_of_week' => $schedule['day_of_week'],
                    'start_time'  => $schedule['start_time'] ?? null,
                    'end_time'    => $schedule['end_time'] ?? null,
                    'is_available' => $schedule['is_available'] ?? true,
                ]);
            }
        });
    }
}
