<?php

namespace App\Http\Middleware;

use App\Services\AccessControlService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckResourcePermission
{
    public function __construct(private AccessControlService $accessControl) {}

    /**
     * Usage: middleware('resource.permission:permission_slug,resource_type,route_param')
     * Example: resource.permission:users.update,user,user
     */
    public function handle(Request $request, Closure $next, string $permission, string $resourceType, string $routeParam = ''): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->deny($request);
        }

        $resourceId = $this->resolveResourceId($request, $routeParam, $resourceType);

        if ($resourceId === null) {
            return $this->deny($request);
        }

        if (! $this->accessControl->userCanAccessResource($user, $permission, $resourceType, $resourceId)) {
            return $this->deny($request);
        }

        return $next($request);
    }

    private function resolveResourceId(Request $request, string $routeParam, string $resourceType): ?int
    {
        if ($routeParam) {
            $value = $request->route($routeParam);
            if ($value !== null) {
                return is_object($value) ? $value->id : (int) $value;
            }
        }

        // Fallback: try resource_type_id pattern in request
        $key = str_replace(['.', '-'], '_', $resourceType) . '_id';
        if ($request->has($key)) {
            return (int) $request->input($key);
        }

        return null;
    }

    private function deny(Request $request): Response
    {
        if ($request->inertia()) {
            return Inertia::location(route('dashboard'));
        }

        abort(403, 'Unauthorized.');
    }
}
