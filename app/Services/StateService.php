<?php

namespace App\Services;

use App\Models\Country;
use App\Models\State;
use App\Services\Concerns\PaginatesQuery;

class StateService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = State::query()
            ->with('country:id,name')
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('code', 'like', $search));
            })
            ->when($filters['country_id'] !== '', fn ($b) => $b->where('country_id', $filters['country_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $states    = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $countries = Country::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('states', 'countries', 'filters');
    }

    public function getCreateData(): array
    {
        $countries = Country::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('countries');
    }

    public function getEditData(State $state): array
    {
        $countries = Country::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('state', 'countries');
    }

    public function createState(array $data): State
    {
        return State::create($data);
    }

    public function updateState(State $state, array $data): void
    {
        $state->update($data);
    }

    public function deleteState(State $state): void
    {
        $state->delete();
    }

    public function toggleActive(State $state, bool $isActive): void
    {
        $state->update(['is_active' => $isActive]);
    }
}
