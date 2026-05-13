<?php

namespace App\Http\Middleware;

use App\Services\AccessControlService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function __construct(private AccessControlService $accessControl) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->deny($request);
        }

        [$scopeType, $scopeId] = $this->resolveScope($request);

        if (! $this->accessControl->userHasPermission($user, $permission, $scopeType, $scopeId)) {
            return $this->deny($request);
        }

        return $next($request);
    }

    private function resolveScope(Request $request): array
    {
        if ($request->has('outlet_id') && $request->input('outlet_id')) {
            return ['outlet', (int) $request->input('outlet_id')];
        }

        if ($request->has('warehouse_id') && $request->input('warehouse_id')) {
            return ['warehouse', (int) $request->input('warehouse_id')];
        }

        $outletId = $request->session()->get('current_outlet_id');
        $nodeId = $request->session()->get('current_node_id');
        $scopeType = $request->session()->get('current_scope_type', 'global');

        if ($scopeType === 'warehouse' && $nodeId) {
            return ['warehouse', (int) $nodeId];
        }

        if ($scopeType === 'outlet' && $outletId) {
            return ['outlet', (int) $outletId];
        }

        return ['global', null];
    }

    private function deny(Request $request): Response
    {
        if ($request->inertia()) {
            return Inertia::location(route('dashboard'));
        }

        abort(403, 'Unauthorized.');
    }
}
