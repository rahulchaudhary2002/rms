import { Head, Link, useForm, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as usersIndex, show as usersShow, edit as usersEdit } from '@/routes/users';
import { store as urStore } from '@/routes/access-control/user-roles';
import { destroy as urDestroy } from '@/routes/access-control/user-roles';
import { store as upoStore, destroy as upoDestroy } from '@/routes/access-control/user-permission-overrides';
import { store as urpStore, destroy as urpDestroy } from '@/routes/access-control/user-resource-permissions';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AsyncResourceSelect } from '@/components/ui/async-resource-select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = { id: number; name: string; slug: string; level: string };
type Permission = { id: number; name: string; slug: string; module: string; action: string };
type ScopeType = { type: string; label: string };
type AssignedBy = { id: number; name: string } | null;

type RoleAssignment = {
    id: number; scope_type: string; scope_id: number | null; is_active: boolean;
    created_at: string; role: Role; assigned_by: AssignedBy;
};
type PermissionOverride = {
    id: number; scope_type: string; scope_id: number | null; effect: 'allow' | 'deny';
    reason: string | null; is_active: boolean; created_at: string;
    permission: Permission; assigned_by: AssignedBy;
};
type ResourcePermission = {
    id: number; resource_type: string; resource_id: number; effect: 'allow' | 'deny';
    reason: string | null; is_active: boolean; created_at: string;
    permission: Permission; assigned_by: AssignedBy;
};
type User = {
    id: number; name: string; email: string; is_superadmin: boolean;
    email_verified_at: string | null; created_at: string;
    role_assignments: RoleAssignment[];
    permission_overrides: PermissionOverride[];
    resource_permissions: ResourcePermission[];
};

type AllowedScopes = { outlet: number[]; warehouse: number[] } | null;
type AllowedResourceIds = { outlet_ids: number[]; warehouse_ids: number[] } | null;

type Props = {
    user: User;
    roles: Role[];
    permissions: Permission[];
    scopeTypes: ScopeType[];
    resourceTypes: ScopeType[];
    allowedScopes: AllowedScopes;
    allowedResourceIds: AllowedResourceIds;
    allowedScopeTypes: string[];
};

type Tab = 'overview' | 'roles' | 'overrides' | 'resources';

// ─── Small helpers ────────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
            active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                   : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
        )}>{active ? 'Active' : 'Inactive'}</span>
    );
}

