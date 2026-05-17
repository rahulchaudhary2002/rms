<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Models\IngredientInventoryTransaction;
use App\Models\Warehouse;
use App\Services\AccessControlService;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientInventoryTransactionController extends Controller
{
    use ExtractsFilters, PaginatesQuery;

    public function __construct(private AccessControlService $accessControl) {}

    public function index(Request $request): Response
    {
        $filters      = $this->extractFilters($request, ['search', 'warehouse_id', 'ingredient_id', 'transaction_type', 'per_page']);
        $scope        = $this->accessControl->resolveSessionScope($request);
        $warehouseIds = $this->warehouseIdsForScope($scope);

        $query = IngredientInventoryTransaction::with(['ingredient.baseUnit', 'warehouse', 'batch', 'createdBy'])
            ->when($warehouseIds !== null, fn ($q) => $q->whereIn('warehouse_id', $warehouseIds))
            ->when($filters['warehouse_id'] !== '', fn ($q) => $q->where('warehouse_id', $filters['warehouse_id']))
            ->when($filters['ingredient_id'] !== '', fn ($q) => $q->where('ingredient_id', $filters['ingredient_id']))
            ->when($filters['transaction_type'] !== '', fn ($q) => $q->where('transaction_type', $filters['transaction_type']))
            ->when($filters['search'] !== '', fn ($q) => $q->whereHas('ingredient', fn ($iq) => $iq->where('name', 'like', "%{$filters['search']}%")));

        $warehouses = $warehouseIds !== null
            ? Warehouse::whereIn('id', $warehouseIds)->orderBy('name')->get(['id', 'name'])
            : Warehouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('ingredient-inventory-transactions/index', [
            'transactions' => $query->orderByDesc('created_at')->paginate($this->perPage($query, $filters['per_page']))->withQueryString(),
            'warehouses'   => $warehouses,
            'filters'      => $filters,
        ]);
    }
}
