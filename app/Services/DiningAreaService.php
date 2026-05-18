<?php

namespace App\Services;

use App\Models\DiningArea;
use App\Models\Outlet;
use App\Services\Concerns\PaginatesQuery;

class DiningAreaService
{
    use PaginatesQuery;

    public function getIndexData(array $filters, array $scope): array
    {
        $scopedOutletId = $this->outletIdFromScope($scope);

        $query = DiningArea::with('outlet')
            ->when($scopedOutletId !== null, fn ($b) => $b->where('outlet_id', $scopedOutletId))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q
                    ->where('name', 'like', $search)
                    ->orWhere('code', 'like', $search));
            })
            ->when($scopedOutletId === null && $filters['outlet_id'] !== '', fn ($b) => $b->where('outlet_id', $filters['outlet_id']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('sort_order')
            ->orderBy('name');

        $diningAreas = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $outlets = $this->scopeOutlets($scope);

        return compact('diningAreas', 'outlets', 'filters');
    }

    public function getCreateData(array $scope): array
    {
        $outlets = $this->scopeOutlets($scope);

        return compact('outlets');
    }

    public function getEditData(DiningArea $diningArea, array $scope): array
    {
        $outlets = $this->scopeOutlets($scope);

        return compact('diningArea', 'outlets');
    }

    public function createDiningArea(array $data): DiningArea
    {
        $data = $this->prepareData($data);

        return DiningArea::create($data);
    }

    public function updateDiningArea(DiningArea $diningArea, array $data): void
    {
        $data = $this->prepareData($data);

        $diningArea->update($data);
    }

    public function deleteDiningArea(DiningArea $diningArea): void
    {
        abort_if(
            $diningArea->diningTables()->exists(),
            422,
            'Cannot delete dining area while it has dining tables assigned.'
        );

        $diningArea->delete();
    }

    public function toggleActive(DiningArea $diningArea, bool $isActive): void
    {
        $diningArea->update(['is_active' => $isActive]);
    }

    private function scopeOutlets(array $scope): \Illuminate\Database\Eloquent\Collection
    {
        $outletId = $this->outletIdFromScope($scope);

        if ($outletId !== null) {
            return Outlet::where('id', $outletId)->get(['id', 'name']);
        }

        return Outlet::orderBy('name')->get(['id', 'name']);
    }

    private function outletIdFromScope(array $scope): ?int
    {
        return isset($scope['outlet_id']) && $scope['outlet_id'] !== null
            ? (int) $scope['outlet_id']
            : null;
    }

    private function prepareData(array $data): array
    {
        if (empty($data['code'])) {
            $data['code'] = null;
        }

        return $data;
    }
}
