import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AsyncResourceSelect } from '@/components/ui/async-resource-select';
import type { Role } from '@/types';

type User = { id: number; name: string; email: string };
type ScopeType = { type: string; label: string };

type Props = {
    users: User[];
    roles: Role[];
    scopeTypes: ScopeType[];
};

export default function UserRolesCreate({ users, roles, scopeTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        role_id: '',
        scope_type: 'global',
        scope_id: '',
    });

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
                description="Assign a role to a user with an optional scope."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Role Assignment"
                    description="Select the user, role, and scope for this assignment."
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
                                onChange={(e) => setData('role_id', e.target.value)}
                            >
                                <option value="">Select a role...</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={String(r.id)}>
                                        {r.name} ({r.level})
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Scope Type" error={errors.scope_type}>
                            <SearchableSelect
                                value={data.scope_type}
                                onChange={(e) => {
                                    setData('scope_type', e.target.value);
                                    if (e.target.value === 'global') setData('scope_id', '');
                                }}
                            >
                                <option value="global">Global</option>
                                {scopeTypes.map((st) => (
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
                                    placeholder="Select a resource..."
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
