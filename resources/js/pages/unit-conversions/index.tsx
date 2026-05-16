import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { dashboard } from '@/routes';
import { index as conversionsIndex, create as conversionsCreate, edit as conversionsEdit, destroy as conversionsDestroy, toggleActive as conversionsToggleActive } from '@/routes/unit-conversions';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { cn } from '@/lib/utils';
import type { UnitConversion } from '@/types';

type PaginatedConversions = {
    data: UnitConversion[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    conversions: PaginatedConversions;
    filters: { from_unit_id?: string; to_unit_id?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function UnitConversionsIndex({ conversions, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        from_unit_id: filters.from_unit_id ?? '',
        to_unit_id:   filters.to_unit_id   ?? '',
        is_active:    filters.is_active    ?? '',
        per_page:     filters.per_page     ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: conversions.links.find((l) => l.label.includes('Previous')) ?? null,
        next:     conversions.links.find((l) => l.label.includes('Next'))     ?? null,
        pages:    conversions.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
    }), [conversions.links]);

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
        router.get(conversionsIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { from_unit_id: '', to_unit_id: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(conversionsIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(conversionsIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    function confirmDelete(conversion: UnitConversion) {
        const label = `${conversion.from_unit?.name} → ${conversion.to_unit?.name}`;
        confirm(`Delete conversion "${label}"? This cannot be undone.`, () => router.delete(conversionsDestroy.url(conversion.id)), { title: 'Delete Conversion', confirmLabel: 'Delete', variant: 'danger' });
    }

    function toggleActive(conversion: UnitConversion) {
        router.patch(conversionsToggleActive.url(conversion.id), { is_active: !conversion.is_active });
    }

    return (
        <>
            <Head title="Unit Conversions" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Unit Conversions' },
                ]}
                title="Unit Conversions"
                description="Manage conversion rates between units."
                actions={
                    <Can permission="unit-conversions-create">
                        <Link
                            href={conversionsCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Conversion
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Unit Conversions"
                description="Browse and manage all unit conversion rates."
                toolbar={
                    <>
                        <details ref={filterPopoverRef} className="relative ml-auto">
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
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((cur) => ({ ...cur, is_active: e.target.value }))}>
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
                            <p className="text-xs font-medium text-muted-foreground dark:text-stone-400">
                                Showing{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{conversions.from ?? 0} - {conversions.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{conversions.total}</span>
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
                    <table className="w-full min-w-[560px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Conversion</th>
                                <th className="border-b border-border/10 px-6 py-4">Multiplier</th>
                                <th className="border-b border-border/10 px-6 py-4">Formula</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {conversions.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">No unit conversions found.</td>
                                </tr>
                            )}
                            {conversions.data.map((conversion) => (
                                <tr key={conversion.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                                            <span>{conversion.from_unit?.name}</span>
                                            <span className="material-symbols-outlined text-[16px] text-muted-foreground">arrow_forward</span>
                                            <span>{conversion.to_unit?.name}</span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground dark:text-stone-400">
                                            {conversion.from_unit?.short_name} → {conversion.to_unit?.short_name}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                                        {Number(conversion.multiplier).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        1 {conversion.from_unit?.short_name} = {Number(conversion.multiplier).toLocaleString(undefined, { maximumFractionDigits: 6 })} {conversion.to_unit?.short_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase', conversion.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400')}>
                                            {conversion.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === conversion.id}
                                            itemId={conversion.id}
                                            itemLabel={`${conversion.from_unit?.name} → ${conversion.to_unit?.name}`}
                                            onToggle={(id) => setOpenActionId((cur) => (id === null ? null : cur === id ? null : id as number))}
                                            actions={[
                                                { id: `edit-${conversion.id}`, label: 'Edit conversion', icon: 'edit', href: conversionsEdit.url(conversion.id) },
                                                {
                                                    id: `toggle-${conversion.id}`,
                                                    label: conversion.is_active ? 'Deactivate' : 'Activate',
                                                    icon: conversion.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => toggleActive(conversion),
                                                },
                                                {
                                                    id: `delete-${conversion.id}`,
                                                    label: 'Delete conversion',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirmDelete(conversion),
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
