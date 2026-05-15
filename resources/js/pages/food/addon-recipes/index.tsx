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
import { create as recipesCreate, destroy as recipesDestroy, edit as recipesEdit, index as recipesIndex } from '@/routes/recipes/addons';
import type { AddonRecipe } from '@/types';

type PaginatedRecipes = {
    data: AddonRecipe[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    recipes: PaginatedRecipes;
    filters: { search?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
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

export default function AddonRecipesIndex({ recipes, filters }: Props) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        is_active: filters.is_active ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(
        () => ({
            previous: recipes.links.find((l) => l.label.includes('Previous')) ?? null,
            next: recipes.links.find((l) => l.label.includes('Next')) ?? null,
            pages: recipes.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
        }),
        [recipes.links],
    );

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
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
            router.get(recipesIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(recipesIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(recipesIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(recipesIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <>
            <Head title="Add-on Recipes" />
            <PageHeader
                breadcrumbs={[{ label: 'Home', href: dashboard.url() }, { label: 'Recipe' }, { label: 'Add-on Recipes' }]}
                title="Add-on Recipes"
                description="Manage ingredient recipe lines for add-ons."
                actions={
                    <Can permission="addon-groups-update">
                        <Link href={recipesCreate.url()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Add-on Recipe
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Add-on Recipes"
                description="Recipe lines used for add-on stock deduction."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search add-on, group, ingredient..."
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
                                    <h4 className="text-sm font-bold text-foreground">Table Filters</h4>
                                    <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline" onClick={clearFilters}>Clear All</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}>
                                            <option value="">All Status</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </SearchableSelect>
                                    </div>
                                    <Button type="button" className="w-full rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary" onClick={applyFilters}>Apply Filters</Button>
                                </div>
                            </div>
                        </details>
                    </>
                }
                footer={
                    <>
                        <div className="flex flex-wrap items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground">Showing <span className="font-bold text-foreground">{recipes.from ?? 0} - {recipes.to ?? 0}</span> of <span className="font-bold text-foreground">{recipes.total}</span> results</p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Items per page</span>
                                <select value={form.per_page} onChange={(e) => updatePerPage(e.target.value)} className="h-9 rounded-md border border-border/30 bg-white px-3 text-[11px] font-bold text-foreground shadow-sm outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
                                    {tablePerPageOptions.map((o) => <option key={o} value={o}>{o === 'all' ? 'All' : o}</option>)}
                                </select>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2" aria-label="Pagination">
                            <Link href={pagination.previous?.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors', pagination.previous?.url ? 'text-muted-foreground hover:bg-accent' : 'pointer-events-none text-muted-foreground/40')}>
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </Link>
                            <div className="flex items-center gap-1">
                                {pagination.pages.map((link) => (
                                    <Link key={`${link.label}-${link.url}`} href={link.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors', link.active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-accent', !link.url && 'pointer-events-none opacity-40')}>
                                        {cleanPaginationLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                            <Link href={pagination.next?.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors', pagination.next?.url ? 'text-foreground hover:bg-accent' : 'pointer-events-none text-muted-foreground/40')}>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                        </nav>
                    </>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900">
                                <th className="border-b border-border/10 px-6 py-4">Add-on</th>
                                <th className="border-b border-border/10 px-6 py-4">Group</th>
                                <th className="border-b border-border/10 px-6 py-4">Ingredient</th>
                                <th className="border-b border-border/10 px-6 py-4">Quantity</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {recipes.data.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">No add-on recipe lines found.</td></tr>
                            )}
                            {recipes.data.map((recipe) => (
                                <tr key={recipe.id} className="transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4 font-bold text-foreground">{recipe.addon?.name ?? '-'}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{recipe.addon?.group?.name ?? '-'}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{recipe.ingredient?.name ?? '-'}</td>
                                    <td className="px-6 py-4 font-mono text-sm">{recipe.quantity} {recipe.unit?.short_name ?? ''}<span className="ml-2 text-muted-foreground">wastage {recipe.wastage_quantity}</span></td>
                                    <td className="px-6 py-4"><StatusBadge active={recipe.is_active} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === recipe.id}
                                            itemId={recipe.id}
                                            itemLabel={recipe.ingredient?.name ?? 'Recipe line'}
                                            onToggle={(id) => setOpenActionId((cur) => id === null ? null : cur === id ? null : (id as number))}
                                            actions={[
                                                { id: `edit-${recipe.id}`, label: 'Edit recipe', icon: 'edit', href: recipesEdit.url(recipe.id) },
                                                {
                                                    id: `delete-${recipe.id}`,
                                                    label: 'Delete recipe',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => {
                                                        if (confirm('Delete this add-on recipe line?')) {
                                                            router.delete(recipesDestroy.url(recipe.id));
                                                        }
                                                    },
                                                },
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
