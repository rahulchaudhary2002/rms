import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import { index as unitsIndex, create as unitsCreate, edit as unitsEdit, destroy as unitsDestroy, toggleActive as unitsToggleActive } from '@/routes/units';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { Unit } from '@/types';

type PaginatedUnits = {
    data: Unit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    units: PaginatedUnits;
    filters: { search?: string; type?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

const unitTypeColors: Record<string, string> = {
    weight:   'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
    volume:   'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800',
    quantity: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800',
    custom:   'bg-stone-100 text-stone-600 ring-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-700',
};

export default function UnitsIndex({ units, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        search:    filters.search    ?? '',
        type:      filters.type      ?? '',
        is_active: filters.is_active ?? '',
        per_page:  filters.per_page  ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: units.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     units.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    units.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
    }), [units.links]);

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
        router.get(unitsIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', type: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(unitsIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(unitsIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(unitsIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    function confirmDelete(unit: Unit) {
        confirm(`Delete unit "${unit.name}"? This cannot be undone.`, () => router.delete(unitsDestroy.url(unit.id)), { title: 'Delete Unit', confirmLabel: 'Delete', variant: 'danger' });
    }

    function toggleActive(unit: Unit) {
        router.patch(unitsToggleActive.url(unit.id), { is_active: !unit.is_active });
    }

    return (
        <>
            <Head title="Units" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Units' },
                ]}
                title="Units"
                description="Manage measurement units used for ingredients."
                actions={
                    <Can permission="units-create">
                        <Link
                            href={unitsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Unit
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Units"
                description="Browse and manage all measurement units."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search units..."
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
                                    <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline" onClick={clearFilters}>
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Type</label>
                                        <SearchableSelect value={form.type} onChange={(e) => setForm((cur) => ({ ...cur, type: e.target.value }))}>
                                            <option value="">All Types</option>
                                            <option value="weight">Weight</option>
                                            <option value="volume">Volume</option>
                                            <option value="quantity">Quantity</option>
                                            <option value="custom">Custom</option>
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((cur) => ({ ...cur, is_active: e.target.value }))}>
                                            <option value="">All Status</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </SearchableSelect>
                                    </div>
                                    <Button type="button" className="w-full rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary" onClick={applyFilters}>
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
                                <span className="font-bold text-foreground dark:text-stone-100">{units.from ?? 0} - {units.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{units.total}</span>
                                {' '}results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:text-stone-400">Items per page</span>
                                <div className="relative">
                                    <select
                                        value={form.per_page}
                                        onChange={(e) => updatePerPage(e.target.value)}
                                        className="h-9 appearance-none rounded-md border border-border/30 bg-white px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                                    >
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
                    <table className="w-full min-w-[560px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Name</th>
                                <th className="border-b border-border/10 px-6 py-4">Short Name</th>
                                <th className="border-b border-border/10 px-6 py-4">Type</th>
                                <th className="border-b border-border/10 px-6 py-4">Base</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {units.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">No units found.</td>
                                </tr>
                            )}
                            {units.data.map((unit) => (
                                <tr key={unit.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">straighten</span>
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{unit.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-400">{unit.short_name}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ring-1', unitTypeColors[unit.type] ?? unitTypeColors.custom)}>
                                            {unit.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {unit.is_base && (
                                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800">
                                                Base
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase', unit.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400')}>
                                            {unit.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === unit.id}
                                            itemId={unit.id}
                                            itemLabel={unit.name}
                                            onToggle={(id) => setOpenActionId((cur) => (id === null ? null : cur === id ? null : id as number))}
                                            actions={[
                                                { id: `edit-${unit.id}`, label: 'Edit unit', icon: 'edit', href: unitsEdit.url(unit.id) },
                                                {
                                                    id: `toggle-${unit.id}`,
                                                    label: unit.is_active ? 'Deactivate' : 'Activate',
                                                    icon: unit.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => toggleActive(unit),
                                                },
                                                {
                                                    id: `delete-${unit.id}`,
                                                    label: 'Delete unit',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirmDelete(unit),
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
