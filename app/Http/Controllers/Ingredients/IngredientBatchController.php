<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Models\IngredientBatch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientBatchController extends Controller
{
    use ExtractsFilters;

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'warehouse_id', 'ingredient_id', 'is_closed', 'per_page']);

        $query = IngredientBatch::with(['ingredient.baseUnit', 'warehouse'])
            ->when($filters['warehouse_id'] ?? null, fn($q, $v) => $q->where('warehouse_id', $v))
            ->when($filters['ingredient_id'] ?? null, fn($q, $v) => $q->where('ingredient_id', $v))
            ->when(isset($filters['is_closed']), fn($q) => $q->where('is_closed', (bool) $filters['is_closed']))
            ->when($filters['search'] ?? null, fn($q, $v) => $q->whereHas('ingredient', fn($iq) => $iq->where('name', 'like', "%{$v}%")));

        $perPage = max(1, min(200, (int) ($filters['per_page'] ?? 25)));

        return Inertia::render('ingredient-batches/index', [
            'batches' => $query->orderByDesc('created_at')->paginate($perPage)->withQueryString(),
            'filters' => $filters,
        ]);
    }
}
