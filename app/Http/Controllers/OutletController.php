<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Requests\Outlet\StoreOutletRequest;
use App\Http\Requests\Outlet\UpdateOutletRequest;
use App\Models\Outlet;
use App\Services\OutletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutletController extends Controller
{
    use ExtractsFilters;

    public function __construct(private OutletService $outletService) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'per_page']);

        return Inertia::render('outlets/index',
            $this->outletService->getIndexData($filters));
    }

    public function create(): Response
    {
        return Inertia::render('outlets/create');
    }

    public function store(StoreOutletRequest $request): JsonResponse|RedirectResponse
    {
        $outlet = $this->outletService->createOutlet($request->user(), $request->validated());

        if ($request->wantsJson()) {
            return response()->json([
                'id'   => (string) $outlet->getKey(),
                'name' => $outlet->name,
            ], 201);
        }

        return redirect()->route('outlets.index')
            ->with('success', 'Outlet created successfully.');
    }

    public function edit(Outlet $outlet): Response
    {
        return Inertia::render('outlets/edit',
            $this->outletService->getEditData($outlet));
    }

    public function update(UpdateOutletRequest $request, Outlet $outlet): RedirectResponse
    {
        $this->outletService->updateOutlet($outlet, $request->validated());

        return redirect()->route('outlets.index')
            ->with('success', 'Outlet updated successfully.');
    }

    public function destroy(Outlet $outlet): RedirectResponse
    {
        $this->outletService->deleteOutlet($outlet);

        return redirect()->route('outlets.index')
            ->with('success', 'Outlet deleted successfully.');
    }
}
