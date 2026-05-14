<?php

namespace App\Http\Concerns;

use Illuminate\Http\Request;

trait ExtractsFilters
{
    protected function extractFilters(Request $request, array $keys): array
    {
        $filters = [];
        foreach ($keys as $key) {
            $filters[$key] = $request->string($key)->toString();
        }
        return $filters;
    }
}
