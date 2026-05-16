import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { QuickCreateOutletDepartmentModal, QuickCreateOutletModal, QuickCreateRoleModal, QuickCreateUserModal, QuickCreateWarehouseModal } from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as urIndex, store as urStore } from '@/routes/access-control/user-roles';
import type { Outlet, OutletDepartment, Role, ScopeType, Warehouse } from '@/types';

type User = { id: number; name: string; email: string };
type AllowedScopes = { outlet: number[]; outlet_warehouse: number[]; outlet_department: number[]; department_warehouse: number[]; central_warehouse: number[] } | null;
type CurrentScope = { type: string; outlet_id: string; outlet_department_id: string; warehouse_id: string };

type Props = {
    users: User[];
    roles: Role[];
    outlets: Outlet[];
    departments: OutletDepartment[];
    warehouses: Warehouse[];
    allowedScopes: AllowedScopes;
    currentScope: CurrentScope;
};

const SCOPE_NEEDS: Record<string, { outlet: boolean; department: boolean; warehouse: boolean }> = {
    global:               { outlet: false, department: false, warehouse: false },
    central_warehouse:    { outlet: false, department: false, warehouse: true  },
    outlet:               { outlet: true,  department: false, warehouse: false },
    outlet_warehouse:     { outlet: true,  department: false, warehouse: true  },
    outlet_department:    { outlet: true,  department: true,  warehouse: false },
    department_warehouse: { outlet: true,  department: true,  warehouse: true  },
};

