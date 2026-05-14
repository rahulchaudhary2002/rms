import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as usersIndex, create as usersCreate, show as usersShow, edit as usersEdit, destroy as usersDestroy } from '@/routes/users';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { ActionDropdown } from '@/components/action-dropdown';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';

type User = {
    id: number;
    name: string;
    email: string;
    is_superadmin: boolean;
    email_verified_at: string | null;
    created_at: string;
    role_assignments_count: number;
    permission_overrides_count: number;
};

type PaginatedUsers = {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    users: PaginatedUsers;
    filters: { search?: string; verified?: string; per_page?: string };
};

function cleanLabel(label: string) {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

export default function UsersIndex({ users, filters }: Props) {
    const [form, setForm] = useState({
        search: filters.search ?? '',
        verified: filters.verified ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(() => ({
        previous: users.links.find((l) => l.label.includes('Previous')) ?? null,
        next: users.links.find((l) => l.label.includes('Next')) ?? null,
        pages: users.links.filter((l) => /^\d+$/.test(cleanLabel(l.label))),
    }), [users.links]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const el = e.target instanceof Element ? e.target : null;
            if (el?.closest('[data-searchable-select-root]') || el?.closest('[data-searchable-select-listbox]')) return;
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(usersIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', verified: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(usersIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (value: string) => {
        setForm((f) => ({ ...f, per_page: value }));
        router.get(usersIndex.url(), { ...form, per_page: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(usersIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    function confirmDelete(user: User) {
        if (confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
            router.delete(usersDestroy.url(user.id));
        }
    }

    return (
        <>
            <Head title="Users" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Users' },
                ]}
                title="Users"
                description="Manage system accounts and superadmin access."
                actions={
                    <Link
                        href={usersCreate.url()}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                    >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        New User
                    </Link>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Users"
                description="All registered accounts."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((f) => ({ ...f, search: value }))}
                            placeholder="Search by name or email..."
                            className="w-full lg:w-64"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
                        />
                        <details ref={filterPopoverRef} className="relative">
                            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border/30 bg-card px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted dark:border-border dark:hover:bg-accent">
                                <Filter className="h-4 w-4" />
                                Filter
                            </summary>
                            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-card p-5 shadow-xl">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground">Table Filters</h4>
                                    <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline" onClick={clearFilters}>
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Email Verified</label>
                                        <SearchableSelect value={form.verified} onChange={(e) => setForm((f) => ({ ...f, verified: e.target.value }))}>
                                            <option value="">All</option>
                                            <option value="true">Verified</option>
                                            <option value="false">Unverified</option>
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
                            <p className="text-xs font-medium text-muted-foreground">
                                Showing{' '}
                                <span className="font-bold text-foreground">{users.from ?? 0} – {users.to ?? 0}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground">{users.total}</span>
                                {' '}results
                            </p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Items per page</span>
                                <div className="relative">
                                    <select
                                        value={form.per_page}
                                        onChange={(e) => updatePerPage(e.target.value)}
                                        className="h-9 appearance-none rounded-md border border-border bg-card px-3 pr-8 text-[11px] font-bold text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                                    pagination.previous?.url ? 'text-muted-foreground hover:bg-accent' : 'pointer-events-none text-muted-foreground/40',
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
                                            link.active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-accent',
                                            !link.url && 'pointer-events-none opacity-40',
                                        )}
                                    >
                                        {cleanLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={pagination.next?.url ?? '#'}
                                preserveScroll
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors',
                                    pagination.next?.url ? 'text-foreground hover:bg-accent' : 'pointer-events-none text-muted-foreground/40',
                                )}
                            >
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                        </nav>
                    </>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                <th className="border-b border-border/10 px-6 py-4">User</th>
                                <th className="border-b border-border/10 px-6 py-4">Roles</th>
                                <th className="border-b border-border/10 px-6 py-4">Verified</th>
                                <th className="border-b border-border/10 px-6 py-4">Joined</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">No users found.</td>
                                </tr>
                            )}
                            {users.data.map((user) => (
                                <tr key={user.id} className="group transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <Link
                                                    href={usersShow.url(user.id)}
                                                    className="block font-bold text-foreground transition-colors hover:text-primary"
                                                >
                                                    {user.name}
                                                </Link>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {user.role_assignments_count}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                            user.email_verified_at
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                        )}>
                                            {user.email_verified_at ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === user.id}
                                            itemId={user.id}
                                            itemLabel={user.name}
                                            onToggle={(id) => setOpenActionId((cur) => (id === null ? null : cur === id ? null : id as number))}
                                            actions={[
                                                { id: `edit-${user.id}`, label: 'Edit user', icon: 'edit', href: usersEdit.url(user.id) },
                                                {
                                                    id: `delete-${user.id}`,
                                                    label: 'Delete user',
                                                    icon: 'delete',
                                                    variant: 'danger',
                                                    onClick: () => confirmDelete(user),
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
