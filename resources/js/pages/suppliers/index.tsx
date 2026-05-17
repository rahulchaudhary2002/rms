import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import {
    index as suppliersIndex,
    create as suppliersCreate,
    show as suppliersShow,
    edit as suppliersEdit,
    destroy as suppliersDestroy,
    toggleActive as suppliersToggleActive,
} from '@/routes/suppliers';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { Supplier } from '@/types';

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
    suppliers: Paginated<Supplier>;
    filters: { search?: string; is_active?: string; per_page?: string };
};

function cleanLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function SuppliersIndex({ suppliers, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        search:    filters.search    ?? '',
        is_active: filters.is_active ?? '',
        per_page:  filters.per_page  ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: suppliers.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     suppliers.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    suppliers.links.filter((l) => /^\d+$/.test(cleanLabel(l.label))),
    }), [suppliers.links]);

    const hasActiveFilters = form.is_active !== '';

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
            router.get(suppliersIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(suppliersIndex.url(), { ...form, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const next = { ...form, is_active: '' };
        setForm(next);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(suppliersIndex.url(), { ...next, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (value: string) => {
        setForm((f) => ({ ...f, per_page: value }));
        router.get(suppliersIndex.url(), { ...form, per_page: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    function handleToggleActive(supplier: Supplier) {
        const label = supplier.is_active ? 'deactivate' : 'activate';
        confirm(
            `Are you sure you want to ${label} "${supplier.name}"?`,
            () => router.patch(suppliersToggleActive.url(supplier), { is_active: !supplier.is_active }, { preserveScroll: true }),
            { title: `${supplier.is_active ? 'Deactivate' : 'Activate'} Supplier`, confirmLabel: supplier.is_active ? 'Deactivate' : 'Activate', variant: supplier.is_active ? 'danger' : 'default' },
        );
    }

    function handleDelete(supplier: Supplier) {
        confirm(
            `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
            () => router.delete(suppliersDestroy.url(supplier), { preserveScroll: true }),
            { title: 'Delete Supplier', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    return (
        <>
            {dialog}
            <Head title="Suppliers" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: dashboard.url() },
                    { label: 'Suppliers' },
                ]}
                title="Suppliers"
                description="Manage suppliers and their information."
                actions={
                    <Can permission="suppliers-create">
                        <Link
                            href={suppliersCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Supplier
                        </Link>
                    </Can>
                }
            />

            <TableCard
                title="Suppliers"
                description="Browse and manage all suppliers."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(v) => setForm((f) => ({ ...f, search: v }))}
                            placeholder="Search suppliers..."
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
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect
                                            value={form.is_active}
                                            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}
                                        >
                                            <option value="">All Status</option>
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
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
                                <span className="font-bold text-foreground dark:text-stone-100">{suppliers.from ?? 0} - {suppliers.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{suppliers.total}</span>
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
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Name</th>
                                <th className="border-b border-border/10 px-6 py-4">Code</th>
                                <th className="border-b border-border/10 px-6 py-4">Phone</th>
                                <th className="border-b border-border/10 px-6 py-4">Email</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {suppliers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No suppliers found.</td>
                                </tr>
                            ) : suppliers.data.map((supplier) => (
                                <tr key={supplier.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4 font-medium">
                                        <Link href={suppliersShow.url(supplier)} className="hover:text-primary">
                                            {supplier.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{supplier.code ?? '—'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{supplier.phone ?? '—'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{supplier.email ?? '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                                            supplier.is_active
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800'
                                                : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
                                        )}>
                                            {supplier.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            open={openActionId === supplier.id}
                                            onOpenChange={(open) => setOpenActionId(open ? supplier.id : null)}
                                            items={[
                                                { label: 'View', href: suppliersShow.url(supplier), icon: 'visibility', permission: 'suppliers-view' },
                                                { label: 'Edit', href: suppliersEdit.url(supplier), icon: 'edit', permission: 'suppliers-edit' },
                                                {
                                                    label:      supplier.is_active ? 'Deactivate' : 'Activate',
                                                    icon:       supplier.is_active ? 'toggle_off' : 'toggle_on',
                                                    permission: 'suppliers-edit',
                                                    onClick:    () => handleToggleActive(supplier),
                                                },
                                                {
                                                    label:      'Delete',
                                                    icon:       'delete',
                                                    permission: 'suppliers-delete',
                                                    onClick:    () => handleDelete(supplier),
                                                    variant:    'destructive' as const,
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
