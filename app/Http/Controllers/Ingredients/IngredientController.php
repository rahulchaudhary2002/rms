<?php

namespace App\Http\Controllers\Ingredients;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredients\Ingredient\StoreIngredientRequest;
use App\Http\Requests\Ingredients\Ingredient\UpdateIngredientRequest;
use App\Http\Requests\Ingredients\ToggleActiveRequest;
use App\Models\Ingredient;
use App\Services\IngredientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientController extends Controller
{
    use ExtractsFilters;

    public function __construct(private IngredientService $ingredientService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'ingredient_category_id', 'is_active', 'per_page']);

        return Inertia::render('ingredients/index',
            $this->ingredientService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('ingredients/create',
            $this->ingredientService->getCreateData());
    }

    public function store(StoreIngredientRequest $request): RedirectResponse
    {
        $this->ingredientService->createIngredient($request->validated());

        return redirect($request->input('_redirect', route('ingredients.index')))
            ->with('success', 'Ingredient created successfully.');
    }

    public function edit(Ingredient $ingredient): Response
    {
        return Inertia::render('ingredients/edit',
            $this->ingredientService->getEditData($ingredient));
    }

    public function update(UpdateIngredientRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $this->ingredientService->updateIngredient($ingredient, $request->validated());

        return redirect()->route('ingredients.index')
            ->with('success', 'Ingredient updated successfully.');
    }

    public function destroy(Ingredient $ingredient): RedirectResponse
    {
        $this->ingredientService->deleteIngredient($ingredient);

        return redirect()->route('ingredients.index')
            ->with('success', 'Ingredient deleted successfully.');
    }

    public function toggleActive(ToggleActiveRequest $request, Ingredient $ingredient): RedirectResponse
    {
        $this->ingredientService->toggleActive($ingredient, $request->boolean('is_active'));

        return redirect()->route('ingredients.index')
            ->with('success', 'Ingredient status updated.');
    }
}
