<?php

namespace App\Services;

use App\Models\Unit;
use App\Models\UnitConversion;
use App\Services\Concerns\PaginatesQuery;

class UnitConversionService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = UnitConversion::with(['fromUnit', 'toUnit'])
            ->when($filters['from_unit_id'] !== '', fn ($b) => $b->where('from_unit_id', $filters['from_unit_id']))
            ->when($filters['to_unit_id'] !== '', fn ($b) => $b->where('to_unit_id', $filters['to_unit_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderByDesc('created_at');

        $conversions = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        return compact('conversions', 'filters');
    }

    public function getCreateData(): array
    {
        $units = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name', 'type']);

        return compact('units');
    }

    public function getEditData(UnitConversion $conversion): array
    {
        $units = Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name', 'type']);

        return compact('conversion', 'units');
    }

    public function createConversion(array $data): UnitConversion
    {
        return UnitConversion::create($data);
    }

    public function updateConversion(UnitConversion $conversion, array $data): void
    {
        $conversion->update($data);
    }

    public function deleteConversion(UnitConversion $conversion): void
    {
        $conversion->delete();
    }

    public function toggleActive(UnitConversion $conversion, bool $isActive): void
    {
        $conversion->update(['is_active' => $isActive]);
    }
}
