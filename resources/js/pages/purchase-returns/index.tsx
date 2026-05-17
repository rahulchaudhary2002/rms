import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import {
    index as returnsIndex,
    create as returnsCreate,
    show as returnsShow,
    edit as returnsEdit,
    destroy as returnsDestroy,
} from '@/routes/purchase-returns';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { PurchaseReturn, PurchaseReturnStatus, Supplier, Warehouse } from '@/types';

const STATUS_LABELS: Record<PurchaseReturnStatus, string> = {
    draft:     'Draft',
    posted:    'Posted',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<PurchaseReturnStatus, string> = {
    draft:     'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    posted:    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
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
    returns:    Paginated<PurchaseReturn>;
    suppliers:  Pick<Supplier,  'id' | 'name'>[];
    warehouses: Pick<Warehouse, 'id' | 'name'>[];
    filters:    { search?: string; supplier_id?: string; warehouse_id?: string; status?: string; per_page?: string };
};

function cleanLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function PurchaseReturnsIndex({ returns: purchaseReturns, suppliers, warehouses, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        search:       filters.search       ?? '',
        supplier_id:  filters.supplier_id  ?? '',
        warehouse_id: filters.warehouse_id ?? '',
        status:       filters.status       ?? '',
        per_page:     filters.per_page     ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: purchaseReturns.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     purchaseReturns.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    purchaseReturns.links.filter((l) => /^\d+$/.test(cleanLabel(l.label))),
    }), [purchaseReturns.links]);



    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(returnsIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(returnsIndex.url(), { ...form, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const next = { ...form, supplier_id: '', warehouse_id: '', status: '' };
        setForm(next);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(returnsIndex.url(), { ...next, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    function handleDelete(ret: PurchaseReturn) {
        confirm(
            `Delete "${ret.return_no}"? This action cannot be undone.`,
            () => router.delete(returnsDestroy.url(ret), { preserveScroll: true }),
            { title: 'Delete Purchase Return', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    return (
        <>
            {dialog}
            <Head title="Purchase Returns" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: dashboard.url() },
                    { label: 'Purchase Returns' },
                ]}
                title="Purchase Returns"
                description="Manage returned items to suppliers."
                actions={
                    <Can permission="purchase-returns-create">
                        <Link
                            href={returnsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Return
                        </Link>
                    </Can>
                }
            />

            <TableCard
                title="Purchase Returns"
                description="Browse all purchase returns with supplier, warehouse, and status."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(v) => setForm((f) => ({ ...f, search: v }))}
                            placeholder="Search by return no..."
                            className="w-full lg:w-auto"
                        />
                        <details ref={filterPopoverRef} className="relative">
                            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border/30 bg-white px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent">
                                <Filter className="h-4 w-4" />
                                Filter
                            </summary>
                            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border/20 bg-white p-5 shadow-2xl dark:border-border dark:bg-card">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground dark:text-stone-100">Table Filters</h4>
                                    <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline" onClick={clearFilters}>Clear All</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Supplier</label>
                                        <SearchableSelect value={form.supplier_id} onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}>
                                            <option value="">All Suppliers</option>
                                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Warehouse</label>
                                        <SearchableSelect value={form.warehouse_id} onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}>
                                            <option value="">All Warehouses</option>
                                            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                                            <option value="">All Statuses</option>
                                            {(Object.keys(STATUS_LABELS) as PurchaseReturnStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                        </SearchableSelect>
                                    </div>
                                </div>
                                <Button type="button" className="mt-4 w-full rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary" onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </details>
                    </>
                }
                footer={(
                    <>
                        <div className="flex flex-wrap items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground dark:text-stone-400">
                                Showing{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{purchaseReturns.from ?? 0} - {purchaseReturns.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{purchaseReturns.total}</span>
                                {' '}results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:text-stone-400">Items per page</span>
                                <div className="relative">
                                    <select value={form.per_page} onChange={(e) => { setForm((f) => ({ ...f, per_page: e.target.value })); router.get(returnsIndex.url(), { ...form, per_page: e.target.value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true }); }} className="h-9 appearance-none rounded-md border border-border/30 bg-white px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
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
                                    <Link key={`${link.label}-${link.url}`} href={link.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors', link.active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-accent', !link.url && 'pointer-events-none opacity-40')}>
                                        {cleanLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                            <Link href={pagination.next?.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors', pagination.next?.url ? 'text-foreground hover:bg-accent' : 'pointer-events-none text-muted-foreground/40')}>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                        </nav>
                    </>
                )}
                >
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Return No</th>
                                <th className="border-b border-border/10 px-6 py-4">Supplier</th>
                                <th className="border-b border-border/10 px-6 py-4">Warehouse</th>
                                <th className="border-b border-border/10 px-6 py-4">Date</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Total</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {purchaseReturns.data.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No purchase returns found.</td></tr>
                            ) : purchaseReturns.data.map((ret) => (
                                <tr key={ret.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4 font-medium">
                                        <Link href={returnsShow.url(ret)} className="hover:text-primary">{ret.return_no}</Link>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{ret.supplier?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{ret.warehouse?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{ret.return_date}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">{Number(ret.grand_total).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', STATUS_COLORS[ret.status])}>
                                            {STATUS_LABELS[ret.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            open={openActionId === ret.id}
                                            onOpenChange={(open) => setOpenActionId(open ? ret.id : null)}
                                            items={[
                                                { label: 'View', href: returnsShow.url(ret), icon: 'visibility', permission: 'purchase-returns-view' },
                                                ...(ret.status === 'draft' ? [{ label: 'Edit', href: returnsEdit.url(ret), icon: 'edit', permission: 'purchase-returns-edit' }] : []),
                                                ...(ret.status === 'draft' ? [{ label: 'Delete', icon: 'delete', permission: 'purchase-returns-delete', onClick: () => handleDelete(ret), variant: 'destructive' as const }] : []),
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
