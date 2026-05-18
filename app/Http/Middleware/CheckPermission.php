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

        if ($user->is_superadmin) {
            return $next($request);
        }

        [$scopeType, $outletId, $departmentId, $warehouseId] = $this->resolveScope($request);

        if (! $this->accessControl->userHasPermission($user, $permission, $scopeType, $outletId, $departmentId, $warehouseId)) {
            return $this->deny($request);
        }

        return $next($request);
    }

    private function resolveScope(Request $request): array
    {
        $scopeType    = (string) $request->session()->get('current_scope_type', 'global');
        $outletId     = $request->session()->get('current_outlet_id');
        $departmentId = $request->session()->get('current_department_id');
        $nodeId       = $request->session()->get('current_node_id');

        return match ($scopeType) {
            'central_warehouse'    => [$scopeType, null,                                null,                                          $nodeId ? (int) $nodeId : null],
            'outlet'               => [$scopeType, $outletId ? (int) $outletId : null,  null,                                          null],
            'outlet_warehouse'     => [$scopeType, $outletId ? (int) $outletId : null,  null,                                          $nodeId ? (int) $nodeId : null],
            'outlet_department'    => [$scopeType, $outletId ? (int) $outletId : null,  $departmentId ? (int) $departmentId : null,    null],
            'department_warehouse' => [$scopeType, $outletId ? (int) $outletId : null,  $departmentId ? (int) $departmentId : null,    $nodeId ? (int) $nodeId : null],
            default                => ['global', null, null, null],
        };
    }

    private function deny(Request $request): Response
    {
        if ($request->inertia()) {
            return Inertia::location(route('dashboard'));
        }

        abort(403, 'Unauthorized.');
    }
}
