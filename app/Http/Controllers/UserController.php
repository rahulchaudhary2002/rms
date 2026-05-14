<?php

namespace App\Http\Controllers;

use App\Http\Concerns\ExtractsFilters;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use App\Services\AccessControlService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use ExtractsFilters;

    public function __construct(
        private AccessControlService $accessControl,
        private UserService $userService,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request, ['search', 'verified', 'per_page']);
        $scope   = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/users/index',
            $this->userService->getIndexData($request->user(), $filters, $scope));
    }

    public function create(): Response
    {
        return Inertia::render('access-control/users/create');
    }

    public function show(Request $request, User $user): Response
    {
        abort_if($user->is_superadmin, 404);
        abort_if($user->id === $request->user()->id, 403);

        $scope = $this->accessControl->resolveSessionScope($request);

        return Inertia::render('access-control/users/show',
            $this->userService->getShowData($request->user(), $user, $scope));
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->createUser($request->validated());

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        abort_if($user->is_superadmin, 404);

        return Inertia::render('access-control/users/edit', [
            'user' => $user->only(['id', 'name', 'email', 'is_superadmin', 'email_verified_at', 'created_at']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->updateUser($user, $request->validated());

        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if($user->is_superadmin, 404);

        $this->userService->deleteUser($user, Auth::user());

        return back()->with('success', 'User deleted.');
    }
}
