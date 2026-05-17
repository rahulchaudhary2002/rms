import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import { index as batchesIndex } from '@/routes/ingredient-batches';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { IngredientBatch, Warehouse } from '@/types';

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    batches: Paginated<IngredientBatch>;
    filters: { search?: string; warehouse_id?: string; is_closed?: string; per_page?: string };
};

function cleanLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function IngredientBatchesIndex({ batches, filters }: Props) {
    const [form, setForm] = useState({
        search:       filters.search       ?? '',
        warehouse_id: filters.warehouse_id ?? '',
        is_closed:    filters.is_closed    ?? '',
        per_page:     filters.per_page     ?? '25',
    });
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: batches.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     batches.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    batches.links.filter((l) => /^\d+$/.test(cleanLabel(l.label))),
    }), [batches.links]);

    const hasActiveFilters = form.warehouse_id !== '' || form.is_closed !== '';

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const applyFilters = (next: typeof form) => {
        router.get(batchesIndex.url(), { ...next, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(batchesIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(batchesIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    return (
        <>
            <Head title="Ingredient Batches" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Ingredient Batches' },
                ]}
                title="Ingredient Batches"
                description="Track all ingredient batches, their quantities and expiry dates."
            />

            <TableCard
                title="Ingredient Batches"
                description="All ingredient batches across all warehouses."
                toolbar={
                    <div className="flex flex-wrap items-center gap-3">
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search by ingredient…"
                            className="w-full lg:w-auto"
                        />
                        <details ref={filterPopoverRef} className="relative">
                            <summary className={cn(
                                'flex cursor-pointer list-none items-center gap-2 rounded-lg border border-border/30 bg-white px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800',
                                hasActiveFilters && 'border-primary/40 text-primary dark:border-primary/40 dark:text-primary',
                            )}>
                                <Filter className="h-4 w-4" />
                                Filters
                                {hasActiveFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">!</span>}
                            </summary>
                            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border/20 bg-white p-4 shadow-xl dark:border-stone-700 dark:bg-stone-900">
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                                        <SearchableSelect value={form.is_closed} onChange={(e) => { const next = { ...form, is_closed: e.target.value }; setForm(next); applyFilters(next); }}>
                                            <option value="">All</option>
                                            <option value="0">Open</option>
                                            <option value="1">Closed</option>
                                        </SearchableSelect>
                                    </div>
                                    {hasActiveFilters && (
                                        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { const next = { ...form, warehouse_id: '', is_closed: '' }; setForm(next); applyFilters(next); }}>
                                            Clear filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </details>
                    </div>
                }
                footer={
                    <>
                        <div className="flex flex-wrap items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground dark:text-stone-400">
                                Showing{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{batches.from ?? 0} - {batches.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{batches.total}</span>
                                {' '}results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:text-stone-400">Items per page</span>
                                <div className="relative">
                                    <select value={form.per_page} onChange={(e) => updatePerPage(e.target.value)} className="h-9 appearance-none rounded-md border border-border/30 bg-white px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
                                        {tablePerPageOptions.map((o) => <option key={o} value={o}>{o === 'all' ? 'All' : o}</option>)}
                                    </select>
                                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[14px] text-primary/60">expand_more</span>
                                </div>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2" aria-label="Pagination">
                            <Link href={pagination.previous?.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors', pagination.previous?.url ? 'text-muted-foreground hover:bg-accent dark:text-stone-200 dark:hover:bg-stone-800' : 'pointer-events-none text-muted-foreground/40 dark:text-stone-600')}>
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </Link>
                            <div className="flex items-center gap-1">
                                {pagination.pages.map((link) => (
                                    <Link key={`${link.label}-${link.url}`} href={link.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors', link.active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-accent dark:text-stone-300 dark:hover:bg-stone-800', !link.url && 'pointer-events-none opacity-40')}>
                                        {cleanLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                            <Link href={pagination.next?.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors', pagination.next?.url ? 'text-foreground hover:bg-accent dark:text-stone-100 dark:hover:bg-stone-800' : 'pointer-events-none text-muted-foreground/40 dark:text-stone-600')}>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                        </nav>
                    </>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Batch No</th>
                                <th className="border-b border-border/10 px-6 py-4">Ingredient</th>
                                <th className="border-b border-border/10 px-6 py-4">Warehouse</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Received Qty</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Available Qty</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Unit Cost</th>
                                <th className="border-b border-border/10 px-6 py-4">Expiry</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {batches.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">No batches found.</td>
                                </tr>
                            )}
                            {batches.data.map((batch) => {
                                const isExpiringSoon = batch.expiry_date && !batch.is_closed
                                    && new Date(batch.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                                const isExpired = batch.expiry_date && !batch.is_closed
                                    && new Date(batch.expiry_date) < new Date();

                                return (
                                    <tr key={batch.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                        <td className="px-6 py-4 font-mono text-sm font-bold text-foreground dark:text-stone-100">
                                            {batch.batch_no ?? <span className="text-muted-foreground italic">Auto</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-foreground dark:text-stone-100">{batch.ingredient?.name ?? '-'}</div>
                                            <div className="text-xs text-muted-foreground dark:text-stone-400">{batch.ingredient?.code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground dark:text-stone-200">{batch.warehouse?.name ?? '-'}</td>
                                        <td className="px-6 py-4 text-right text-sm text-muted-foreground dark:text-stone-400">
                                            {parseFloat(batch.received_quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            {batch.ingredient?.base_unit && <span className="ml-1 text-xs">{batch.ingredient.base_unit.short_name}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-foreground dark:text-stone-100">
                                            {parseFloat(batch.available_quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            {batch.ingredient?.base_unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{batch.ingredient.base_unit.short_name}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-muted-foreground dark:text-stone-400">
                                            {parseFloat(batch.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {batch.expiry_date ? (
                                                <span className={cn(
                                                    'font-medium',
                                                    isExpired ? 'text-red-600 dark:text-red-400' :
                                                    isExpiringSoon ? 'text-amber-600 dark:text-amber-400' :
                                                    'text-muted-foreground dark:text-stone-400',
                                                )}>
                                                    {new Date(batch.expiry_date).toLocaleDateString()}
                                                    {isExpired && <span className="ml-1 text-[10px] font-bold">EXPIRED</span>}
                                                    {isExpiringSoon && !isExpired && <span className="ml-1 text-[10px] font-bold">SOON</span>}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground dark:text-stone-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1',
                                                batch.is_closed
                                                    ? 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'
                                                    : 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
                                            )}>
                                                {batch.is_closed ? 'Closed' : 'Open'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </TableCard>
        </>
    );
}
