import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { ActionDropdown } from '@/components/action-dropdown';
import { Can } from '@/components/can';
import { PageHeader } from '@/components/page-header';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as groupsIndex } from '@/routes/addon-groups';
import { index as addonsIndex } from '@/routes/addons';
import type { Addon, AddonGroup } from '@/types';

type AddonWithGroup = Addon & { group?: Pick<AddonGroup, 'id' | 'name'> };

type PaginatedAddons = {
    data: AddonWithGroup[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    addons: PaginatedAddons;
    filters: { search?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo;', '')
        .replaceAll('&raquo;', '')
        .replaceAll('Previous', '')
        .replaceAll('Next', '')
        .trim();
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
            active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
        )}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

const addonShowUrl = (id: number) => `/addons/${id}`;
const addonEditUrl = (id: number) => `/addons/${id}/edit`;
const addonCreateUrl = () => '/addons/create';
const groupShowUrl = (id: number) => `/addon-groups/${id}`;

export default function AddonsIndex({ addons, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        search: filters.search ?? '',
        is_active: filters.is_active ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(
        () => ({
            previous: addons.links.find((l) => l.label.includes('Previous')) ?? null,
            next: addons.links.find((l) => l.label.includes('Next')) ?? null,
            pages: addons.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
        }),
        [addons.links],
    );

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            const element = event.target instanceof Element ? event.target : null;

            if (
                element?.closest('[data-searchable-select-root]') ||
                element?.closest('[data-searchable-select-listbox]')
            ) {
                return;
            }

            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        };
        document.addEventListener('mousedown', handlePointerDown);

        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(
                addonsIndex.url(),
                { ...form, search: value, page: '1' },
                { preserveState: true, preserveScroll: true, replace: true, onCancelToken },
            );
        },
    });

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(addonsIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(addonsIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(
            addonsIndex.url(),
            { ...form, per_page: nextValue, page: '1' },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Add-ons" />
            <PageHeader
                breadcrumbs={[{ label: 'Home', href: dashboard.url() }, { label: 'Add-ons' }]}
                title="Add-ons"
                description="Browse all add-ons across all groups."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Can permission="addon-groups-update">
                            <Link
                                href={addonCreateUrl()}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                New Add-on
                            </Link>
                        </Can>
                        <Can permission="addon-groups-view">
                            <Link
                                href={groupsIndex.url()}
                                className="inline-flex items-center gap-2 rounded-lg border border-border/30 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted dark:border-border dark:bg-card dark:hover:bg-accent"
                            >
                                <span className="material-symbols-outlined text-[18px]">layers</span>
                                View Groups
                            </Link>
                        </Can>
                    </div>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Add-ons"
                description="All add-ons across every group."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search add-ons..."
                            className="w-full lg:w-auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyFilters();
                                }
                            }}
                        />
                        <details ref={filterPopoverRef} className="relative">
                            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border/30 bg-white px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent">
                                <Filter className="h-4 w-4" />
                                Filter
                            </summary>
                            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border/20 bg-white p-5 shadow-2xl dark:border-border dark:bg-card">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground dark:text-stone-100">Table Filters</h4>
                                    <button
                                        type="button"
                                        className="text-[10px] font-bold text-primary uppercase hover:underline"
                                        onClick={clearFilters}
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}>
                                            <option value="">All Status</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </SearchableSelect>
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary"
                                        onClick={applyFilters}
                                    >
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
                                <span className="font-bold text-foreground dark:text-stone-100">
                                    {addons.from ?? 0} - {addons.to ?? 0}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">
                                    {addons.total}
                                </span>{' '}
                                results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase dark:text-stone-400">
                                    Items per page
                                </span>
                                <div className="relative">
                                    <select
                                        value={form.per_page}
                                        onChange={(e) => updatePerPage(e.target.value)}
                                        className="h-9 appearance-none rounded-md border border-border/30 bg-white px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                                    >
                                        {tablePerPageOptions.map((o) => (
                                            <option key={o} value={o}>{o === 'all' ? 'All' : o}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[14px] text-primary/60">
                                        expand_more
                                    </span>
                                </div>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2" aria-label="Pagination">
                            <Link
                                href={pagination.previous?.url ?? '#'}
                                preserveScroll
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors',
                                    pagination.previous?.url
                                        ? 'text-muted-foreground hover:bg-accent dark:text-stone-200 dark:hover:bg-stone-800'
                                        : 'pointer-events-none text-muted-foreground/40 dark:text-stone-600',
                                )}
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </Link>
                            <div className="flex items-center gap-1">
                                {pagination.pages.map((link) => (
                                    <Link
                                        key={`${link.label}-${link.url}`}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors',
                                            link.active
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-muted-foreground hover:bg-accent dark:text-stone-300 dark:hover:bg-stone-800',
                                            !link.url && 'pointer-events-none opacity-40',
                                        )}
                                    >
                                        {cleanPaginationLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={pagination.next?.url ?? '#'}
                                preserveScroll
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors',
                                    pagination.next?.url
                                        ? 'text-foreground hover:bg-accent dark:text-stone-100 dark:hover:bg-stone-800'
                                        : 'pointer-events-none text-muted-foreground/40 dark:text-stone-600',
                                )}
                            >
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
                                <th className="border-b border-border/10 px-6 py-4">Name</th>
                                <th className="border-b border-border/10 px-6 py-4">Group</th>
                                <th className="border-b border-border/10 px-6 py-4">Price</th>
                                <th className="border-b border-border/10 px-6 py-4">Recipe</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {addons.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">
                                        No add-ons found.
                                    </td>
                                </tr>
                            )}
                            {addons.data.map((addon) => (
                                <tr key={addon.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">extension</span>
                                            </div>
                                            <Link href={addonShowUrl(addon.id)} className="font-bold text-gray-900 transition-colors hover:text-primary dark:text-gray-100">
                                                {addon.name}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {addon.group ? (
                                            <Link
                                                href={groupShowUrl(addon.group.id)}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                {addon.group.name}
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {addon.price != null ? `Rs. ${Number(addon.price).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                            addon.is_recipe_enabled
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                        )}>
                                            {addon.is_recipe_enabled ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge active={addon.is_active} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === addon.id}
                                            itemId={addon.id}
                                            itemLabel={addon.name}
                                            onToggle={(id) =>
                                                setOpenActionId((cur) =>
                                                    id === null ? null : cur === id ? null : (id as number),
                                                )
                                            }
                                            actions={[
                                                {
                                                    id: `edit-${addon.id}`,
                                                    label: 'View add-on',
                                                    icon: 'visibility',
                                                    href: addonShowUrl(addon.id),
                                                },
                                                {
                                                    id: `edit-${addon.id}`,
                                                    label: 'Edit add-on',
                                                    icon: 'edit',
                                                    href: addonEditUrl(addon.id),
                                                },
                                                {
                                                    id: `toggle-${addon.id}`,
                                                    label: addon.is_active ? 'Deactivate' : 'Activate',
                                                    icon: addon.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => router.patch(`/addons/${addon.id}/toggle-status`, {}, { preserveScroll: true }),
                                                },
                                                {
                                                    id: `delete-${addon.id}`,
                                                    label: 'Delete add-on',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirm('Delete this add-on?', () => router.delete(`/addons/${addon.id}`), { title: 'Delete Add-on', confirmLabel: 'Delete', variant: 'danger' }),
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
