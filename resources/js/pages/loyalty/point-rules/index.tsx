import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
    create as rulesCreate,
    destroy as rulesDestroy,
    edit as rulesEdit,
    index as rulesIndex,
    show as rulesShow,
    toggleStatus as rulesToggleStatus,
} from '@/routes/loyalty-point-rules';
import type { LoyaltyPointRule, Outlet } from '@/types';

type PaginatedRules = {
    data: LoyaltyPointRule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    rules: PaginatedRules;
    scopeOutlets: Outlet[];
    filters: {
        search?: string;
        type?: string;
        earning_type?: string;
        outlet_id?: string;
        is_active?: string;
        per_page?: string;
    };
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
        <span
            className={cn(
                'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
            )}
        >
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function TypeBadge({ type }: { type: LoyaltyPointRule['type'] }) {
    const styles = {
        global: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
        outlet: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        campaign: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return (
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase', styles[type])}>
            {type}
        </span>
    );
}

function EarnSummary({ rule }: { rule: LoyaltyPointRule }) {
    if (rule.earning_type === 'fixed_rate') {
        return (
            <span className="text-sm text-foreground">
                Rs.&nbsp;{rule.earn_amount} = {rule.earn_points} pts
            </span>
        );
    }
    return (
        <span className="text-sm text-muted-foreground">
            {rule.slabs_count ?? 0} slabs
        </span>
    );
}

export default function LoyaltyPointRulesIndex({ rules, scopeOutlets, filters }: Props) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        type: filters.type ?? '',
        earning_type: filters.earning_type ?? '',
        outlet_id: filters.outlet_id ?? '',
        is_active: filters.is_active ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(
        () => ({
            previous: rules.links.find((l) => l.label.includes('Previous')) ?? null,
            next: rules.links.find((l) => l.label.includes('Next')) ?? null,
            pages: rules.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
        }),
        [rules.links],
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

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(rulesIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', type: '', earning_type: '', outlet_id: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(rulesIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(rulesIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(
                rulesIndex.url(),
                { ...form, search: value, page: '1' },
                { preserveState: true, preserveScroll: true, replace: true, onCancelToken },
            );
        },
    });

    function confirmDelete(rule: LoyaltyPointRule) {
        if (confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) {
            router.delete(rulesDestroy.url(rule.id));
        }
    }

    function toggleStatus(rule: LoyaltyPointRule) {
        router.patch(rulesToggleStatus.url(rule.id));
    }

    return (
        <>
            <Head title="Loyalty Point Rules" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Loyalty Point Rules' },
                ]}
                title="Loyalty Point Rules"
                description="Manage earning and redemption rules for loyalty points."
                actions={
                    <Can permission="loyalty-point-rules-create">
                        <Link
                            href={rulesCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Rule
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Point Rules"
                description="Browse and manage all loyalty point earning rules."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search by name..."
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
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Type</label>
                                        <SearchableSelect
                                            value={form.type}
                                            onChange={(e) => setForm((cur) => ({ ...cur, type: e.target.value }))}
                                        >
                                            <option value="">All Types</option>
                                            <option value="global">Global</option>
                                            <option value="outlet">Outlet</option>
                                            <option value="campaign">Campaign</option>
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Earning Type</label>
                                        <SearchableSelect
                                            value={form.earning_type}
                                            onChange={(e) => setForm((cur) => ({ ...cur, earning_type: e.target.value }))}
                                        >
                                            <option value="">All Earning Types</option>
                                            <option value="fixed_rate">Fixed Rate</option>
                                            <option value="fixed_slab">Fixed Slab</option>
                                        </SearchableSelect>
                                    </div>
                                    {scopeOutlets.length > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Outlet</label>
                                            <SearchableSelect
                                                value={form.outlet_id}
                                                onChange={(e) => setForm((cur) => ({ ...cur, outlet_id: e.target.value }))}
                                            >
                                                <option value="">All Outlets</option>
                                                {scopeOutlets.map((o) => (
                                                    <option key={o.id} value={String(o.id)}>{o.name}</option>
                                                ))}
                                            </SearchableSelect>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect
                                            value={form.is_active}
                                            onChange={(e) => setForm((cur) => ({ ...cur, is_active: e.target.value }))}
                                        >
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
                                <span className="font-bold text-foreground dark:text-stone-100">{rules.from ?? 0} - {rules.to ?? 0}</span>{' '}
                                of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{rules.total}</span>{' '}
                                results
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
                                        {tablePerPageOptions.map((o) => (
                                            <option key={o} value={o}>{o === 'all' ? 'All' : o}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[14px] text-primary/60">expand_more</span>
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
                    <table className="w-full min-w-[1100px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">Name</th>
                                <th className="border-b border-border/10 px-6 py-4">Type</th>
                                <th className="border-b border-border/10 px-6 py-4">Outlet</th>
                                <th className="border-b border-border/10 px-6 py-4">Earning Type</th>
                                <th className="border-b border-border/10 px-6 py-4">Earn Rule</th>
                                <th className="border-b border-border/10 px-6 py-4">Redeem Value</th>
                                <th className="border-b border-border/10 px-6 py-4">Date Range</th>
                                <th className="border-b border-border/10 px-6 py-4">Priority</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {rules.data.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">
                                        No loyalty point rules found.
                                    </td>
                                </tr>
                            )}
                            {rules.data.map((rule) => (
                                <tr key={rule.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <Link
                                            href={rulesShow.url(rule.id)}
                                            className="font-bold text-gray-900 transition-colors hover:text-primary dark:text-gray-100"
                                        >
                                            {rule.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <TypeBadge type={rule.type} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {rule.outlet?.name ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {rule.earning_type === 'fixed_rate' ? 'Fixed Rate' : 'Fixed Slab'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <EarnSummary rule={rule} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        1 pt = Rs.&nbsp;{rule.redeem_point_value}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {rule.starts_at && rule.ends_at
                                            ? `${rule.starts_at} – ${rule.ends_at}`
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-foreground dark:text-stone-200">
                                        {rule.priority}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge active={rule.is_active} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === rule.id}
                                            itemId={rule.id}
                                            itemLabel={rule.name}
                                            onToggle={(id) =>
                                                setOpenActionId((cur) =>
                                                    id === null ? null : cur === id ? null : (id as number),
                                                )
                                            }
                                            actions={[
                                                {
                                                    id: `view-${rule.id}`,
                                                    label: 'View rule',
                                                    icon: 'visibility',
                                                    href: rulesShow.url(rule.id),
                                                },
                                                {
                                                    id: `edit-${rule.id}`,
                                                    label: 'Edit rule',
                                                    icon: 'edit',
                                                    href: rulesEdit.url(rule.id),
                                                },
                                                {
                                                    id: `toggle-${rule.id}`,
                                                    label: rule.is_active ? 'Deactivate' : 'Activate',
                                                    icon: rule.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => toggleStatus(rule),
                                                },
                                                {
                                                    id: `delete-${rule.id}`,
                                                    label: 'Delete rule',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirmDelete(rule),
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