export default function UserRolesCreate({ users, roles, outlets, departments, warehouses, allowedScopes, currentScope }: Props) {
    const { can } = useCan();
    const [modal, setModal] = useState<'user' | 'role' | 'outlet' | 'dept' | 'warehouse' | null>(null);

    const locked = {
        outlet:     ['outlet', 'outlet_warehouse', 'outlet_department', 'department_warehouse'].includes(currentScope.type),
        department: ['outlet_department', 'department_warehouse'].includes(currentScope.type),
        warehouse:  ['central_warehouse', 'outlet_warehouse', 'department_warehouse'].includes(currentScope.type),
    };

    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        role_id: '',
        scope_type: 'global' as ScopeType,
        outlet_id: currentScope.outlet_id,
        outlet_department_id: currentScope.outlet_department_id,
        warehouse_id: currentScope.warehouse_id,
        is_active: true,
        starts_at: '',
        ends_at: '',
    });

    const selectedRole = roles.find((r) => String(r.id) === data.role_id) ?? null;
    const needs = SCOPE_NEEDS[data.scope_type] ?? SCOPE_NEEDS.global;

    function handleRoleChange(roleId: string) {
        const role = roles.find((r) => String(r.id) === roleId) ?? null;
        setData({
            ...data,
            role_id: roleId,
            scope_type: (role?.level ?? 'global') as ScopeType,
            outlet_id: locked.outlet ? currentScope.outlet_id : '',
            outlet_department_id: locked.department ? currentScope.outlet_department_id : '',
            warehouse_id: locked.warehouse ? currentScope.warehouse_id : '',
        });
    }

    const allowedOutlets = useMemo(() => {
        if (!allowedScopes) return outlets;
        return outlets.filter((o) => allowedScopes.outlet.includes(o.id));
    }, [outlets, allowedScopes]);

    const filteredDepartments = useMemo(() => {
        if (!data.outlet_id) return departments;
        let filtered = departments.filter((d) => String(d.outlet_id) === data.outlet_id);
        if (allowedScopes) filtered = filtered.filter((d) => allowedScopes.outlet_department.includes(d.id));
        return filtered;
    }, [departments, data.outlet_id, allowedScopes]);

    const filteredWarehouses = useMemo(() => {
        const scopeType = data.scope_type;
        let filtered = warehouses;
        if (scopeType === 'central_warehouse') {
            filtered = filtered.filter((w) => w.type === 'central');
            if (allowedScopes) filtered = filtered.filter((w) => allowedScopes.central_warehouse.includes(w.id));
        } else if (scopeType === 'outlet_warehouse') {
            filtered = filtered.filter((w) => w.type === 'outlet' && String(w.outlet_id) === data.outlet_id);
            if (allowedScopes) filtered = filtered.filter((w) => allowedScopes.outlet_warehouse.includes(w.id));
        } else if (scopeType === 'department_warehouse') {
            filtered = filtered.filter((w) => w.type === 'department' && String(w.outlet_department_id) === data.outlet_department_id);
            if (allowedScopes) filtered = filtered.filter((w) => allowedScopes.department_warehouse.includes(w.id));
        }
        return filtered;
    }, [warehouses, allowedScopes, data.scope_type, data.outlet_id, data.outlet_department_id]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(urStore.url());
    }

    return (
        <>
            <Head title="Assign Role" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'User Roles', href: urIndex.url() },
                    { label: 'Assign Role' },
                ]}
                title="Assign Role"
                description="Assign a role to a user. The scope is determined by the role's level."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Role Assignment"
                    description="Select the user and role. Scope fields appear based on the role's level."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="User" error={errors.user_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                                onAddNew={can('users-manage') ? () => setModal('user') : undefined}
                                addNewLabel="Add User"
                            >
                                <option value="">Select a user...</option>
                                {users.map((u) => (
                                    <option key={u.id} value={String(u.id)}>{u.name} ({u.email})</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Role" error={errors.role_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.role_id}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                onAddNew={can('roles-create') ? () => setModal('role') : undefined}
                                addNewLabel="Add Role"
                            >
                                <option value="">Select a role...</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={String(r.id)}>{r.name} ({r.level.replace(/_/g, ' ')})</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Scope" error={errors.scope_type}>
                            <div className={cn(
                                'flex h-11 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm',
                                !selectedRole && 'text-muted-foreground',
                            )}>
                                {selectedRole ? (
                                    <>
                                        <span className="font-semibold text-foreground capitalize">
                                            {selectedRole.level.replace(/_/g, ' ')}
                                        </span>
                                        <span className="ml-1.5 text-muted-foreground">- set by role level</span>
                                    </>
                                ) : (
                                    'Select a role first'
                                )}
                            </div>
                        </FormField>

                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) => setData('is_active', e.target.value === 'true')}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        {needs.outlet && (
                            <FormField label="Outlet" error={errors.outlet_id}>
                                <SearchableSelect
                                    value={data.outlet_id}
                                    disabled={locked.outlet}
                                    onChange={(e) => setData({
                                        ...data,
                                        outlet_id: e.target.value,
                                        outlet_department_id: locked.department ? currentScope.outlet_department_id : '',
                                        warehouse_id: locked.warehouse ? currentScope.warehouse_id : '',
                                    })}
                                    onAddNew={!locked.outlet && can('outlets-create') ? () => setModal('outlet') : undefined}
                                    addNewLabel="Add Outlet"
                                >
                                    <option value="">Select an outlet...</option>
                                    {allowedOutlets.map((o) => (
                                        <option key={o.id} value={String(o.id)}>{o.name}</option>
                                    ))}
                                </SearchableSelect>
                            </FormField>
                        )}

                        {needs.department && (
                            <FormField label="Department" error={errors.outlet_department_id}>
                                <SearchableSelect
                                    value={data.outlet_department_id}
                                    disabled={locked.department || !data.outlet_id}
                                    onChange={(e) => setData({
                                        ...data,
                                        outlet_department_id: e.target.value,
                                        warehouse_id: locked.warehouse ? currentScope.warehouse_id : '',
                                    })}
                                    onAddNew={!locked.department && can('outlet-departments-create') ? () => setModal('dept') : undefined}
                                    addNewLabel="Add Department"
                                >
                                    <option value="">Select a department...</option>
                                    {filteredDepartments.map((d) => (
                                        <option key={d.id} value={String(d.id)}>{d.name}</option>
                                    ))}
                                </SearchableSelect>
                            </FormField>
                        )}

                        {needs.warehouse && (
                            <FormField label="Warehouse" error={errors.warehouse_id}>
                                <SearchableSelect
                                    value={data.warehouse_id}
                                    disabled={locked.warehouse || (needs.outlet && !data.outlet_id)}
                                    onChange={(e) => setData('warehouse_id', e.target.value)}
                                    onAddNew={!locked.warehouse && can('warehouses-create') ? () => setModal('warehouse') : undefined}
                                    addNewLabel="Add Warehouse"
                                >
                                    <option value="">Select a warehouse...</option>
                                    {filteredWarehouses.map((w) => (
                                        <option key={w.id} value={String(w.id)}>{w.name}</option>
                                    ))}
                                </SearchableSelect>
                            </FormField>
                        )}

                        <FormField label="Starts At" htmlFor="starts_at" error={errors.starts_at}>
                            <Input
                                id="starts_at"
                                type="date"
                                value={data.starts_at}
                                onChange={(e) => setData('starts_at', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Ends At" htmlFor="ends_at" error={errors.ends_at}>
                            <Input
                                id="ends_at"
                                type="date"
                                value={data.ends_at}
                                onChange={(e) => setData('ends_at', e.target.value)}
                            />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link
                        href={urIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Assign Role
                    </button>
                </div>
            </form>

            <QuickCreateUserModal open={modal === 'user'} onClose={() => setModal(null)} />
            <QuickCreateRoleModal open={modal === 'role'} onClose={() => setModal(null)} />
            <QuickCreateOutletModal open={modal === 'outlet'} onClose={() => setModal(null)} />
            <QuickCreateOutletDepartmentModal
                open={modal === 'dept'}
                onClose={() => setModal(null)}
                outlets={outlets}
                defaultOutletId={data.outlet_id}
            />
            <QuickCreateWarehouseModal
                open={modal === 'warehouse'}
                onClose={() => setModal(null)}
                outlets={outlets}
                defaultOutletId={data.outlet_id}
            />
        </>
    );
}
