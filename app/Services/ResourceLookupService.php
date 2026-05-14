<?php

namespace App\Services;

use Illuminate\Pagination\LengthAwarePaginator;

class ResourceLookupService
{
    public function lookup(string $type, string $search, int $page, ?array $allowedIds): array
    {
        $config = config("access_control.resource_types.{$type}");

        if (! $config) {
            return ['data' => [], 'total' => 0, 'last_page' => 1, 'current_page' => 1];
        }

        /** @var class-string<\Illuminate\Database\Eloquent\Model> $modelClass */
        $modelClass    = $config['model'];
        $labelColumn   = $config['label_column'];
        $searchColumns = $config['search_columns'];

        $query = $modelClass::query()
            ->select(['id', $labelColumn])
            ->when($allowedIds !== null, fn ($b) => $b->whereIn('id', $allowedIds))
            ->when($search !== '', function ($b) use ($search, $searchColumns) {
                $b->where(function ($q) use ($search, $searchColumns) {
                    foreach ($searchColumns as $column) {
                        $q->orWhere($column, 'like', '%'.$search.'%');
                    }
                });
            })
            ->orderBy($labelColumn);

        $paginated = $query->paginate(20, ['*'], 'page', $page);

        return [
            'data'         => $paginated->map(fn ($item) => [
                'value' => (string) $item->id,
                'label' => $item->{$labelColumn},
            ])->values(),
            'total'        => $paginated->total(),
            'last_page'    => $paginated->lastPage(),
            'current_page' => $paginated->currentPage(),
        ];
    }
}
