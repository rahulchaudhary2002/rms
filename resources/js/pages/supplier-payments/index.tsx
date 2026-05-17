import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import {
    index as paymentsIndex,
    create as paymentsCreate,
    show as paymentsShow,
    destroy as paymentsDestroy,
} from '@/routes/supplier-payments';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { PaymentMethod, Supplier, SupplierPayment } from '@/types';

const METHOD_LABELS: Record<PaymentMethod, string> = {
    cash:   'Cash',
    bank:   'Bank Transfer',
    cheque: 'Cheque',
    online: 'Online',
    credit: 'Credit',
    other:  'Other',
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
    payments:  Paginated<SupplierPayment>;
    suppliers: Pick<Supplier, 'id' | 'name'>[];
    filters:   { search?: string; supplier_id?: string; payment_method?: string; per_page?: string };
};

function cleanLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function SupplierPaymentsIndex({ payments, suppliers, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        search:         filters.search         ?? '',
        supplier_id:    filters.supplier_id    ?? '',
        payment_method: filters.payment_method ?? '',
        per_page:       filters.per_page       ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: payments.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     payments.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    payments.links.filter((l) => /^\d+$/.test(cleanLabel(l.label))),
    }), [payments.links]);

    const hasActiveFilters = form.supplier_id !== '' || form.payment_method !== '';

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
            router.get(paymentsIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(paymentsIndex.url(), { ...form, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const next = { ...form, supplier_id: '', payment_method: '' };
        setForm(next);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(paymentsIndex.url(), { ...next, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    function handleDelete(payment: SupplierPayment) {
        confirm(
            `Delete "${payment.payment_no}"? This will reverse all invoice allocations.`,
            () => router.delete(paymentsDestroy.url(payment), { preserveScroll: true }),
            { title: 'Delete Payment', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    return (
        <>
            {dialog}
            <Head title="Supplier Payments" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: dashboard.url() },
                    { label: 'Supplier Payments' },
                ]}
                title="Supplier Payments"
                description="Record and track payments to suppliers."
                actions={
                    <Can permission="supplier-payments-create">
                        <Link
                            href={paymentsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Payment
                        </Link>
                    </Can>
                }
            />

            <TableCard
                title="Supplier Payments"
                description="Browse all supplier payments with amounts and methods."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(v) => setForm((f) => ({ ...f, search: v }))}
                            placeholder="Search by payment no..."
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
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Payment Method</label>
                                        <SearchableSelect value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}>
                                            <option value="">All Methods</option>
                                            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
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
                                <span className="font-bold text-foreground dark:text-stone-100">{payments.from ?? 0} - {payments.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{payments.total}</span>
                                {' '}results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:text-stone-400">Items per page</span>
                                <div className="relative">
                                    <select value={form.per_page} onChange={(e) => { setForm((f) => ({ ...f, per_page: e.target.value })); router.get(paymentsIndex.url(), { ...form, per_page: e.target.value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true }); }} className="h-9 appearance-none rounded-md border border-border/30 bg-white px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
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
                                <th className="border-b border-border/10 px-6 py-4">Payment No</th>
                                <th className="border-b border-border/10 px-6 py-4">Supplier</th>
                                <th className="border-b border-border/10 px-6 py-4">Date</th>
                                <th className="border-b border-border/10 px-6 py-4">Method</th>
                                <th className="border-b border-border/10 px-6 py-4">Reference</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Amount</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {payments.data.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No payments found.</td></tr>
                            ) : payments.data.map((payment) => (
                                <tr key={payment.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4 font-medium">
                                        <Link href={paymentsShow.url(payment)} className="hover:text-primary">{payment.payment_no}</Link>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{payment.supplier?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{payment.payment_date}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{payment.reference_no ?? '—'}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">{Number(payment.amount).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            open={openActionId === payment.id}
                                            onOpenChange={(open) => setOpenActionId(open ? payment.id : null)}
                                            items={[
                                                { label: 'View', href: paymentsShow.url(payment), icon: 'visibility', permission: 'supplier-payments-view' },
                                                { label: 'Delete', icon: 'delete', permission: 'supplier-payments-delete', onClick: () => handleDelete(payment), variant: 'destructive' as const },
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
