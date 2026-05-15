<?php

namespace App\Http\Controllers\Food;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Variant\StoreFoodVariantRequest;
use App\Http\Requests\Food\Variant\UpdateFoodVariantRequest;
use App\Models\Food;
use App\Models\FoodVariant;
use App\Services\FoodVariantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FoodVariantController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private FoodVariantService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'is_active', 'per_page']);
        $query = FoodVariant::query()
            ->with('food:id,name')
            ->withCount(['recipes', 'outletSettings'])
            ->whereHas('food', fn ($food) => $food->where('has_variants', true))
            ->when($filters['search'] !== '', fn ($builder) => $builder->where(fn ($q) => $q
                ->where('name', 'like', '%'.$filters['search'].'%')
                ->orWhere('sku', 'like', '%'.$filters['search'].'%')
                ->orWhereHas('food', fn ($food) => $food->where('name', 'like', '%'.$filters['search'].'%'))))
            ->when($filters['is_active'] !== '', fn ($builder) => $builder->where('is_active', $filters['is_active'] === 'true'))
            ->orderBy('sort_order')
            ->orderByDesc('created_at');

        $perPage = $filters['per_page'] === 'all'
            ? max($query->count(), 1)
            : min(max((int) ($filters['per_page'] ?: 10), 1), 100);

        return Inertia::render('food/variants/index', [
            'variants' => $query->paginate($perPage)->withQueryString(),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('food/variants/create', [
            'foods' => Food::where('has_variants', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeStandalone(Request $request): RedirectResponse
    {
        $data = $this->validateStandalone($request);
        $food = Food::findOrFail($data['food_id']);
        unset($data['food_id']);

        $this->service->create($food, $data);

        return redirect()->route('variants.index')
            ->with('success', 'Food variant created.');
    }

    public function edit(FoodVariant $foodVariant): Response
    {
        return Inertia::render('food/variants/edit', [
            'variant' => $foodVariant->load('food:id,name'),
            'foods' => Food::where('has_variants', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function updateStandalone(Request $request, FoodVariant $foodVariant): RedirectResponse
    {
        $data = $this->validateStandalone($request, $foodVariant);
        $data['price'] = $data['price'] ?? 0;
        $data['is_default'] = $data['is_default'] ?? false;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        if ($data['is_default'] ?? false) {
            FoodVariant::where('food_id', $data['food_id'])
                ->whereKeyNot($foodVariant->id)
                ->update(['is_default' => false]);
        }

        $foodVariant->update($data);

        return redirect()->route('variants.index')
            ->with('success', 'Food variant updated.');
    }

    public function store(StoreFoodVariantRequest $request, Food $food): RedirectResponse
    {
        abort_unless($food->has_variants, 404);

        $this->service->create($food, $request->validated());

        return back()->with('success', 'Variant added successfully.');
    }

    public function update(UpdateFoodVariantRequest $request, Food $food, FoodVariant $foodVariant): RedirectResponse
    {
        abort_unless($food->has_variants, 404);
        abort_unless($foodVariant->food_id === $food->id, 404);

        $this->service->update($foodVariant, $request->validated());

        return back()->with('success', 'Variant updated.');
    }

    public function destroy(Food $food, FoodVariant $foodVariant): RedirectResponse
    {
        abort_unless($food->has_variants, 404);
        abort_unless($foodVariant->food_id === $food->id, 404);

        $this->service->delete($foodVariant);

        return back()->with('success', 'Variant deleted.');
    }

    public function toggleStatus(Food $food, FoodVariant $foodVariant): RedirectResponse
    {
        abort_unless($food->has_variants, 404);
        abort_unless($foodVariant->food_id === $food->id, 404);

        $this->service->toggleStatus($foodVariant);

        return back()->with('success', 'Variant status updated.');
    }

    public function destroyStandalone(FoodVariant $foodVariant): RedirectResponse
    {
        $this->service->delete($foodVariant);

        return redirect()->route('variants.index')
            ->with('success', 'Food variant deleted.');
    }

    public function toggleStatusStandalone(FoodVariant $foodVariant): RedirectResponse
    {
        $this->service->toggleStatus($foodVariant);

        return back()->with('success', 'Food variant status updated.');
    }

    private function validateStandalone(Request $request, ?FoodVariant $variant = null): array
    {
        return $request->validate([
            'food_id'    => ['required', 'integer', Rule::exists('foods', 'id')->where('has_variants', true)],
            'name'       => ['required', 'string', 'max:255'],
            'sku'        => ['nullable', 'string', 'max:100', Rule::unique('food_variants', 'sku')->ignore($variant?->id)],
            'price'      => ['nullable', 'numeric', 'min:0'],
            'is_default' => ['nullable', 'boolean'],
            'is_active'  => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
