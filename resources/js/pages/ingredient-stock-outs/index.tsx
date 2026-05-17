import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import {
    index as stockOutsIndex,
    create as stockOutsCreate,
    show as stockOutsShow,
} from '@/routes/ingredient-stock-outs';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { IngredientStockOut, StockOutPurpose, StockOutStatus, Warehouse } from '@/types';

const STATUS_LABELS: Record<StockOutStatus, string> = {
    draft:     'Draft',
    approved:  'Approved',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<StockOutStatus, string> = {
    draft:     'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    approved:  'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

const PURPOSE_LABELS: Record<StockOutPurpose, string> = {
    production_use: 'Production Use',
    kitchen_use:    'Kitchen Use',
    sample:         'Sample',
    distribution:   'Distribution',
    other:          'Other',
};

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
    stockOuts: Paginated<IngredientStockOut>;
    warehouses: Pick<Warehouse, 'id' | 'name'>[];
    filters: { search?: string; warehouse_id?: string; status?: string; purpose?: string; per_page?: string };
};

function cleanLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function IngredientStockOutsIndex({ stockOuts, warehouses, filters }: Props) {
    const [form, setForm] = useState({
        search:       filters.search       ?? '',
        warehouse_id: filters.warehouse_id ?? '',
        status:       filters.status       ?? '',
        purpose:      filters.purpose      ?? '',
        per_page:     filters.per_page     ?? '10',
    });
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: stockOuts.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     stockOuts.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    stockOuts.links.filter((l) => /^\d+$/.test(cleanLabel(l.label))),
    }), [stockOuts.links]);

    const hasActiveFilters = form.warehouse_id !== '' || form.status !== '' || form.purpose !== '';

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
        router.get(stockOutsIndex.url(), { ...next, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(stockOutsIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(stockOutsIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    return (
        <>
            <Head title="Stock Outs" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Stock Outs' },
                ]}
                title="Stock Outs"
                description="Record and track ingredient stock outs."
                actions={
                    <Can permission="ingredient-stock-outs-create">
                        <Link
                            href={stockOutsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Stock Out
                        </Link>
                    </Can>
                }
            />

            <TableCard
                title="Stock Outs"
                description="Browse and manage all ingredient stock out records."
                toolbar={
                    <div className="flex flex-wrap items-center gap-3">
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search by stock out no…"
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
                            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border/20 bg-white p-4 shadow-xl dark:border-stone-700 dark:bg-stone-900">
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Warehouse</label>
                                        <SearchableSelect value={form.warehouse_id} onChange={(e) => { const next = { ...form, warehouse_id: e.target.value }; setForm(next); applyFilters(next); }}>
                                            <option value="">All</option>
                                            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </SearchableSelect>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Purpose</label>
                                        <SearchableSelect value={form.purpose} onChange={(e) => { const next = { ...form, purpose: e.target.value }; setForm(next); applyFilters(next); }}>
                                            <option value="">All</option>
                                            {(Object.keys(PURPOSE_LABELS) as StockOutPurpose[]).map((p) => <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>)}
                                        </SearchableSelect>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                                        <SearchableSelect value={form.status} onChange={(e) => { const next = { ...form, status: e.target.value }; setForm(next); applyFilters(next); }}>
                                            <option value="">All</option>
                                            {(Object.keys(STATUS_LABELS) as StockOutStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                        </SearchableSelect>
                                    </div>
                                    {hasActiveFilters && (
                                        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { const next = { ...form, warehouse_id: '', status: '', purpose: '' }; setForm(next); applyFilters(next); }}>
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
                                <span className="font-bold text-foreground dark:text-stone-100">{stockOuts.from ?? 0} - {stockOuts.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{stockOuts.total}</span>
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
                    <table className="w-full min-w-[650px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Stock Out No</th>
                                <th className="border-b border-border/10 px-6 py-4">Date</th>
                                <th className="border-b border-border/10 px-6 py-4">Warehouse</th>
                                <th className="border-b border-border/10 px-6 py-4">Purpose</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4">Created By</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {stockOuts.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">No stock out records found.</td>
                                </tr>
                            )}
                            {stockOuts.data.map((stockOut) => (
                                <tr key={stockOut.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <Link href={stockOutsShow.url(stockOut.id)} className="font-mono font-bold text-primary transition-colors hover:underline">
                                            {stockOut.stock_out_no}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {new Date(stockOut.stock_out_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground dark:text-stone-200">
                                        {stockOut.warehouse?.name ?? '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                            {PURPOSE_LABELS[stockOut.purpose]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1', STATUS_COLORS[stockOut.status])}>
                                            {STATUS_LABELS[stockOut.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {stockOut.createdBy?.name ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={stockOutsShow.url(stockOut.id)}
                                            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                            View
                                        </Link>
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
