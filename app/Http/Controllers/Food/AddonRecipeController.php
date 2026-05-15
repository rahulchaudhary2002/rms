<?php

namespace App\Http\Controllers\Food;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Food\Recipe\StoreAddonRecipeRequest;
use App\Models\Addon;
use App\Models\AddonGroup;
use App\Models\AddonRecipe;
use App\Models\Ingredient;
use App\Models\Unit;
use App\Services\FoodRecipeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AddonRecipeController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private FoodRecipeService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'is_active', 'per_page']);
        $query = AddonRecipe::query()
            ->with([
                'addon:id,addon_group_id,name',
                'addon.group:id,name',
                'ingredient:id,name',
                'unit:id,name,short_name',
            ])
            ->whereHas('addon', fn ($addon) => $addon->where('is_recipe_enabled', true))
            ->latest();

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('addon', fn ($addon) => $addon->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('addon.group', fn ($group) => $group->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('ingredient', fn ($ingredient) => $ingredient->where('name', 'like', "%{$search}%"));
            });
        }

        if (in_array($filters['is_active'], ['true', 'false'], true)) {
            $query->where('is_active', $filters['is_active'] === 'true');
        }

        $perPage = $filters['per_page'] === 'all'
            ? max($query->count(), 1)
            : min(max((int) ($filters['per_page'] ?: 10), 1), 100);

        return Inertia::render('food/addon-recipes/index', [
            'recipes' => $query->paginate($perPage)->withQueryString(),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('food/addon-recipes/create', $this->formOptions());
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateStandalone($request);

        $this->ensureUniqueRecipe($data);

        AddonRecipe::create($this->normalizeRecipeData($data));

        return redirect()->route('recipes.addons.index')
            ->with('success', 'Add-on recipe line created.');
    }

    public function edit(AddonRecipe $addonRecipe): Response
    {
        return Inertia::render('food/addon-recipes/edit', $this->formOptions() + [
            'recipe' => $addonRecipe->load([
                'addon:id,addon_group_id,name',
                'addon.group:id,name',
                'ingredient:id,name',
                'unit:id,name,short_name',
            ]),
        ]);
    }

    public function update(Request $request, AddonRecipe $addonRecipe): RedirectResponse
    {
        $data = $this->validateStandalone($request);

        $this->ensureUniqueRecipe($data, $addonRecipe);
        $addonRecipe->update($this->normalizeRecipeData($data));

        return redirect()->route('recipes.addons.index')
            ->with('success', 'Add-on recipe line updated.');
    }

    public function upsert(StoreAddonRecipeRequest $request, AddonGroup $addonGroup, Addon $addon): RedirectResponse
    {
        abort_unless($addon->addon_group_id === $addonGroup->id, 404);
        abort_unless($addon->is_recipe_enabled, 404);

        $this->service->upsertAddonRecipe($addon, $request->validated());

        return back()->with('success', 'Recipe saved.');
    }

    public function destroy(AddonGroup $addonGroup, Addon $addon, AddonRecipe $addonRecipe): RedirectResponse
    {
        abort_unless($addon->addon_group_id === $addonGroup->id, 404);
        abort_unless($addon->is_recipe_enabled, 404);
        abort_unless($addonRecipe->addon_id === $addon->id, 404);

        $this->service->deleteAddonRecipe($addonRecipe);

        return back()->with('success', 'Recipe item removed.');
    }

    public function upsertForAddon(StoreAddonRecipeRequest $request, Addon $addon): RedirectResponse
    {
        abort_unless($addon->is_recipe_enabled, 404);

        $this->service->upsertAddonRecipe($addon, $request->validated());

        return back()->with('success', 'Recipe saved.');
    }

    public function destroyForAddon(Addon $addon, AddonRecipe $addonRecipe): RedirectResponse
    {
        abort_unless($addon->is_recipe_enabled, 404);
        abort_unless($addonRecipe->addon_id === $addon->id, 404);

        $this->service->deleteAddonRecipe($addonRecipe);

        return back()->with('success', 'Recipe item removed.');
    }

    public function destroyStandalone(AddonRecipe $addonRecipe): RedirectResponse
    {
        $this->service->deleteAddonRecipe($addonRecipe);

        return redirect()->route('recipes.addons.index')
            ->with('success', 'Add-on recipe line deleted.');
    }

    private function formOptions(): array
    {
        return [
            'addons' => Addon::with('group:id,name')
                ->where('is_recipe_enabled', true)
                ->orderBy('name')
                ->get(['id', 'addon_group_id', 'name']),
            'ingredients' => Ingredient::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']),
        ];
    }

    private function validateStandalone(Request $request): array
    {
        return $request->validate([
            'addon_id'         => ['required', 'integer', Rule::exists('addons', 'id')->where('is_recipe_enabled', true)],
            'ingredient_id'    => ['required', 'integer', Rule::exists('ingredients', 'id')],
            'unit_id'          => ['required', 'integer', Rule::exists('units', 'id')],
            'quantity'         => ['required', 'numeric', 'min:0.0001'],
            'wastage_quantity' => ['nullable', 'numeric', 'min:0'],
            'is_active'        => ['nullable', 'boolean'],
        ]);
    }

    private function ensureUniqueRecipe(array $data, ?AddonRecipe $current = null): void
    {
        $exists = AddonRecipe::query()
            ->where('addon_id', $data['addon_id'])
            ->where('ingredient_id', $data['ingredient_id'])
            ->where('unit_id', $data['unit_id'])
            ->when($current, fn ($query) => $query->whereKeyNot($current->id))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'ingredient_id' => 'This add-on already has a recipe line for the selected ingredient and unit.',
            ]);
        }
    }

    private function normalizeRecipeData(array $data): array
    {
        $data['wastage_quantity'] = $data['wastage_quantity'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }
}
