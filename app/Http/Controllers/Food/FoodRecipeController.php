<?php

namespace App\Http\Controllers\Food;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Recipe\StoreFoodRecipeRequest;
use App\Models\Food;
use App\Models\FoodRecipe;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Services\FoodRecipeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FoodRecipeController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private FoodRecipeService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'is_active', 'per_page']);
        $query = FoodRecipe::query()
            ->with([
                'food:id,name',
                'variant:id,food_id,name',
                'ingredient:id,name',
                'unit:id,name,short_name',
            ])
            ->whereHas('food', fn ($food) => $food->where('is_recipe_enabled', true))
            ->latest();

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('food', fn ($food) => $food->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('variant', fn ($variant) => $variant->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('ingredient', fn ($ingredient) => $ingredient->where('name', 'like', "%{$search}%"));
            });
        }

        if (in_array($filters['is_active'], ['true', 'false'], true)) {
            $query->where('is_active', $filters['is_active'] === 'true');
        }

        $perPage = $filters['per_page'] === 'all'
            ? max($query->count(), 1)
            : min(max((int) ($filters['per_page'] ?: 10), 1), 100);

        return Inertia::render('food/recipes/index', [
            'recipes' => $query->paginate($perPage)->withQueryString(),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('food/recipes/create', $this->formOptions());
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateStandalone($request);
        $variantId = isset($data['food_variant_id']) ? (int) $data['food_variant_id'] : null;
        $food = Food::findOrFail($data['food_id']);

        $this->service->validateVariantBelongsToFood($food->id, $variantId);
        $this->ensureUniqueRecipe($data, $variantId);

        FoodRecipe::create($this->normalizeRecipeData($data, $variantId));

        return redirect()->route('recipes.food.index')
            ->with('success', 'Food recipe line created.');
    }

    public function edit(FoodRecipe $foodRecipe): Response
    {
        return Inertia::render('food/recipes/edit', $this->formOptions() + [
            'recipe' => $foodRecipe->load([
                'food:id,name',
                'variant:id,food_id,name',
                'ingredient:id,name',
                'unit:id,name,short_name',
            ]),
        ]);
    }

    public function update(Request $request, FoodRecipe $foodRecipe): RedirectResponse
    {
        $data = $this->validateStandalone($request);
        $variantId = isset($data['food_variant_id']) ? (int) $data['food_variant_id'] : null;

        $this->service->validateVariantBelongsToFood((int) $data['food_id'], $variantId);
        $this->ensureUniqueRecipe($data, $variantId, $foodRecipe);

        $foodRecipe->update($this->normalizeRecipeData($data, $variantId));

        return redirect()->route('recipes.food.index')
            ->with('success', 'Food recipe line updated.');
    }

    public function upsert(StoreFoodRecipeRequest $request, Food $food): RedirectResponse
    {
        abort_unless($food->is_recipe_enabled, 404);

        $data      = $request->validated();
        $variantId = isset($data['food_variant_id']) ? (int) $data['food_variant_id'] : null;

        $this->service->validateVariantBelongsToFood($food->id, $variantId);
        $this->service->upsertFoodRecipe($food, $data, $variantId);

        return back()->with('success', 'Recipe saved.');
    }

    public function destroy(Food $food, FoodRecipe $foodRecipe): RedirectResponse
    {
        abort_unless($food->is_recipe_enabled, 404);
        abort_unless($foodRecipe->food_id === $food->id, 404);

        $this->service->deleteFoodRecipe($foodRecipe);

        return back()->with('success', 'Recipe item removed.');
    }

    public function destroyStandalone(FoodRecipe $foodRecipe): RedirectResponse
    {
        $this->service->deleteFoodRecipe($foodRecipe);

        return redirect()->route('recipes.food.index')
            ->with('success', 'Food recipe line deleted.');
    }

    private function formOptions(): array
    {
        return [
            'foods' => Food::with(['variants:id,food_id,name'])
                ->where('is_recipe_enabled', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'ingredients' => Ingredient::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']),
        ];
    }

    private function validateStandalone(Request $request): array
    {
        return $request->validate([
            'food_id'          => ['required', 'integer', Rule::exists('foods', 'id')->where('is_recipe_enabled', true)],
            'food_variant_id'  => ['nullable', 'integer', Rule::exists('food_variants', 'id')],
            'ingredient_id'    => ['required', 'integer', Rule::exists('ingredients', 'id')],
            'unit_id'          => ['required', 'integer', Rule::exists('units', 'id')],
            'quantity'         => ['required', 'numeric', 'min:0.0001'],
            'wastage_quantity' => ['nullable', 'numeric', 'min:0'],
            'is_active'        => ['nullable', 'boolean'],
        ]);
    }

    private function ensureUniqueRecipe(array $data, ?int $variantId, ?FoodRecipe $current = null): void
    {
        $exists = FoodRecipe::query()
            ->where('food_id', $data['food_id'])
            ->when(
                $variantId === null,
                fn ($query) => $query->whereNull('food_variant_id'),
                fn ($query) => $query->where('food_variant_id', $variantId),
            )
            ->where('ingredient_id', $data['ingredient_id'])
            ->where('unit_id', $data['unit_id'])
            ->when($current, fn ($query) => $query->whereKeyNot($current->id))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'ingredient_id' => 'This food already has a recipe line for the selected variant, ingredient, and unit.',
            ]);
        }
    }

    private function normalizeRecipeData(array $data, ?int $variantId): array
    {
        $data['food_variant_id'] = $variantId;
        $data['wastage_quantity'] = $data['wastage_quantity'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }
}
