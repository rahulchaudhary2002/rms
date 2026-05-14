import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, Filter, Minus, Plus } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as rpIndex, store as rpStore, destroy as rpDestroy } from '@/routes/access-control/role-permissions';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import type { Permission, Role } from '@/types';

type RoleWithPermissions = Role & { permissions: Permission[]; permissions_count: number };

type PaginatedRoles = {
    data: RoleWithPermissions[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    roles: PaginatedRoles;
    permissions: Permission[];
    filters: { search?: string; level?: string; per_page?: string };
};

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function RolePermissionsIndex({ roles, permissions, filters }: Props) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        level: filters.level ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [expanded, setExpanded] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const permsByModule = useMemo(() => {
        return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
            if (!acc[p.module]) acc[p.module] = [];
            acc[p.module].push(p);
            return acc;
        }, {});
    }, [permissions]);

    const pagination = useMemo(() => ({
        previous: roles.links.find((l) => l.label.includes('Previous')) ?? null,
        next: roles.links.find((l) => l.label.includes('Next')) ?? null,
        pages: roles.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
    }), [roles.links]);

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
        router.get(rpIndex.url(), form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const reset = { search: '', level: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(rpIndex.url(), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const updatePerPage = (nextValue: string) => {
        const nextFilters = { ...form, per_page: nextValue, page: '1' };
        setForm((current) => ({ ...current, per_page: nextValue }));
        router.get(rpIndex.url(), nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(
                rpIndex.url(),
                { ...form, search: value, page: '1' },
                { preserveState: true, preserveScroll: true, replace: true, onCancelToken },
            );
        },
    });

    function toggle(permId: number, role: RoleWithPermissions) {
        const has = role.permissions.some((p) => p.id === permId);
        if (has) {
            router.delete(rpDestroy.url(), {
                data: { role_id: role.id, permission_id: permId },
                preserveScroll: true,
            });
        } else {
            router.post(rpStore.url(), {
                role_id: role.id,
                permission_ids: [permId],
            }, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Role Permissions" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Role Permissions' },
                ]}
                title="Role Permissions"
                description="Assign and manage permissions for each role."
            />

            <TableCard
                className="overflow-visible"
                title="Role Permissions"
                description="Click a role to expand and toggle its permissions."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((current) => ({ ...current, search: value }))}
                            placeholder="Search roles..."
                            className="w-full lg:w-auto"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
                        />
                        <details ref={filterPopoverRef} className="relative">
                            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border/30 bg-white px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent">
                                <Filter className="h-4 w-4" />
                                Filter
                            </summary>
                            <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border/20 bg-white p-5 shadow-2xl dark:border-border dark:bg-card">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground dark:text-stone-100">Table Filters</h4>
                                    <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline" onClick={clearFilters}>
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Level</label>
                                        <SearchableSelect value={form.level} onChange={(e) => setForm((c) => ({ ...c, level: e.target.value }))}>
                                            <option value="">All Levels</option>
                                            <option value="global">Global</option>
                                            <option value="outlet">Outlet</option>
                                            <option value="warehouse">Warehouse</option>
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
                                <span className="font-bold text-foreground dark:text-stone-100">{roles.from ?? 0} - {roles.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground dark:text-stone-100">{roles.total}</span>
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
                <div className="divide-y divide-muted dark:divide-stone-800">
                    {roles.data.length === 0 && (
                        <div className="px-6 py-12 text-center text-sm text-muted-foreground dark:text-stone-400">
                            No roles found.
                        </div>
                    )}
                    {roles.data.map((role) => (
                        <div key={role.id}>
                            <button
                                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/50 dark:hover:bg-stone-900/50"
                                onClick={() => setExpanded(expanded === role.id ? null : role.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined text-[16px]">shield</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{role.name}</span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                            {role.level}
                                        </span>
                                        {role.is_system && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-muted-foreground dark:text-stone-400">
                                        {role.permissions_count} permission{role.permissions_count !== 1 ? 's' : ''}
                                    </span>
                                    <ChevronDown className={cn(
                                        'h-4 w-4 text-muted-foreground transition-transform duration-300',
                                        expanded === role.id && 'rotate-180',
                                    )} />
                                </div>
                            </button>

                            <div className={cn(
                                'grid transition-all duration-300 ease-in-out',
                                expanded === role.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                            )}>
                                <div className="overflow-hidden">
                                    <div className="border-t border-border/10 bg-muted/20 px-6 py-5 dark:bg-stone-900/30">
                                        {Object.keys(permsByModule).length === 0 && (
                                            <p className="text-sm text-muted-foreground">No permissions available.</p>
                                        )}
                                        <div className="space-y-5">
                                            {Object.entries(permsByModule).map(([module, perms]) => (
                                                <div key={module}>
                                                    <h4 className="mb-2.5 text-[10px] font-bold tracking-[0.12em] text-muted-foreground/70 uppercase dark:text-stone-500">
                                                        {module}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {perms.map((perm) => {
                                                            const has = role.permissions.some((p) => p.id === perm.id);
                                                            return (
                                                                <button
                                                                    key={perm.id}
                                                                    onClick={() => toggle(perm.id, role)}
                                                                    title={perm.slug}
                                                                    className={cn(
                                                                        'flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold transition-all',
                                                                        has
                                                                            ? 'border-primary bg-primary text-white shadow-sm hover:bg-primary/90'
                                                                            : 'border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:text-primary dark:hover:border-primary/40',
                                                                    )}
                                                                >
                                                                    {has
                                                                        ? <Minus className="h-3 w-3" />
                                                                        : <Plus className="h-3 w-3" />
                                                                    }
                                                                    {perm.action}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </TableCard>
        </>
    );
}
