<?php

namespace App\Http\Controllers;

use App\Http\Requests\Scope\SelectScopeRequest;
use App\Http\Requests\Scope\StoreNodeRequest;
use App\Services\ScopeSelectionService;
use Illuminate\Http\RedirectResponse;

class ScopeSelectionController extends Controller
{
    public function __construct(private ScopeSelectionService $scopeSelectionService) {}

    public function store(SelectScopeRequest $request): RedirectResponse
    {
        $redirectTo = $this->scopeSelectionService->selectScope($request, $request->user(), $request->validated());

        return redirect()->to($redirectTo);
    }

    public function storeNode(StoreNodeRequest $request): RedirectResponse
    {
        $redirectTo = $this->scopeSelectionService->createNode($request, $request->user(), $request->validated());

        return redirect()->to($redirectTo);
    }
}
