<?php

namespace App\Services;

use App\Models\DiningArea;
use App\Models\DiningTable;
use App\Models\Outlet;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;

class DiningTableService
{
    use PaginatesQuery;

    public function getIndexData(array $filters, array $scope): array
    {
        $scopedOutletId = $this->outletIdFromScope($scope);

        $query = DiningTable::with(['outlet', 'diningArea'])
            ->when($scopedOutletId !== null, fn ($b) => $b->where('outlet_id', $scopedOutletId))
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $b->where(fn ($q) => $q
                    ->where('name', 'like', $search)
                    ->orWhere('code', 'like', $search));
            })
            ->when($scopedOutletId === null && $filters['outlet_id'] !== '', fn ($b) => $b->where('outlet_id', $filters['outlet_id']))
            ->when($filters['dining_area_id'] !== '', fn ($b) => $b->where('dining_area_id', $filters['dining_area_id']))
            ->when($filters['status'] !== '', fn ($b) => $b->where('status', $filters['status']))
            ->when($filters['is_active'] !== '', fn ($b) => $b->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('sort_order')
            ->orderBy('name');

        $diningTables = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();

        $outlets     = $this->scopeOutlets($scope);
        $diningAreas = DiningArea::when($scopedOutletId !== null, fn ($b) => $b->where('outlet_id', $scopedOutletId))
            ->orderBy('name')->get(['id', 'name', 'outlet_id']);

        return compact('diningTables', 'outlets', 'diningAreas', 'filters');
    }

    public function getCreateData(array $scope): array
    {
        $scopedOutletId = $this->outletIdFromScope($scope);

        $outlets     = $this->scopeOutlets($scope);
        $diningAreas = DiningArea::where('is_active', true)
            ->when($scopedOutletId !== null, fn ($b) => $b->where('outlet_id', $scopedOutletId))
            ->orderBy('name')->get(['id', 'name', 'outlet_id']);

        return compact('outlets', 'diningAreas');
    }

    public function getEditData(DiningTable $diningTable, array $scope): array
    {
        $scopedOutletId = $this->outletIdFromScope($scope);

        $outlets     = $this->scopeOutlets($scope);
        $diningAreas = DiningArea::where('is_active', true)
            ->when($scopedOutletId !== null, fn ($b) => $b->where('outlet_id', $scopedOutletId))
            ->orderBy('name')->get(['id', 'name', 'outlet_id']);

        return compact('diningTable', 'outlets', 'diningAreas');
    }

    public function getLayoutData(array $scope): array
    {
        $scopedOutletId = $this->outletIdFromScope($scope);

        $outlets = $this->scopeOutlets($scope);

        $diningAreas = DiningArea::where('is_active', true)
            ->when($scopedOutletId !== null, fn ($b) => $b->where('outlet_id', $scopedOutletId))
            ->orderBy('name')->get(['id', 'name', 'outlet_id', 'layout_width', 'layout_height']);

        $tables = DiningTable::where('is_active', true)
            ->when($scopedOutletId !== null, fn ($b) => $b->where('outlet_id', $scopedOutletId))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $scopedOutletId = $scopedOutletId ? (string) $scopedOutletId : null;

        return compact('outlets', 'diningAreas', 'tables', 'scopedOutletId');
    }

    public function createDiningTable(array $data): DiningTable
    {
        $data = $this->prepareData($data);

        return DiningTable::create($data);
    }

    public function updateDiningTable(DiningTable $diningTable, array $data): void
    {
        $data = $this->prepareData($data);

        $diningTable->update($data);
    }

    public function deleteDiningTable(DiningTable $diningTable): void
    {
        $diningTable->delete();
    }

    public function toggleActive(DiningTable $diningTable, bool $isActive): void
    {
        $diningTable->update(['is_active' => $isActive]);
    }

    public function updateLayout(int $outletId, int $diningAreaId, array $tables): void
    {
        $tableIds = array_column($tables, 'id');

        $validCount = DiningTable::where('outlet_id', $outletId)
            ->where('dining_area_id', $diningAreaId)
            ->whereIn('id', $tableIds)
            ->count();

        abort_if(
            $validCount !== count($tableIds),
            422,
            'One or more tables do not belong to the selected outlet or dining area.'
        );

        DB::transaction(function () use ($tables) {
            foreach ($tables as $tableData) {
                DiningTable::where('id', $tableData['id'])->update([
                    'position_x' => $tableData['position_x'],
                    'position_y' => $tableData['position_y'],
                    'width'      => $tableData['width'],
                    'height'     => $tableData['height'],
                    'rotation'   => $tableData['rotation'],
                ]);
            }
        });
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
