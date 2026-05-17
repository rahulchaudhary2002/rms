<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Models\WarehouseIngredientStock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseIngredientStockController extends Controller
{
    use ExtractsFilters;

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'warehouse_id', 'per_page']);

        $query = WarehouseIngredientStock::with(['warehouse', 'ingredient.baseUnit'])
            ->when($filters['warehouse_id'] ?? null, fn($q, $v) => $q->where('warehouse_id', $v))
            ->when($filters['search'] ?? null, fn($q, $v) => $q->whereHas('ingredient', fn($iq) => $iq->where('name', 'like', "%{$v}%")));

        $perPage = max(1, min(200, (int) ($filters['per_page'] ?? 25)));

        return Inertia::render('warehouse-ingredient-stocks/index', [
            'stocks' => $query->orderBy('ingredient_id')->paginate($perPage)->withQueryString(),
            'filters' => $filters,
        ]);
    }
}
