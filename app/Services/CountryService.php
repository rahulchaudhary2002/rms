<?php

namespace App\Services;

use App\Models\Country;
use App\Services\Concerns\PaginatesQuery;

class CountryService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = Country::query()
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('code', 'like', $search));
            })
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $countries = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('countries', 'filters');
    }

    public function createCountry(array $data): Country
    {
        return Country::create($data);
    }

    public function updateCountry(Country $country, array $data): void
    {
        $country->update($data);
    }

    public function deleteCountry(Country $country): void
    {
        $country->delete();
    }

    public function toggleActive(Country $country, bool $isActive): void
    {
        $country->update(['is_active' => $isActive]);
    }
}
