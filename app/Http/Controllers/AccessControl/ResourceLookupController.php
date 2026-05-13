<?php

namespace App\Http\Controllers\AccessControl;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceLookupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $type   = $request->string('type')->toString();
        $search = $request->string('search')->toString();
        $page   = max((int) $request->input('page', 1), 1);

        $config = config("access_control.resource_types.{$type}");

        if (! $config) {
            return response()->json(['data' => [], 'total' => 0, 'last_page' => 1, 'current_page' => 1]);
        }

        /** @var class-string<\Illuminate\Database\Eloquent\Model> $modelClass */
        $modelClass    = $config['model'];
        $labelColumn   = $config['label_column'];
        $searchColumns = $config['search_columns'];

        $allowedIds = $request->filled('allowed_ids')
            ? array_map('intval', explode(',', $request->string('allowed_ids')->toString()))
            : null;

        $query = $modelClass::query()
            ->select(['id', $labelColumn])
            ->when($allowedIds !== null, fn ($builder) => $builder->whereIn('id', $allowedIds))
            ->when($search !== '', function ($builder) use ($search, $searchColumns) {
                $builder->where(function ($q) use ($search, $searchColumns) {
                    foreach ($searchColumns as $column) {
                        $q->orWhere($column, 'like', '%'.$search.'%');
                    }
                });
            })
            ->orderBy($labelColumn);

        $paginated = $query->paginate(20, ['*'], 'page', $page);

        return response()->json([
            'data'         => $paginated->map(fn ($item) => [
                'value' => (string) $item->id,
                'label' => $item->{$labelColumn},
            ])->values(),
            'total'        => $paginated->total(),
            'last_page'    => $paginated->lastPage(),
            'current_page' => $paginated->currentPage(),
        ]);
    }
}
