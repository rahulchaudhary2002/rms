<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckNodeSelection
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return $next($request);
        }

        $hasValidSelection = $this->hasValidSelection($request);

        if (! $hasValidSelection) {
            $request->session()->forget('current_node_id');
            $request->session()->forget('current_outlet_id');
            $request->session()->forget('current_department_id');
            $request->session()->forget('current_scope_type');

            if (! $this->isAllowedWithoutSelection($request)) {
                return new RedirectResponse('/scope-selection', 302, [
                    'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
                ]);
            }

            return $next($request);
        }

        if ($request->isMethod('get') && $request->is('scope-selection')) {
            return new RedirectResponse('/dashboard', 302, [
                'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            ]);
        }

        return $next($request);
    }

    private function hasValidSelection(Request $request): bool
    {
        $scopeType    = (string) $request->session()->get('current_scope_type', '');
        $outletId     = (string) $request->session()->get('current_outlet_id', '');
        $departmentId = (string) $request->session()->get('current_department_id', '');
        $nodeId       = (string) $request->session()->get('current_node_id', '');

        return match ($scopeType) {
            'global'               => true,
            'central_warehouse'    => $nodeId !== '',
            'outlet'               => $outletId !== '',
            'outlet_warehouse'     => $outletId !== '' && $nodeId !== '',
            'outlet_department'    => $outletId !== '' && $departmentId !== '',
            'department_warehouse' => $outletId !== '' && $departmentId !== '' && $nodeId !== '',
            default                => false,
        };
    }

    private function isAllowedWithoutSelection(Request $request): bool
    {
        return $request->is('scope-selection') ||
            $request->is('scope-selection/*') ||
            $request->is('outlets') ||
            $request->is('warehouses');
    }
}
