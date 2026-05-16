import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as urIndex, create as urCreate, destroy as urDestroy, update as urUpdate } from '@/routes/access-control/user-roles';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

type User = { id: number; name: string; email: string };
type ScopeTarget = { id: number; name: string } | null;
type Assignment = {
    id: number;
    user: User;
    role: Role;
    scope_type: string;
    outlet_id: number | null;
    outlet_department_id: number | null;
    warehouse_id: number | null;
    outlet: ScopeTarget;
    department: ScopeTarget;
    warehouse: ScopeTarget;
    is_active: boolean;
    assigned_by: User | null;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
};
type PaginatedAssignments = {
    data: Assignment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    assignments: PaginatedAssignments;
    users: User[];
    roles: Role[];
    filters: { search?: string; user_id?: string; role_id?: string; scope_type?: string; is_active?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function UserRolesIndex({ assignments, users, roles, filters }: Props) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        user_id: filters.user_id ?? '',
        role_id: filters.role_id ?? '',
        scope_type: filters.scope_type ?? '',
        is_active: filters.is_active ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const toggleActionMenu = (id: number | null) => {
        setOpenActionId((current) => (id === null ? null : current === id ? null : id));
    };

    const pagination = useMemo(() => ({
        previous: assignments.links.find((l) => l.label.includes('Previous')) ?? null,
        next: assignments.links.find((l) => l.label.includes('Next')) ?? null,
        pages: assignments.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
    }), [assignments.links]);

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
        router.get(urIndex.url(), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const reset = { search: '', user_id: '', role_id: '', scope_type: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(urIndex.url(), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const updatePerPage = (nextValue: string) => {
        const nextFilters = { ...form, per_page: nextValue, page: '1' };
        setForm((current) => ({ ...current, per_page: nextValue }));
        router.get(urIndex.url(), nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(
                urIndex.url(),
                { ...form, search: value, page: '1' },
                { preserveState: true, preserveScroll: true, replace: true, onCancelToken },
            );
        },
    });

    function confirmDelete(assignment: Assignment) {
        if (confirm(`Remove role "${assignment.role?.name}" from "${assignment.user?.name}"? This cannot be undone.`)) {
            router.delete(urDestroy.url(assignment.id), { preserveScroll: true });
        }
    }

    function toggleActive(assignment: Assignment) {
        router.patch(urUpdate.url(assignment.id), { is_active: !assignment.is_active }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="User Role Assignments" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'User Roles' },
                ]}
                title="User Role Assignments"
                description="Assign roles to users with optional scope."
                actions={
                    <Can permission="access-control-manage">
                        <Link
                            href={urCreate.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Assign Role
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Role Assignments"
                description="Browse and manage all user role assignments."
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
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Role</label>
                                        <SearchableSelect value={form.role_id} onChange={(e) => setForm((c) => ({ ...c, role_id: e.target.value }))}>
                                            <option value="">All Roles</option>
                                            {roles.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
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
                                <span className="font-bold text-foreground dark:text-stone-100">{assignments.from ?? 0} - {assignments.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{assignments.total}</span>
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
                                <th className="border-b border-border/10 px-6 py-4">User</th>
                                <th className="border-b border-border/10 px-6 py-4">Role</th>
                                <th className="border-b border-border/10 px-6 py-4">Scope</th>
                                <th className="border-b border-border/10 px-6 py-4">Assigned By</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {assignments.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">
                                        No assignments found.
                                    </td>
                                </tr>
                            )}
                            {assignments.data.map((a) => (
                                <tr key={a.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{a.user?.name}</div>
                                                <div className="text-xs text-muted-foreground dark:text-stone-400">{a.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{a.role?.name}</span>
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 w-fit">
                                                {a.role?.level}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="capitalize text-sm text-gray-700 dark:text-gray-300">{a.scope_type.replace(/_/g, ' ')}</span>
                                            {a.outlet && <span className="text-xs text-muted-foreground">{a.outlet.name}</span>}
                                            {a.department && <span className="text-xs text-muted-foreground">{a.department.name}</span>}
                                            {a.warehouse && <span className="text-xs text-muted-foreground">{a.warehouse.name}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                        {a.assigned_by?.name ?? '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                            a.is_active
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                        )}>
                                            {a.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === a.id}
                                            itemId={a.id}
                                            itemLabel={`${a.user?.name} → ${a.role?.name}`}
                                            onToggle={(id) => toggleActionMenu(id as number | null)}
                                            actions={[
                                                {
                                                    id: `toggle-${a.id}`,
                                                    label: a.is_active ? 'Deactivate' : 'Activate',
                                                    icon: a.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => toggleActive(a),
                                                },
                                                {
                                                    id: `delete-${a.id}`,
                                                    label: 'Remove assignment',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirmDelete(a),
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
