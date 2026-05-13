import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AsyncResourceSelect } from '@/components/ui/async-resource-select';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

type User = { id: number; name: string; email: string };

type Props = {
    users: User[];
    roles: Role[];
};

export default function UserRolesCreate({ users, roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        role_id: '',
        scope_type: 'global',
        scope_id: '',
    });

    const selectedRole = roles.find((r) => String(r.id) === data.role_id) ?? null;

    function handleRoleChange(roleId: string) {
        const role = roles.find((r) => String(r.id) === roleId) ?? null;
        setData({
            ...data,
            role_id: roleId,
            scope_type: role?.level ?? 'global',
            scope_id: '',
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/access-control/user-roles');
    }

    return (
        <>
            <Head title="Assign Role" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: '/dashboard' },
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'User Roles', href: '/access-control/user-roles' },
                    { label: 'Assign Role' },
                ]}
                title="Assign Role"
                description="Assign a role to a user. The scope is determined by the role's level."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Role Assignment"
                    description="Select the user and role. Scope is set automatically based on the role's level."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="User" error={errors.user_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                            >
                                <option value="">Select a user...</option>
                                {users.map((u) => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Role" error={errors.role_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.role_id}
                                onChange={(e) => handleRoleChange(e.target.value)}
                            >
                                <option value="">Select a role...</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={String(r.id)}>
                                        {r.name} ({r.level})
                                    </option>
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
                                    placeholder={`Select a ${data.scope_type}...`}
                                />
                            </FormField>
                        )}
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link
                        href="/access-control/user-roles"
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
        </>
    );
}
