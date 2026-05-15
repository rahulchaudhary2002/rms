import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionDropdown } from '@/components/action-dropdown';
import { Can } from '@/components/can';
import { PageHeader } from '@/components/page-header';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import {
    create as foodsCreate,
    destroy as foodsDestroy,
    edit as foodsEdit,
    index as foodsIndex,
    toggleFeatured as foodsToggleFeatured,
    toggleStatus as foodsToggleStatus,
} from '@/routes/foods';
import type { Food, FoodCategory, Outlet } from '@/types';

type PaginatedFoods = {
    data: Food[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    foods: PaginatedFoods;
    categories: Pick<FoodCategory, 'id' | 'name'>[];
    scopeOutlets: Outlet[];
    filters: { search?: string; category_id?: string; item_type?: string; food_type?: string; outlet_id?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo;', '')
        .replaceAll('&raquo;', '')
        .replaceAll('Previous', '')
        .replaceAll('Next', '')
        .trim();
}

const ITEM_TYPE_LABELS: Record<string, string> = { food: 'Food', beverage: 'Beverage', combo: 'Combo' };
const ITEM_TYPE_COLORS: Record<string, string> = {
    food: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    beverage: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    combo: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};
const FOOD_TYPE_ICONS: Record<string, string> = { veg: '🟢', non_veg: '🔴', egg: '🟡', vegan: '🌱' };
const foodShowUrl = (id: number) => `/foods/${id}`;

function ItemTypeBadge({ type }: { type: Food['item_type'] }) {
    return (
        <span className={cn('inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase', ITEM_TYPE_COLORS[type])}>
            {ITEM_TYPE_LABELS[type]}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
            active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
        )}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

export default function FoodsIndex({ foods, categories, scopeOutlets, filters }: Props) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        category_id: filters.category_id ?? '',
        item_type: filters.item_type ?? '',
        food_type: filters.food_type ?? '',
        outlet_id: filters.outlet_id ?? '',
        is_active: filters.is_active ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(
        () => ({
            previous: foods.links.find((l) => l.label.includes('Previous')) ?? null,
            next: foods.links.find((l) => l.label.includes('Next')) ?? null,
            pages: foods.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
        }),
        [foods.links],
    );

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            const element = event.target instanceof Element ? event.target : null;

            if (
                element?.closest('[data-searchable-select-root]') ||
                element?.closest('[data-searchable-select-listbox]')
            ) {
                return;
            }

            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        };
        document.addEventListener('mousedown', handlePointerDown);

        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(
                foodsIndex.url(),
                { ...form, search: value, page: '1' },
                { preserveState: true, preserveScroll: true, replace: true, onCancelToken },
            );
        },
    });

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(foodsIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', category_id: '', item_type: '', food_type: '', outlet_id: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(foodsIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(
            foodsIndex.url(),
            { ...form, per_page: nextValue, page: '1' },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    function confirmDelete(food: Food) {
        if (confirm(`Delete food item "${food.name}"? This cannot be undone.`)) {
            router.delete(foodsDestroy.url(food.id));
        }
    }

    return (
        <>
            <Head title="Foods & Menu" />
            <PageHeader
                breadcrumbs={[{ label: 'Home', href: dashboard.url() }, { label: 'Foods & Menu' }]}
                title="Foods & Menu"
                description="Manage food items, beverages, and combo products."
                actions={
                    <Can permission="foods-create">
                        <Link
                            href={foodsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Food
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Foods & Menu"
                description="Browse and manage all menu items."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search by name or SKU..."
                            className="w-full lg:w-auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyFilters();
                                }
                            }}
                        />
                        <details ref={filterPopoverRef} className="relative">
                            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border/30 bg-white px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent">
                                <Filter className="h-4 w-4" />
                                Filter
                            </summary>
                            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border/20 bg-white p-5 shadow-2xl dark:border-border dark:bg-card">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground dark:text-stone-100">Table Filters</h4>
                                    <button
                                        type="button"
                                        className="text-[10px] font-bold text-primary uppercase hover:underline"
                                        onClick={clearFilters}
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Category</label>
                                        <SearchableSelect value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
                                            <option value="">All Categories</option>
                                            {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Item Type</label>
                                        <SearchableSelect value={form.item_type} onChange={(e) => setForm((f) => ({ ...f, item_type: e.target.value }))}>
                                            <option value="">All Types</option>
                                            <option value="food">Food</option>
                                            <option value="beverage">Beverage</option>
                                            <option value="combo">Combo</option>
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Food Type</label>
                                        <SearchableSelect value={form.food_type} onChange={(e) => setForm((f) => ({ ...f, food_type: e.target.value }))}>
                                            <option value="">All</option>
                                            <option value="veg">Veg</option>
                                            <option value="non_veg">Non-Veg</option>
                                            <option value="egg">Egg</option>
                                            <option value="vegan">Vegan</option>
                                        </SearchableSelect>
                                    </div>
                                    {scopeOutlets.length > 1 && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Outlet</label>
                                            <SearchableSelect value={form.outlet_id} onChange={(e) => setForm((f) => ({ ...f, outlet_id: e.target.value }))}>
                                                <option value="">All Outlets</option>
                                                {scopeOutlets.map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                                            </SearchableSelect>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}>
                                            <option value="">All Status</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </SearchableSelect>
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary"
                                        onClick={applyFilters}
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </details>
                    </>
                }
                footer={
                    <>
                        <div className="flex flex-wrap items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground dark:text-stone-400">
                                Showing{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">
                                    {foods.from ?? 0} - {foods.to ?? 0}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">
                                    {foods.total}
                                </span>{' '}
                                results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:text-stone-400">
                                    Items per page
                                </span>
                                <div className="relative">
                                    <select
                                        value={form.per_page}
                                        onChange={(e) => updatePerPage(e.target.value)}
                                        className="h-9 appearance-none rounded-md border border-border/30 bg-white px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                                    >
                                        {tablePerPageOptions.map((o) => (
                                            <option key={o} value={o}>{o === 'all' ? 'All' : o}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[14px] text-primary/60">
                                        expand_more
                                    </span>
                                </div>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2" aria-label="Pagination">
                            <Link
                                href={pagination.previous?.url ?? '#'}
                                preserveScroll
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors',
                                    pagination.previous?.url
                                        ? 'text-muted-foreground hover:bg-accent dark:text-stone-200 dark:hover:bg-stone-800'
                                        : 'pointer-events-none text-muted-foreground/40 dark:text-stone-600',
                                )}
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </Link>
                            <div className="flex items-center gap-1">
                                {pagination.pages.map((link) => (
                                    <Link
                                        key={`${link.label}-${link.url}`}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors',
                                            link.active
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-muted-foreground hover:bg-accent dark:text-stone-300 dark:hover:bg-stone-800',
                                            !link.url && 'pointer-events-none opacity-40',
                                        )}
                                    >
                                        {cleanPaginationLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={pagination.next?.url ?? '#'}
                                preserveScroll
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors',
                                    pagination.next?.url
                                        ? 'text-foreground hover:bg-accent dark:text-stone-100 dark:hover:bg-stone-800'
                                        : 'pointer-events-none text-muted-foreground/40 dark:text-stone-600',
                                )}
                            >
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                        </nav>
                    </>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Name</th>
                                <th className="border-b border-border/10 px-6 py-4">Category</th>
                                <th className="border-b border-border/10 px-6 py-4">Type</th>
                                <th className="border-b border-border/10 px-6 py-4">Base Price</th>
                                <th className="border-b border-border/10 px-6 py-4">Variants</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {foods.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">
                                        No food items found.
                                    </td>
                                </tr>
                            )}
                            {foods.data.map((food) => (
                                <tr key={food.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                {food.food_type
                                                    ? <span className="text-base">{FOOD_TYPE_ICONS[food.food_type]}</span>
                                                    : <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
                                                }
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <Link href={foodShowUrl(food.id)} className="font-bold text-gray-900 transition-colors hover:text-primary dark:text-gray-100">
                                                        {food.name}
                                                    </Link>
                                                    {food.is_featured && <span className="material-symbols-outlined text-amber-400 text-base">star</span>}
                                                </div>
                                                {food.sku && <p className="text-xs text-muted-foreground dark:text-stone-400">SKU: {food.sku}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {food.category?.name ?? '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ItemTypeBadge type={food.item_type} />
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground dark:text-stone-400">
                                        Rs. {food.base_price}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {food.variants_count ?? 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge active={food.is_active} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === food.id}
                                            itemId={food.id}
                                            itemLabel={food.name}
                                            onToggle={(id) =>
                                                setOpenActionId((cur) =>
                                                    id === null ? null : cur === id ? null : (id as number),
                                                )
                                            }
                                            actions={[
                                                { id: `view-${food.id}`, label: 'View food', icon: 'visibility', href: foodShowUrl(food.id) },
                                                { id: `edit-${food.id}`, label: 'Edit food', icon: 'edit', href: foodsEdit.url(food.id) },
                                                { id: `feature-${food.id}`, label: food.is_featured ? 'Unfeature' : 'Feature', icon: 'star', onClick: () => router.patch(foodsToggleFeatured.url(food.id)) },
                                                { id: `toggle-${food.id}`, label: food.is_active ? 'Deactivate' : 'Activate', icon: food.is_active ? 'toggle_off' : 'toggle_on', onClick: () => router.patch(foodsToggleStatus.url(food.id)) },
                                                { id: `delete-${food.id}`, label: 'Delete food', icon: 'delete', variant: 'danger' as const, onClick: () => confirmDelete(food) },
                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </TableCard>
        </>
    );
}
