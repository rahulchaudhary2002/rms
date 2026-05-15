import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import {
    index as warehousesIndex,
    create as warehousesCreate,
    edit as warehousesEdit,
    destroy as warehousesDestroy,
    toggleActive as warehousesToggleActive,
} from '@/routes/warehouses';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { Outlet, OutletDepartment, Warehouse, WarehouseType } from '@/types';

const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
    central:    'Central',
    outlet:     'Outlet',
    department: 'Department',
};

const TYPE_COLORS: Record<WarehouseType, string> = {
    central:    'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800',
    outlet:     'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
    department: 'bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800',
};

type PaginatedWarehouses = {
    data: Warehouse[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    warehouseList: PaginatedWarehouses;
    outlets: Pick<Outlet, 'id' | 'name'>[];
    departments: Pick<OutletDepartment, 'id' | 'outlet_id' | 'name'>[];
    filters: { search?: string; outlet_id?: string; type?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function WarehousesIndex({ warehouseList: warehouses, outlets, filters }: Props) {
    const [form, setForm] = useState({
        search:    filters.search    ?? '',
        outlet_id: filters.outlet_id ?? '',
        type:      filters.type      ?? '',
        is_active: filters.is_active ?? '',
        per_page:  filters.per_page  ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: warehouses.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     warehouses.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    warehouses.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
    }), [warehouses.links]);

    const hasActiveFilters = form.outlet_id !== '' || form.type !== '' || form.is_active !== '';

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(warehousesIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const applyFilters = (nextForm: typeof form) => {
        router.get(warehousesIndex.url(), { ...nextForm, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(warehousesIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function confirmDelete(warehouse: Warehouse) {
        if (confirm(`Delete warehouse "${warehouse.name}"? This cannot be undone.`)) {
            router.delete(warehousesDestroy.url(warehouse.id));
        }
    }

    function handleToggleActive(warehouse: Warehouse) {
        router.patch(warehousesToggleActive.url(warehouse.id), { is_active: !warehouse.is_active }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Warehouses" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Warehouses' },
                ]}
                title="Warehouses"
                description="Manage your storage warehouses."
                actions={
                    <Can permission="warehouses-create">
                        <Link
                            href={warehousesCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Warehouse
                        </Link>
                    </Can>
                }
            />

            <TableCard
                title="Warehouses"
                description="Browse and manage all warehouses."
                toolbar={
                    <div className="flex flex-wrap items-center gap-3">
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search by name or code…"
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
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Outlet</label>
                                        <SearchableSelect
                                            value={form.outlet_id}
                                            onChange={(e) => {
                                                const next = { ...form, outlet_id: e.target.value };
                                                setForm(next);
                                                applyFilters(next);
                                            }}
                                        >
                                            <option value="">All outlets</option>
                                            {outlets.map((o) => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </SearchableSelect>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                                        <SearchableSelect
                                            value={form.type}
                                            onChange={(e) => {
                                                const next = { ...form, type: e.target.value };
                                                setForm(next);
                                                applyFilters(next);
                                            }}
                                        >
                                            <option value="">All types</option>
                                            {Object.entries(WAREHOUSE_TYPE_LABELS).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </SearchableSelect>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                                        <SearchableSelect
                                            value={form.is_active}
                                            onChange={(e) => {
                                                const next = { ...form, is_active: e.target.value };
                                                setForm(next);
                                                applyFilters(next);
                                            }}
                                        >
                                            <option value="">All statuses</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </SearchableSelect>
                                    </div>
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs"
                                            onClick={() => {
                                                const next = { ...form, outlet_id: '', type: '', is_active: '' };
                                                setForm(next);
                                                applyFilters(next);
                                            }}
                                        >
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
                                <span className="font-bold text-foreground dark:text-stone-100">{warehouses.from ?? 0} - {warehouses.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{warehouses.total}</span>
                                {' '}results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:text-stone-400">Items per page</span>
                                <div className="relative">
                                    <select value={form.per_page} onChange={(e) => updatePerPage(e.target.value)} className="h-9 appearance-none rounded-md border border-border/30 bg-white px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
                                        {tablePerPageOptions.map((o) => (<option key={o} value={o}>{o === 'all' ? 'All' : o}</option>))}
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
                                        {cleanPaginationLabel(link.label)}
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
                    <table className="w-full min-w-[700px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Name / Code</th>
                                <th className="border-b border-border/10 px-6 py-4">Type</th>
                                <th className="border-b border-border/10 px-6 py-4">Outlet</th>
                                <th className="border-b border-border/10 px-6 py-4">Department</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {warehouses.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">No warehouses found.</td>
                                </tr>
                            )}
                            {warehouses.data.map((warehouse) => (
                                <tr key={warehouse.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">warehouse</span>
                                            </div>
                                            <div>
                                                <Link href={warehousesEdit.url(warehouse.id)} className="font-bold text-gray-900 transition-colors hover:text-primary dark:text-gray-100">
                                                    {warehouse.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground dark:text-stone-500">{warehouse.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1', TYPE_COLORS[warehouse.type])}>
                                            {WAREHOUSE_TYPE_LABELS[warehouse.type]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {warehouse.outlet?.name ?? <span className="italic opacity-50">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {warehouse.department?.name ?? <span className="italic opacity-50">—</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(warehouse)}
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 transition-opacity hover:opacity-80',
                                                warehouse.is_active
                                                    ? 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800'
                                                    : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
                                            )}
                                        >
                                            <span className={cn('h-1.5 w-1.5 rounded-full', warehouse.is_active ? 'bg-emerald-500' : 'bg-slate-400')} />
                                            {warehouse.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === warehouse.id}
                                            itemId={warehouse.id}
                                            itemLabel={warehouse.name}
                                            onToggle={(id) => setOpenActionId((cur) => (id === null ? null : cur === id ? null : id as number))}
                                            actions={[
                                                { id: `edit-${warehouse.id}`, label: 'Edit warehouse', icon: 'edit', href: warehousesEdit.url(warehouse.id) },
                                                {
                                                    id: `delete-${warehouse.id}`,
                                                    label: 'Delete warehouse',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirmDelete(warehouse),
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
