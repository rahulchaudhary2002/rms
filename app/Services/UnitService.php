<?php

namespace App\Services;

use App\Models\Unit;
use App\Services\Concerns\PaginatesQuery;

class UnitService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = Unit::query()
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q->where('name', 'like', $search)->orWhere('short_name', 'like', $search));
            })
            ->when($filters['type'] !== '', fn ($b) => $b->where('type', $filters['type']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('name');

        $units = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('units', 'filters');
    }

    public function createUnit(array $data): Unit
    {
        return Unit::create($data);
    }

    public function updateUnit(Unit $unit, array $data): void
    {
        $unit->update($data);
    }

    public function deleteUnit(Unit $unit): void
    {
        abort_if(
            $unit->ingredients()->exists(),
            422,
            'Cannot delete unit while it is assigned to ingredients.'
        );

        $unit->delete();
    }

    public function toggleActive(Unit $unit, bool $isActive): void
    {
        $unit->update(['is_active' => $isActive]);
    }
}
