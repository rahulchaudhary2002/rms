import { Head, Link, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as rolesIndex, edit as rolesEdit } from '@/routes/access-control/roles';
import { store as rolePermissionsStore, destroy as rolePermissionsDestroy } from '@/routes/access-control/role-permissions';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

type Permission = {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    level: string;
};

type Props = {
    role: Role & { permissions: Permission[] };
    permissions: Permission[];
};

type Tab = 'overview' | 'permissions';

function groupByModule(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
        (acc[p.module] ??= []).push(p);
        return acc;
    }, {});
}

export default function RoleShow({ role, permissions }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [processing, setProcessing] = useState<number | null>(null);
    const [openModules, setOpenModules] = useState<Set<string>>(new Set());

    const assignedIds = new Set(role.permissions.map((p) => p.id));

    function togglePermission(permission: Permission) {
        const has = assignedIds.has(permission.id);
        setProcessing(permission.id);

        if (has) {
            router.delete(rolePermissionsDestroy.url(), {
                data: { role_id: role.id, permission_id: permission.id },
                preserveScroll: true,
                onFinish: () => setProcessing(null),
            });
        } else {
            router.post(
                rolePermissionsStore.url(),
                { role_id: role.id, permission_ids: [permission.id] },
                { preserveScroll: true, onFinish: () => setProcessing(null) },
            );
        }
    }

    const grouped = groupByModule(permissions);

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: 'info' },
        { id: 'permissions', label: 'Permissions', icon: 'lock' },
    ];

    return (
        <>
            <Head title={`Role: ${role.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Roles', href: rolesIndex.url() },
                    { label: role.name },
                ]}
                title={role.name}
                description={role.description ?? 'View role details and manage permissions.'}
                actions={
                    <Link
                        href={rolesEdit.url(role.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border/30 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted dark:border-border dark:bg-card dark:hover:bg-accent"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit Role
                    </Link>
                }
            />

            {/* Tabs */}
            <div className="mb-6 border-b border-border">
                <nav className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border/30 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                        <h3 className="mb-4 text-sm font-bold tracking-wider text-muted-foreground uppercase">
                            Role Details
                        </h3>
                        <dl className="space-y-4">
                            <div className="flex justify-between gap-4">
                                <dt className="text-sm text-muted-foreground">Name</dt>
                                <dd className="text-sm font-semibold text-foreground">{role.name}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-sm text-muted-foreground">Slug</dt>
                                <dd className="font-mono text-xs text-muted-foreground">{role.slug}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-sm text-muted-foreground">Level</dt>
                                <dd>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                        {role.level}
                                    </span>
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-sm text-muted-foreground">Rank</dt>
                                <dd className="font-mono text-sm text-muted-foreground">{role.rank}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-sm text-muted-foreground">Assignable</dt>
                                <dd>
                                    <span className={cn(
                                        'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                        role.is_assignable
                                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                    )}>
                                        {role.is_assignable ? 'Yes' : 'No'}
                                    </span>
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-sm text-muted-foreground">Status</dt>
                                <dd>
                                    <span className={cn(
                                        'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                        role.is_active
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                    )}>
                                        {role.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                            {role.is_system && (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-sm text-muted-foreground">Type</dt>
                                    <dd><Badge variant="secondary">System Role</Badge></dd>
                                </div>
                            )}
                            {role.description && (
                                <div className="pt-2">
                                    <dt className="mb-1 text-sm text-muted-foreground">Description</dt>
                                    <dd className="text-sm text-foreground">{role.description}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="rounded-xl border border-border/30 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                        <h3 className="mb-4 text-sm font-bold tracking-wider text-muted-foreground uppercase">
                            Assigned Permissions
                        </h3>
                        {role.permissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No permissions assigned.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.map((p) => (
                                    <span
                                        key={p.id}
                                        className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                                    >
                                        {p.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
                <div className="space-y-2">
                    {Object.entries(grouped).map(([module, perms]) => {
                        const moduleAssigned = perms.filter((p) => assignedIds.has(p.id)).length;
                        const expanded = openModules.has(module);

                        const toggleModule = () =>
                            setOpenModules((prev) => {
                                const next = new Set(prev);
                                next.has(module) ? next.delete(module) : next.add(module);
                                return next;
                            });

                        return (
                            <div
                                key={module}
                                className="overflow-hidden rounded-xl border border-border/30 bg-white shadow-sm dark:border-border dark:bg-card"
                            >
                                {/* Accordion header */}
                                <button
                                    type="button"
                                    onClick={toggleModule}
                                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted dark:hover:bg-accent"
                                >
                                    <span className={cn('material-symbols-outlined text-sm transition-transform', expanded && 'rotate-90')}>
                                        chevron_right
                                    </span>
                                    <span className="material-symbols-outlined text-sm text-primary">folder</span>
                                    <span className="flex-1 text-sm font-bold capitalize text-foreground">{module}</span>
                                    <span className={cn(
                                        'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                                        moduleAssigned > 0
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-muted text-muted-foreground',
                                    )}>
                                        {moduleAssigned} / {perms.length}
                                    </span>
                                </button>

                                {/* Accordion body */}
                                <div className={cn(
                                    'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                    expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                )}>
                                    <div className="overflow-hidden">
                                        <div className="divide-y divide-border/10 border-t border-border/20 dark:divide-border dark:border-border">
                                            {perms.map((permission) => {
                                                const assigned = assignedIds.has(permission.id);
                                                const busy = processing === permission.id;

                                                return (
                                                    <label
                                                        key={permission.id}
                                                        className={cn(
                                                            'flex cursor-pointer items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted dark:hover:bg-accent',
                                                            busy && 'pointer-events-none opacity-60',
                                                        )}
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground">{permission.name}</p>
                                                            <p className="font-mono text-xs text-muted-foreground">{permission.slug}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => togglePermission(permission)}
                                                            className={cn(
                                                                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50',
                                                                assigned ? 'bg-primary' : 'bg-muted-foreground/30',
                                                            )}
                                                            role="switch"
                                                            aria-checked={assigned}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                                                                    assigned ? 'translate-x-5' : 'translate-x-0.5',
                                                                )}
                                                            />
                                                        </button>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
