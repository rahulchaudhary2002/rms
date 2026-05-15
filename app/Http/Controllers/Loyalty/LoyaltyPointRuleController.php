<?php

namespace App\Http\Controllers\Loyalty;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Loyalty\StoreLoyaltyPointRuleRequest;
use App\Http\Requests\Loyalty\UpdateLoyaltyPointRuleRequest;
use App\Models\LoyaltyPointRule;
use App\Models\Outlet;
use App\Services\AccessControlService;
use App\Services\LoyaltyPointRuleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltyPointRuleController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AccessControlService $accessControl,
        private LoyaltyPointRuleService $service,
    ) {}

    public function index(Request $request): Response
    {
        $filters               = $this->extractFilters($request, ['search', 'type', 'earning_type', 'outlet_id', 'is_active', 'per_page']);
        $filters['type']        = $filters['type'] ?: '';
        $filters['earning_type'] = $filters['earning_type'] ?: '';
        $scope                 = $this->accessControl->resolveSessionScope($request);

        $data                 = $this->service->list($filters, $scope);
        $data['scopeOutlets'] = $this->outletsForScope($scope);

        return Inertia::render('loyalty/point-rules/index', $data);
    }

    public function create(Request $request): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('loyalty/point-rules/create', [
            'scopeOutlets'       => $this->outletsForScope($scope),
            'scopeType'          => $scope['type'],
            'scopeOutletId'      => $scope['outlet_id'] !== null ? (int) $scope['outlet_id'] : null,
        ]);
    }

    public function store(StoreLoyaltyPointRuleRequest $request): RedirectResponse
    {
        $this->service->create($request->validated() + ['is_active' => $request->boolean('is_active', true)]);

        return redirect($request->input('_redirect', route('loyalty-point-rules.index')))
            ->with('success', 'Loyalty point rule created successfully.');
    }

    public function show(LoyaltyPointRule $loyaltyPointRule): Response
    {
        return Inertia::render('loyalty/point-rules/show', [
            'rule' => $loyaltyPointRule->load(['outlet:id,name', 'slabs']),
        ]);
    }

    public function edit(Request $request, LoyaltyPointRule $loyaltyPointRule): Response
    {
        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('loyalty/point-rules/edit', [
            'rule'          => $loyaltyPointRule->load(['outlet:id,name', 'slabs']),
            'scopeOutlets'  => $this->outletsForScope($scope),
            'scopeType'     => $scope['type'],
            'scopeOutletId' => $scope['outlet_id'] !== null ? (int) $scope['outlet_id'] : null,
        ]);
    }

    public function update(UpdateLoyaltyPointRuleRequest $request, LoyaltyPointRule $loyaltyPointRule): RedirectResponse
    {
        $this->service->update(
            $loyaltyPointRule,
            $request->validated() + ['is_active' => $request->boolean('is_active', true)]
        );

        return redirect()->route('loyalty-point-rules.index')
            ->with('success', 'Loyalty point rule updated successfully.');
    }

    public function destroy(LoyaltyPointRule $loyaltyPointRule): RedirectResponse
    {
        $this->service->delete($loyaltyPointRule);

        return redirect()->route('loyalty-point-rules.index')
            ->with('success', 'Loyalty point rule deleted.');
    }

    public function toggleStatus(LoyaltyPointRule $loyaltyPointRule): RedirectResponse
    {
        $this->service->toggleStatus($loyaltyPointRule);

        return back()->with('success', 'Rule status updated.');
    }

    private function outletsForScope(array $scope): \Illuminate\Database\Eloquent\Collection
    {
        if ($scope['type'] === 'global') {
            return Outlet::orderBy('name')->get(['id', 'name']);
        }

        $outletId = (int) $scope['outlet_id'];

        return Outlet::where('id', $outletId)->get(['id', 'name']);
    }
}
