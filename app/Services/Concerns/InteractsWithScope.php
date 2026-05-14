<?php

namespace App\Services\Concerns;

use App\Models\User;
use App\Services\AccessControlService;

/**
 * @property-read AccessControlService $accessControl
 */
trait InteractsWithScope
{
    protected function resolveScopeProps(User $actor): array
    {
        return [
            'allowedScopes'     => $this->accessControl->resolveAllowedScopes($actor),
            'allowedScopeTypes' => $this->accessControl->resolveAllowedScopeTypes($actor),
            'scopeTypes'        => $this->accessControl->getScopeTypesConfig(),
        ];
    }

    protected function resolveResourceProps(User $actor, ?array $actorAssignedScopes = null): array
    {
        return [
            'allowedResourceIds' => $actorAssignedScopes ?? $this->accessControl->getActorAssignedScopeIds($actor),
            'resourceTypes'      => $this->accessControl->getResourceTypesConfig(),
        ];
    }
}
