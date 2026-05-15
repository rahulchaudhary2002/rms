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

        [$scopeType, $outletId, $warehouseId] = $this->resolveScope($request);

        if (! $this->accessControl->userHasPermission($user, $permission, $scopeType, $outletId, $warehouseId)) {
            return $this->deny($request);
        }

        return $next($request);
    }

    private function resolveScope(Request $request): array
    {
        $sessionOutletId = $request->session()->get('current_outlet_id');
        $nodeId          = $request->session()->get('current_node_id');
        $scopeType       = $request->session()->get('current_scope_type', 'global');

        if ($scopeType === 'warehouse' && $nodeId) {
            return ['warehouse', $sessionOutletId ? (int) $sessionOutletId : null, (int) $nodeId];
        }

        if ($scopeType === 'outlet' && $sessionOutletId) {
            return ['outlet', (int) $sessionOutletId, null];
        }

        return ['global', null, null];
    }

    private function deny(Request $request): Response
    {
        if ($request->inertia()) {
            return Inertia::location(route('dashboard'));
        }

        abort(403, 'Unauthorized.');
    }
}
