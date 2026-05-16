import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as upoIndex, create as upoCreate, destroy as upoDestroy, update as upoUpdate } from '@/routes/access-control/user-permission-overrides';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { Permission } from '@/types';

type User = { id: number; name: string; email: string };
type ScopeTarget = { id: number; name: string } | null;
type Override = {
    id: number;
    user: User;
    permission: Permission;
    scope_type: string;
    outlet_id: number | null;
    outlet_department_id: number | null;
    warehouse_id: number | null;
    outlet: ScopeTarget;
    department: ScopeTarget;
    warehouse: ScopeTarget;
    effect: 'allow' | 'deny';
    reason: string | null;
    is_active: boolean;
    assigned_by: User | null;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
};
type PaginatedOverrides = {
    data: Override[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    overrides: PaginatedOverrides;
    users: User[];
    permissions: Permission[];
    filters: { search?: string; user_id?: string; permission_id?: string; scope_type?: string; effect?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function UserPermissionOverridesIndex({ overrides, users, permissions, filters }: Props) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        user_id: filters.user_id ?? '',
        permission_id: filters.permission_id ?? '',
        scope_type: filters.scope_type ?? '',
        effect: filters.effect ?? '',
        is_active: filters.is_active ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const toggleActionMenu = (id: number | null) => {
        setOpenActionId((current) => (id === null ? null : current === id ? null : id));
    };

    const pagination = useMemo(() => ({
        previous: overrides.links.find((l) => l.label.includes('Previous')) ?? null,
        next: overrides.links.find((l) => l.label.includes('Next')) ?? null,
        pages: overrides.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
    }), [overrides.links]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            const element = event.target instanceof Element ? event.target : null;
            if (element?.closest('[data-searchable-select-root]') || element?.closest('[data-searchable-select-listbox]')) return;
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(target)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(upoIndex.url(), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const reset = { search: '', user_id: '', permission_id: '', scope_type: '', effect: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(upoIndex.url(), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const updatePerPage = (nextValue: string) => {
        const nextFilters = { ...form, per_page: nextValue, page: '1' };
        setForm((current) => ({ ...current, per_page: nextValue }));
        router.get(upoIndex.url(), nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(
                upoIndex.url(),
                { ...form, search: value, page: '1' },
                { preserveState: true, preserveScroll: true, replace: true, onCancelToken },
            );
        },
    });

    function confirmDelete(o: Override) {
        if (confirm(`Remove override for "${o.user?.name}"? This cannot be undone.`)) {
            router.delete(upoDestroy.url(o.id), { preserveScroll: true });
        }
    }

    function toggleActive(o: Override) {
        router.patch(upoUpdate.url(o.id), { is_active: !o.is_active }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Permission Overrides" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Permission Overrides' },
                ]}
                title="User Permission Overrides"
                description="Grant or deny specific permissions per user, overriding role defaults."
                actions={
                    <Can permission="access-control-manage">
                        <Link
                            href={upoCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Add Override
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Permission Overrides"
                description="Browse and manage all user permission overrides."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((current) => ({ ...current, search: value }))}
                            placeholder="Search by user name or email..."
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
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">User</label>
                                        <SearchableSelect value={form.user_id} onChange={(e) => setForm((c) => ({ ...c, user_id: e.target.value }))}>
                                            <option value="">All Users</option>
                                            {users.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Scope</label>
                                        <SearchableSelect value={form.scope_type} onChange={(e) => setForm((c) => ({ ...c, scope_type: e.target.value }))}>
                                            <option value="">All Scopes</option>
                                            <option value="global">Global</option>
                                            <option value="outlet">Outlet</option>
                                            <option value="central_warehouse">Central Warehouse</option>
                                            <option value="outlet_warehouse">Outlet Warehouse</option>
                                            <option value="outlet_department">Outlet Department</option>
                                            <option value="department_warehouse">Department Warehouse</option>
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Effect</label>
                                        <SearchableSelect value={form.effect} onChange={(e) => setForm((c) => ({ ...c, effect: e.target.value }))}>
                                            <option value="">All Effects</option>
                                            <option value="allow">Allow</option>
                                            <option value="deny">Deny</option>
                                        </SearchableSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((c) => ({ ...c, is_active: e.target.value }))}>
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
                                <span className="font-bold text-foreground dark:text-stone-100">{overrides.from ?? 0} - {overrides.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{overrides.total}</span>
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
                                        {tablePerPageOptions.map((option) => (
                                            <option key={option} value={option}>{option === 'all' ? 'All' : option}</option>
                                        ))}
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
                    <table className="w-full min-w-[750px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">User</th>
                                <th className="border-b border-border/10 px-6 py-4">Permission</th>
                                <th className="border-b border-border/10 px-6 py-4">Scope</th>
                                <th className="border-b border-border/10 px-6 py-4">Effect</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {overrides.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">
                                        No overrides found.
                                    </td>
                                </tr>
                            )}
                            {overrides.data.map((o) => (
                                <tr key={o.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{o.user?.name}</div>
                                                <div className="text-xs text-muted-foreground dark:text-stone-400">{o.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">{o.permission?.slug}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{o.scope_type.replace(/_/g, ' ')}</span>
                                            {o.outlet && <span className="text-xs text-muted-foreground">{o.outlet.name}</span>}
                                            {o.department && <span className="text-xs text-muted-foreground">{o.department.name}</span>}
                                            {o.warehouse && <span className="text-xs text-muted-foreground">{o.warehouse.name}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                            o.effect === 'allow'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                        )}>
                                            {o.effect}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                            o.is_active
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                        )}>
                                            {o.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === o.id}
                                            itemId={o.id}
                                            itemLabel={`${o.user?.name} → ${o.permission?.slug}`}
                                            onToggle={(id) => toggleActionMenu(id as number | null)}
                                            actions={[
                                                {
                                                    id: `toggle-${o.id}`,
                                                    label: o.is_active ? 'Deactivate' : 'Activate',
                                                    icon: o.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => toggleActive(o),
                                                },
                                                {
                                                    id: `delete-${o.id}`,
                                                    label: 'Remove override',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirmDelete(o),
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
