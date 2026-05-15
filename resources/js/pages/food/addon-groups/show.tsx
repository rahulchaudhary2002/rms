import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Can } from '@/components/can';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { destroy as groupsDestroy, edit as groupsEdit, index as groupsIndex, toggleStatus as groupsToggleStatus } from '@/routes/addon-groups';
import type { Addon, AddonGroup } from '@/types';

type Props = {
    group: AddonGroup;
};

type Tab = 'overview' | 'addons';

const addonCreateUrl = (groupId: number) => `/addons/create?addon_group_id=${groupId}`;
const addonShowUrl = (id: number) => `/addons/${id}`;
const addonEditUrl = (id: number) => `/addons/${id}/edit`;

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
            active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
        )}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
    return (
        <tr>
            <td colSpan={cols} className="px-6 py-10 text-center text-sm text-muted-foreground">{label}</td>
        </tr>
    );
}

function AddonsTable({ addons }: { addons: Addon[] }) {
    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-bold text-foreground">Add-ons</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                    <thead>
                        <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900">
                            <th className="border-b border-border/10 px-6 py-3">Name</th>
                            <th className="border-b border-border/10 px-6 py-3">Price</th>
                            <th className="border-b border-border/10 px-6 py-3">Order</th>
                            <th className="border-b border-border/10 px-6 py-3">Recipe</th>
                            <th className="border-b border-border/10 px-6 py-3">Status</th>
                            <th className="border-b border-border/10 px-6 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-muted dark:divide-stone-800">
                        {addons.length === 0 && <EmptyRow cols={6} label="No add-ons yet. Create an add-on for this group." />}
                        {addons.map((addon) => (
                            <tr key={addon.id} className="hover:bg-muted/50">
                                <td className="px-6 py-3">
                                    <Link href={addonShowUrl(addon.id)} className="font-semibold text-foreground hover:text-primary">
                                        {addon.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-3 font-mono text-sm text-muted-foreground">Rs. {Number(addon.price).toFixed(2)}</td>
                                <td className="px-6 py-3 text-sm text-muted-foreground">{addon.sort_order}</td>
                                <td className="px-6 py-3">
                                    <span className={cn(
                                        'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                        addon.is_recipe_enabled
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                    )}>
                                        {addon.is_recipe_enabled ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-6 py-3"><StatusBadge active={addon.is_active} /></td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link href={addonEditUrl(addon.id)} title="Edit add-on" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </Link>
                                        <button type="button" title={addon.is_active ? 'Deactivate' : 'Activate'} onClick={() => router.patch(`/addons/${addon.id}/toggle-status`, {}, { preserveScroll: true })}
                                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                            <span className="material-symbols-outlined text-[18px]">{addon.is_active ? 'toggle_off' : 'toggle_on'}</span>
                                        </button>
                                        <button type="button" title="Delete add-on" onClick={() => {
                                            if (confirm(`Delete add-on "${addon.name}"?`)) {
                                                router.delete(`/addons/${addon.id}`);
                                            }
                                        }}
                                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AddonGroupShow({ group }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const addons = group.addons ?? [];
    const tabList: { id: Tab; label: string; icon: string; count?: number }[] = [
        { id: 'overview', label: 'Overview', icon: 'layers' },
        { id: 'addons', label: 'Add-ons', icon: 'extension', count: addons.length },
    ];

    return (
        <>
            <Head title={group.name} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Add-on Groups', href: groupsIndex.url() },
                    { label: group.name },
                ]}
                title={group.name}
                description={`${group.is_required ? 'Required' : 'Optional'} group · ${addons.length} add-on${addons.length === 1 ? '' : 's'}`}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Can permission="addon-groups-update">
                            <Link href={addonCreateUrl(group.id)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90">
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                New Add-on
                            </Link>
                        </Can>
                        <Can permission="addon-groups-update">
                            <Link href={groupsEdit.url(group.id)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Edit Group
                            </Link>
                        </Can>
                    </div>
                }
            />

            <div className="mb-6 border-b border-border">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {tabList.map((tab) => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                            )}>
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                            {tab.count != null && tab.count > 0 && (
                                <span className="ml-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[32px]">layers</span>
                        </div>
                        <h2 className="text-lg font-bold text-foreground">{group.name}</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <StatusBadge active={group.is_active} />
                            <span className={cn(
                                'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                group.is_required
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                            )}>
                                {group.is_required ? 'Required' : 'Optional'}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Group Details</h3>
                        <dl className="space-y-3.5">
                            {[
                                { label: 'Minimum selection', value: group.min_select },
                                { label: 'Maximum selection', value: group.max_select ?? 'Unlimited' },
                                { label: 'Sort order', value: group.sort_order },
                                { label: 'Add-ons', value: addons.length },
                                { label: 'Active add-ons', value: addons.filter((addon) => addon.is_active).length },
                            ].map((item, i, arr) => (
                                <div key={item.label} className={cn('flex justify-between py-1', i < arr.length - 1 && 'border-b border-border/50')}>
                                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                                    <dd className="text-sm font-semibold">{String(item.value)}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}

            {activeTab === 'addons' && <AddonsTable addons={addons} />}

            <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => router.patch(groupsToggleStatus.url(group.id), {}, { preserveScroll: true })}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    <span className="material-symbols-outlined text-[18px]">{group.is_active ? 'toggle_off' : 'toggle_on'}</span>
                    {group.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" onClick={() => {
                    if (confirm(`Delete add-on group "${group.name}"?`)) {
                        router.delete(groupsDestroy.url(group.id));
                    }
                }}
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete Group
                </button>
            </div>
        </>
    );
}
