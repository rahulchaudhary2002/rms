import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import { index as txIndex } from '@/routes/ingredient-inventory-transactions';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { IngredientInventoryTransaction, TransactionType } from '@/types';

const TX_LABELS: Record<TransactionType, string> = {
    opening_stock:      'Opening Stock',
    purchase_receive:   'Purchase Receive',
    purchase_return:    'Purchase Return',
    transfer_in:        'Transfer In',
    transfer_out:       'Transfer Out',
    sale_consume:       'Sale Consume',
    production_consume: 'Production Consume',
    wastage:            'Wastage',
    adjustment_in:      'Adjustment In',
    adjustment_out:     'Adjustment Out',
    stock_count_gain:   'Stock Count Gain',
    stock_count_loss:   'Stock Count Loss',
};

const TX_COLORS: Record<TransactionType, string> = {
    opening_stock:      'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    purchase_receive:   'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    purchase_return:    'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
    transfer_in:        'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
    transfer_out:       'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800',
    sale_consume:       'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-800',
    production_consume: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
    wastage:            'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800',
    adjustment_in:      'bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-800',
    adjustment_out:     'bg-pink-100 text-pink-700 ring-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:ring-pink-800',
    stock_count_gain:   'bg-cyan-100 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:ring-cyan-800',
    stock_count_loss:   'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
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
    transactions: Paginated<IngredientInventoryTransaction>;
    filters: { search?: string; warehouse_id?: string; transaction_type?: string; per_page?: string };
};

function cleanLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function IngredientInventoryTransactionsIndex({ transactions, filters }: Props) {
    const [form, setForm] = useState({
        search:           filters.search           ?? '',
        warehouse_id:     filters.warehouse_id     ?? '',
        transaction_type: filters.transaction_type ?? '',
        per_page:         filters.per_page         ?? '25',
    });
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: transactions.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     transactions.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    transactions.links.filter((l) => /^\d+$/.test(cleanLabel(l.label))),
    }), [transactions.links]);

    const hasActiveFilters = form.warehouse_id !== '' || form.transaction_type !== '';

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
        router.get(txIndex.url(), { ...next, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(txIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(txIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    return (
        <>
            <Head title="Inventory Transactions" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Inventory Transactions' },
                ]}
                title="Inventory Transactions"
                description="Full audit log of all ingredient stock movements."
            />

            <TableCard
                title="Inventory Transactions"
                description="Every stock movement — purchases, transfers, wastages, adjustments and counts."
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
                            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border/20 bg-white p-4 shadow-xl dark:border-stone-700 dark:bg-stone-900">
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Transaction Type</label>
                                        <SearchableSelect value={form.transaction_type} onChange={(e) => { const next = { ...form, transaction_type: e.target.value }; setForm(next); applyFilters(next); }}>
                                            <option value="">All Types</option>
                                            {(Object.keys(TX_LABELS) as TransactionType[]).map((t) => (
                                                <option key={t} value={t}>{TX_LABELS[t]}</option>
                                            ))}
                                        </SearchableSelect>
                                    </div>
                                    {hasActiveFilters && (
                                        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { const next = { ...form, warehouse_id: '', transaction_type: '' }; setForm(next); applyFilters(next); }}>
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
                                <span className="font-bold text-foreground dark:text-stone-100">{transactions.from ?? 0} - {transactions.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{transactions.total}</span>
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
                    <table className="w-full min-w-[900px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Date</th>
                                <th className="border-b border-border/10 px-6 py-4">Type</th>
                                <th className="border-b border-border/10 px-6 py-4">Ingredient</th>
                                <th className="border-b border-border/10 px-6 py-4">Warehouse</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">In</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Out</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Balance</th>
                                <th className="border-b border-border/10 px-6 py-4">By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {transactions.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">No transactions found.</td>
                                </tr>
                            )}
                            {transactions.data.map((tx) => (
                                <tr key={tx.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400 whitespace-nowrap">
                                        {new Date(tx.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ring-1 whitespace-nowrap', TX_COLORS[tx.transaction_type])}>
                                            {TX_LABELS[tx.transaction_type]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-foreground dark:text-stone-100">{tx.ingredient?.name ?? '-'}</div>
                                        <div className="text-xs text-muted-foreground dark:text-stone-400">{tx.ingredient?.code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground dark:text-stone-200">{tx.warehouse?.name ?? '-'}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        {parseFloat(tx.quantity_in) > 0 ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                +{parseFloat(tx.quantity_in).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            </span>
                                        ) : <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        {parseFloat(tx.quantity_out) > 0 ? (
                                            <span className="font-bold text-red-600 dark:text-red-400">
                                                -{parseFloat(tx.quantity_out).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            </span>
                                        ) : <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-foreground dark:text-stone-100">
                                        {parseFloat(tx.balance_after).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        {tx.ingredient?.base_unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{tx.ingredient.base_unit.short_name}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {tx.createdBy?.name ?? '-'}
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
