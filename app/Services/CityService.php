<?php

namespace App\Services;

use App\Models\City;
use App\Models\Country;
use App\Models\State;
use App\Services\Concerns\PaginatesQuery;

class CityService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = City::query()
            ->with(['country:id,name', 'state:id,name'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $b->where('name', 'like', '%'.$filters['search'].'%');
            })
            ->when($filters['country_id'] !== '', fn ($b) => $b->where('country_id', $filters['country_id']))
            ->when($filters['state_id'] !== '', fn ($b) => $b->where('state_id', $filters['state_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $cities    = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $countries = Country::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $states    = State::where('is_active', true)->orderBy('name')->get(['id', 'name', 'country_id']);

        return compact('cities', 'countries', 'states', 'filters');
    }

    public function getCreateData(): array
    {
        $countries = Country::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $states    = State::where('is_active', true)->orderBy('name')->get(['id', 'name', 'country_id']);

        return compact('countries', 'states');
    }

    public function getEditData(City $city): array
    {
        $countries = Country::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $states    = State::where('is_active', true)->orderBy('name')->get(['id', 'name', 'country_id']);

        return compact('city', 'countries', 'states');
    }

    public function createCity(array $data): City
    {
        return City::create($data);
    }

    public function updateCity(City $city, array $data): void
    {
        $city->update($data);
    }

    public function deleteCity(City $city): void
    {
        $city->delete();
    }

    public function toggleActive(City $city, bool $isActive): void
    {
        $city->update(['is_active' => $isActive]);
    }
}
