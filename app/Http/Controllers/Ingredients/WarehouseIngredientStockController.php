<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseIngredientStock;
use App\Services\AccessControlService;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseIngredientStockController extends Controller
{
    use ExtractsFilters, PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $filters      = $this->extractFilters($request, ['search', 'warehouse_id', 'per_page']);
        $scope        = $this->accessControl->resolveSessionScope($request);
        $warehouseIds = $this->warehouseIdsForScope($scope);

        $query = WarehouseIngredientStock::with(['warehouse', 'ingredient.baseUnit'])
            ->when($warehouseIds !== null, fn ($q) => $q->whereIn('warehouse_id', $warehouseIds))
            ->when($filters['warehouse_id'] !== '', fn ($q) => $q->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['search'] !== '', fn ($q) => $q->whereHas('ingredient', fn ($iq) => $iq->where('name', 'like', "%{$filters['search']}%")));

        $warehouses = $warehouseIds !== null
            ? Warehouse::whereIn('id', $warehouseIds)->orderBy('name')->get(['id', 'name'])
            : Warehouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('warehouse-ingredient-stocks/index', [
            'stocks'     => $query->orderBy('ingredient_id')->paginate($this->perPage($query, $filters['per_page']))->withQueryString(),
            'warehouses' => $warehouses,
            'filters'    => $filters,
        ]);
    }
}
