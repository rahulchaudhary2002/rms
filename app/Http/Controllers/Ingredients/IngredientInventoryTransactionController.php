<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Models\IngredientInventoryTransaction;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientInventoryTransactionController extends Controller
{
    use ExtractsFilters, PaginatesQuery;

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'warehouse_id', 'ingredient_id', 'transaction_type', 'per_page']);

        $query = IngredientInventoryTransaction::with(['ingredient.baseUnit', 'warehouse', 'batch', 'createdBy'])
            ->when($filters['warehouse_id'] ?? null, fn($q, $v) => $q->where('warehouse_id', $v))
            ->when($filters['ingredient_id'] ?? null, fn($q, $v) => $q->where('ingredient_id', $v))
            ->when($filters['transaction_type'] ?? null, fn($q, $v) => $q->where('transaction_type', $v))
            ->when($filters['search'] ?? null, fn($q, $v) => $q->whereHas('ingredient', fn($iq) => $iq->where('name', 'like', "%{$v}%")));

        return Inertia::render('ingredient-inventory-transactions/index', [
            'transactions' => $query->orderByDesc('created_at')->paginate($this->perPage($query, $filters['per_page'] ?? '25'))->withQueryString(),
            'filters' => $filters,
        ]);
    }
}