function EffectBadge({ effect }: { effect: 'allow' | 'deny' }) {
    return (
        <span className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
            effect === 'allow' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                               : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        )}>{effect}</span>
    );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
    return (
        <tr><td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-muted-foreground">{label}</td></tr>
    );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function AssignRoleModal({ open, onClose, userId, roles, allowedScopes, returnUrl }: {
    open: boolean; onClose: () => void;
    userId: number; roles: Role[]; allowedScopes: AllowedScopes; returnUrl: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: String(userId),
        role_id: '',
        scope_type: 'global',
        scope_id: '',
        _redirect: returnUrl,
    });

    const selectedRole = roles.find((r) => String(r.id) === data.role_id) ?? null;

    function handleRoleChange(roleId: string) {
        const role = roles.find((r) => String(r.id) === roleId) ?? null;
        setData({ ...data, role_id: roleId, scope_type: role?.level ?? 'global', scope_id: '' });
    }

    function submit(e: { preventDefault(): void }) {
        e.preventDefault();
        post(urStore.url(), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Assign Role</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Role" error={errors.role_id}>
                        <SearchableSelect value={data.role_id} onChange={(e) => handleRoleChange(e.target.value)}>
                            <option value="">Select a role...</option>
                            {roles.map((r) => (
                                <option key={r.id} value={String(r.id)}>{r.name} ({r.level})</option>
                            ))}
                        </SearchableSelect>
                    </FormField>

                    <FormField label="Scope" error={errors.scope_type}>
                        <div className={cn(
                            'flex h-11 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm',
                            !selectedRole && 'text-muted-foreground',
                        )}>
                            {selectedRole
                                ? <><span className="font-semibold capitalize text-foreground">{selectedRole.level}</span><span className="ml-1.5 text-muted-foreground">- set by role level</span></>
                                : 'Select a role first'
                            }
                        </div>
                    </FormField>

                    {data.scope_type !== 'global' && selectedRole && (
                        <FormField label="Scope Resource" error={errors.scope_id}>
                            <AsyncResourceSelect
                                resourceType={data.scope_type}
                                value={data.scope_id}
                                onChange={(val) => setData('scope_id', val)}
                                allowedIds={allowedScopes ? (allowedScopes[data.scope_type as 'outlet' | 'warehouse'] ?? null) : null}
                                placeholder={`Select a ${data.scope_type}...`}
                            />
                        </FormField>
                    )}

                    <DialogFooter>
                        <button type="button" onClick={() => { reset(); onClose(); }}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">
                            Assign Role
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddOverrideModal({ open, onClose, userId, permissions, scopeTypes, allowedScopes, allowedScopeTypes, returnUrl }: {
    open: boolean; onClose: () => void;
    userId: number; permissions: Permission[]; scopeTypes: ScopeType[];
    allowedScopes: AllowedScopes; allowedScopeTypes: string[]; returnUrl: string;
}) {
    const defaultScopeType = allowedScopeTypes[0] ?? 'global';
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: String(userId),
        permission_id: '',
        scope_type: defaultScopeType,
        scope_id: '',
        effect: 'allow',
        reason: '',
        _redirect: returnUrl,
    });

    function submit(e: { preventDefault(): void }) {
        e.preventDefault();
        post(upoStore.url(), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add Permission Override</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Permission" error={errors.permission_id}>
                        <SearchableSelect value={data.permission_id} onChange={(e) => setData('permission_id', e.target.value)}>
                            <option value="">Select a permission...</option>
                            {permissions.map((p) => (
                                <option key={p.id} value={String(p.id)}>{p.slug}</option>
                            ))}
                        </SearchableSelect>
                    </FormField>

                    <FormField label="Effect" error={errors.effect}>
                        <SearchableSelect value={data.effect} onChange={(e) => setData('effect', e.target.value)}>
                            <option value="allow">Allow</option>
                            <option value="deny">Deny</option>
                        </SearchableSelect>
                    </FormField>

                    <FormField label="Scope Type" error={errors.scope_type}>
                        <SearchableSelect
                            value={data.scope_type}
                            onChange={(e) => { setData('scope_type', e.target.value); setData('scope_id', ''); }}
                        >
                            {allowedScopeTypes.includes('global') && <option value="global">Global</option>}
                            {scopeTypes.filter((st) => allowedScopeTypes.includes(st.type)).map((st) => (
                                <option key={st.type} value={st.type}>{st.label}</option>
                            ))}
                        </SearchableSelect>
                    </FormField>

                    {data.scope_type !== 'global' && (
                        <FormField label="Scope Resource" error={errors.scope_id}>
                            <AsyncResourceSelect
                                resourceType={data.scope_type}
                                value={data.scope_id}
                                onChange={(val) => setData('scope_id', val)}
                                allowedIds={allowedScopes ? (allowedScopes[data.scope_type as 'outlet' | 'warehouse'] ?? null) : null}
                                placeholder="Select a resource..."
                            />
                        </FormField>
                    )}

                    <FormField label="Reason (optional)" error={errors.reason}>
                        <Input value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="Why is this override needed?" />
                    </FormField>

                    <DialogFooter>
                        <button type="button" onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">
                            Save Override
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddResourceModal({ open, onClose, userId, permissions, resourceTypes, allowedResourceIds, returnUrl }: {
    open: boolean; onClose: () => void;
    userId: number; permissions: Permission[]; resourceTypes: ScopeType[];
    allowedResourceIds: AllowedResourceIds; returnUrl: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: String(userId),
        permission_id: '',
        resource_type: '',
        resource_id: '',
        effect: 'allow',
        reason: '',
        _redirect: returnUrl,
    });

    function submit(e: { preventDefault(): void }) {
        e.preventDefault();
        post(urpStore.url(), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle>Add Resource Permission</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label="Permission" error={errors.permission_id}>
                        <SearchableSelect value={data.permission_id} onChange={(e) => setData('permission_id', e.target.value)}>
                            <option value="">Select a permission...</option>
                            {permissions.map((p) => (
                                <option key={p.id} value={String(p.id)}>{p.slug}</option>
                            ))}
                        </SearchableSelect>
                    </FormField>

                    <FormField label="Resource Type" error={errors.resource_type}>
                        <SearchableSelect
                            value={data.resource_type}
                            onChange={(e) => { setData('resource_type', e.target.value); setData('resource_id', ''); }}
                        >
                            <option value="">Select a type...</option>
                            {resourceTypes.map((st) => (
                                <option key={st.type} value={st.type}>{st.label}</option>
                            ))}
                        </SearchableSelect>
                    </FormField>

                    <FormField label="Resource" error={errors.resource_id}>
                        <AsyncResourceSelect
                            resourceType={data.resource_type}
                            value={data.resource_id}
                            onChange={(val) => setData('resource_id', val)}
                            allowedIds={
                                allowedResourceIds && data.resource_type === 'outlet' ? allowedResourceIds.outlet_ids
                                : allowedResourceIds && data.resource_type === 'warehouse' ? allowedResourceIds.warehouse_ids
                                : null
                            }
                            placeholder="Select a resource..."
                            disabled={!data.resource_type}
                        />
                    </FormField>

                    <FormField label="Effect" error={errors.effect}>
                        <SearchableSelect value={data.effect} onChange={(e) => setData('effect', e.target.value)}>
                            <option value="allow">Allow</option>
                            <option value="deny">Deny</option>
                        </SearchableSelect>
                    </FormField>

                    <FormField label="Reason (optional)" error={errors.reason}>
                        <Input value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="Optional reason" />
                    </FormField>

                    <DialogFooter>
                        <button type="button" onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">
                            Save Permission
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const tabList: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',   label: 'Overview',             icon: 'person' },
    { id: 'roles',      label: 'Role Assignments',      icon: 'manage_accounts' },
    { id: 'overrides',  label: 'Permission Overrides',  icon: 'tune' },
    { id: 'resources',  label: 'Resource Permissions',  icon: 'rule' },
];

export default function UserShow({ user, roles, permissions, scopeTypes, resourceTypes, allowedScopes, allowedResourceIds, allowedScopeTypes }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [modal, setModal] = useState<'role' | 'override' | 'resource' | null>(null);
    const returnUrl = usersShow.url(user.id);

    function confirmDeleteRole(id: number) {
        if (confirm('Remove this role assignment?')) router.delete(urDestroy.url(id));
    }
    function confirmDeleteOverride(id: number) {
        if (confirm('Remove this permission override?')) router.delete(upoDestroy.url(id));
    }
    function confirmDeleteResource(id: number) {
        if (confirm('Remove this resource permission?')) router.delete(urpDestroy.url(id));
    }

    return (
        <>
            <Head title={user.name} />

            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Users', href: usersIndex.url() },
                    { label: user.name },
                ]}
                title={user.name}
                description={user.email}
                actions={
                    <Link href={usersEdit.url(user.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit User
                    </Link>
                }
            />

            {/* Tab bar */}
            <div className="mb-6 border-b border-border">
                <nav className="-mb-px flex gap-1">
                    {tabList.map((tab) => {
                        const count = tab.id === 'roles' ? user.role_assignments.length
                            : tab.id === 'overrides' ? user.permission_overrides.length
                            : tab.id === 'resources' ? user.resource_permissions.length
                            : null;
                        return (
                            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                                )}
                            >
                                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                {tab.label}
                                {count !== null && (
                                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{count}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {user.is_superadmin && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Superadmin
                                </span>
                            )}
                            <span className={cn(
                                'rounded-full px-3 py-1 text-[11px] font-bold tracking-wide',
                                user.email_verified_at
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                            )}>
                                {user.email_verified_at ? 'Verified' : 'Unverified'}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Account Details</h3>
                        <dl className="space-y-4">
                            {[
                                { label: 'Member since', value: new Date(user.created_at).toLocaleDateString() },
                                { label: 'Email verified', value: user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString() : '-' },
                                { label: 'Assigned roles', value: user.role_assignments.length },
                                { label: 'Permission overrides', value: user.permission_overrides.length },
                                { label: 'Resource permissions', value: user.resource_permissions.length },
                            ].map((item, i, arr) => (
                                <div key={item.label} className={cn('flex justify-between pb-3', i < arr.length - 1 && 'border-b border-border')}>
                                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                                    <dd className="text-sm font-semibold">{item.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}

            {/* Role Assignments */}
            {activeTab === 'roles' && (
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <h3 className="font-bold text-foreground">Role Assignments</h3>
                        <button type="button" onClick={() => setModal('role')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Assign Role
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[540px] text-left">
                            <thead>
                                <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900">
                                    <th className="border-b border-border/10 px-6 py-3">Role</th>
                                    <th className="border-b border-border/10 px-6 py-3">Level</th>
                                    <th className="border-b border-border/10 px-6 py-3">Scope</th>
                                    <th className="border-b border-border/10 px-6 py-3">Status</th>
                                    <th className="border-b border-border/10 px-6 py-3">Assigned By</th>
                                    <th className="border-b border-border/10 px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted dark:divide-stone-800">
                                {user.role_assignments.length === 0 && <EmptyRow colSpan={6} label="No roles assigned." />}
                                {user.role_assignments.map((ra) => (
                                    <tr key={ra.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-3">
                                            <span className="font-semibold text-foreground">{ra.role.name}</span>
                                            <span className="ml-2 font-mono text-xs text-muted-foreground">{ra.role.slug}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {ra.role.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground">
                                            {ra.scope_type === 'global' ? 'Global' : `${ra.scope_type} #${ra.scope_id}`}
                                        </td>
                                        <td className="px-6 py-3"><ActiveBadge active={ra.is_active} /></td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground">{ra.assigned_by?.name ?? '-'}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button type="button" onClick={() => confirmDeleteRole(ra.id)}
                                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Permission Overrides */}
            {activeTab === 'overrides' && (
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <h3 className="font-bold text-foreground">Permission Overrides</h3>
                        <button type="button" onClick={() => setModal('override')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Add Override
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[580px] text-left">
                            <thead>
                                <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900">
                                    <th className="border-b border-border/10 px-6 py-3">Permission</th>
                                    <th className="border-b border-border/10 px-6 py-3">Effect</th>
                                    <th className="border-b border-border/10 px-6 py-3">Scope</th>
                                    <th className="border-b border-border/10 px-6 py-3">Status</th>
                                    <th className="border-b border-border/10 px-6 py-3">Reason</th>
                                    <th className="border-b border-border/10 px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted dark:divide-stone-800">
                                {user.permission_overrides.length === 0 && <EmptyRow colSpan={6} label="No permission overrides." />}
                                {user.permission_overrides.map((po) => (
                                    <tr key={po.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-3 font-mono text-xs text-foreground">{po.permission.slug}</td>
                                        <td className="px-6 py-3"><EffectBadge effect={po.effect} /></td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground">
                                            {po.scope_type === 'global' ? 'Global' : `${po.scope_type} #${po.scope_id}`}
                                        </td>
                                        <td className="px-6 py-3"><ActiveBadge active={po.is_active} /></td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground">{po.reason ?? '-'}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button type="button" onClick={() => confirmDeleteOverride(po.id)}
                                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Resource Permissions */}
            {activeTab === 'resources' && (
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <h3 className="font-bold text-foreground">Resource Permissions</h3>
                        <button type="button" onClick={() => setModal('resource')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Add Permission
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[580px] text-left">
                            <thead>
                                <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900">
                                    <th className="border-b border-border/10 px-6 py-3">Permission</th>
                                    <th className="border-b border-border/10 px-6 py-3">Effect</th>
                                    <th className="border-b border-border/10 px-6 py-3">Resource</th>
                                    <th className="border-b border-border/10 px-6 py-3">Status</th>
                                    <th className="border-b border-border/10 px-6 py-3">Reason</th>
                                    <th className="border-b border-border/10 px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted dark:divide-stone-800">
                                {user.resource_permissions.length === 0 && <EmptyRow colSpan={6} label="No resource permissions." />}
                                {user.resource_permissions.map((rp) => (
                                    <tr key={rp.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-3 font-mono text-xs text-foreground">{rp.permission.slug}</td>
                                        <td className="px-6 py-3"><EffectBadge effect={rp.effect} /></td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground">
                                            {rp.resource_type} #{rp.resource_id}
                                        </td>
                                        <td className="px-6 py-3"><ActiveBadge active={rp.is_active} /></td>
                                        <td className="px-6 py-3 text-sm text-muted-foreground">{rp.reason ?? '-'}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button type="button" onClick={() => confirmDeleteResource(rp.id)}
                                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AssignRoleModal
                open={modal === 'role'}
                onClose={() => setModal(null)}
                userId={user.id}
                roles={roles}
                allowedScopes={allowedScopes}
                returnUrl={returnUrl}
            />
            <AddOverrideModal
                open={modal === 'override'}
                onClose={() => setModal(null)}
                userId={user.id}
                permissions={permissions}
                scopeTypes={scopeTypes}
                allowedScopes={allowedScopes}
                allowedScopeTypes={allowedScopeTypes}
                returnUrl={returnUrl}
            />
            <AddResourceModal
                open={modal === 'resource'}
                onClose={() => setModal(null)}
                userId={user.id}
                permissions={permissions}
                resourceTypes={resourceTypes}
                allowedResourceIds={allowedResourceIds}
                returnUrl={returnUrl}
            />
        </>
    );
}
