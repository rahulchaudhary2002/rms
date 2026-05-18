import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import {
    index as diningTablesIndex,
    create as diningTablesCreate,
    edit as diningTablesEdit,
    destroy as diningTablesDestroy,
    toggleActive as diningTablesToggleActive,
} from '@/routes/dining-tables';
import { index as layoutIndex } from '@/routes/dining-table-layout';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';

type Outlet = { id: number; name: string };
type DiningArea = { id: number; name: string; outlet_id: number };

type DiningTable = {
    id: number;
    outlet_id: number;
    dining_area_id: number;
    name: string;
    code: string | null;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'inactive';
    shape: 'rectangle' | 'square' | 'circle' | 'oval';
    sort_order: number;
    is_active: boolean;
    outlet: Outlet | null;
    dining_area: DiningArea | null;
};

type PaginatedDiningTables = {
    data: DiningTable[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    diningTables: PaginatedDiningTables;
    outlets: Outlet[];
    diningAreas: DiningArea[];
    filters: { search?: string; outlet_id?: string; dining_area_id?: string; status?: string; is_active?: string; per_page?: string };
};

const STATUS_COLORS: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    occupied:  'bg-red-100 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
    reserved:  'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
    cleaning:  'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
    inactive:  'bg-stone-100 text-stone-500 ring-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-700',
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function DiningTablesIndex({ diningTables, outlets, diningAreas, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        search:         filters.search         ?? '',
        outlet_id:      filters.outlet_id      ?? '',
        dining_area_id: filters.dining_area_id ?? '',
        status:         filters.status         ?? '',
        is_active:      filters.is_active      ?? '',
        per_page:       filters.per_page       ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const filteredDiningAreas = useMemo(() => {
        if (!form.outlet_id) return diningAreas;
        return diningAreas.filter((a) => String(a.outlet_id) === form.outlet_id);
    }, [diningAreas, form.outlet_id]);

    const pagination = useMemo(() => ({
        previous: diningTables.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     diningTables.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    diningTables.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
    }), [diningTables.links]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            const element = event.target instanceof Element ? event.target : null;
            if (element?.closest('[data-searchable-select-root]') || element?.closest('[data-searchable-select-listbox]')) return;
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(diningTablesIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', outlet_id: '', dining_area_id: '', status: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(diningTablesIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(diningTablesIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(diningTablesIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    function confirmDelete(table: DiningTable) {
        confirm(`Delete dining table "${table.name}"? This cannot be undone.`, () => router.delete(diningTablesDestroy.url(table.id)), { title: 'Delete Dining Table', confirmLabel: 'Delete', variant: 'danger' });
    }

    function toggleActive(table: DiningTable) {
        router.patch(diningTablesToggleActive.url(table.id), { is_active: !table.is_active });
    }

    return (
        <>
            <Head title="Dining Tables" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Dining Tables' },
                ]}
                title="Dining Tables"
                description="Manage tables within each dining area."
                actions={
                    <div className="flex items-center gap-3">
                        <Can permission="dining-table-layout-view">
                            <Link
                                href={layoutIndex.url()}
                                className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
                            >
                                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                                Layout Editor
                            </Link>
                        </Can>
                        <Can permission="dining-tables-create">
                            <Link
                                href={diningTablesCreate.url()}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                New Table
                            </Link>
                        </Can>
                    </div>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Dining Tables"
                description="Browse and manage all dining tables."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search by name or code…"
                            className="w-full lg:w-auto"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
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
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Outlet</label>
                                        <SearchableSelect value={form.outlet_id} onChange={(e) => setForm((cur) => ({ ...cur, outlet_id: e.target.value, dining_area_id: '' }))}>
                                            <option value="">All Outlets</option>
                                            {outlets.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Dining Area</label>
                                        <SearchableSelect value={form.dining_area_id} onChange={(e) => setForm((cur) => ({ ...cur, dining_area_id: e.target.value }))}>
                                            <option value="">All Dining Areas</option>
                                            {filteredDiningAreas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.status} onChange={(e) => setForm((cur) => ({ ...cur, status: e.target.value }))}>
                                            <option value="">All Statuses</option>
                                            <option value="available">Available</option>
                                            <option value="occupied">Occupied</option>
                                            <option value="reserved">Reserved</option>
                                            <option value="cleaning">Cleaning</option>
                                            <option value="inactive">Inactive</option>
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Active</label>
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((cur) => ({ ...cur, is_active: e.target.value }))}>
                                            <option value="">All</option>
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
                            <p className="text-xs font-medium text-muted-foreground dark:text-stone-400">
                                Showing{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{diningTables.from ?? 0} - {diningTables.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{diningTables.total}</span>
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
                    <table className="w-full min-w-[800px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Name</th>
                                <th className="border-b border-border/10 px-6 py-4">Code</th>
                                <th className="border-b border-border/10 px-6 py-4">Dining Area</th>
                                <th className="border-b border-border/10 px-6 py-4">Outlet</th>
                                <th className="border-b border-border/10 px-6 py-4">Capacity</th>
                                <th className="border-b border-border/10 px-6 py-4">Shape</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4">Active</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {diningTables.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">No dining tables found.</td>
                                </tr>
                            )}
                            {diningTables.data.map((table) => (
                                <tr key={table.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <Link href={diningTablesEdit.url(table.id)} className="font-bold text-gray-900 transition-colors hover:text-primary dark:text-gray-100">
                                            {table.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">{table.code ?? '-'}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {table.dining_area ? (
                                            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800">
                                                {table.dining_area.name}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {table.outlet ? (
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                                {table.outlet.name}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                            {table.capacity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm capitalize text-muted-foreground dark:text-stone-400">{table.shape}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ring-1', STATUS_COLORS[table.status])}>
                                            {table.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase', table.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400')}>
                                            {table.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === table.id}
                                            itemId={table.id}
                                            itemLabel={table.name}
                                            onToggle={(id) => setOpenActionId((cur) => (id === null ? null : cur === id ? null : id as number))}
                                            actions={[
                                                { id: `edit-${table.id}`, label: 'Edit table', icon: 'edit', href: diningTablesEdit.url(table.id) },
                                                {
                                                    id: `toggle-${table.id}`,
                                                    label: table.is_active ? 'Deactivate' : 'Activate',
                                                    icon: table.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => toggleActive(table),
                                                },
                                                {
                                                    id: `delete-${table.id}`,
                                                    label: 'Delete table',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirmDelete(table),
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
            {dialog}
        </>
    );
}
