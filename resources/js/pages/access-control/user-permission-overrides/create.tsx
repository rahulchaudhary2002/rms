import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as upoIndex, store as upoStore } from '@/routes/access-control/user-permission-overrides';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { AsyncResourceSelect } from '@/components/ui/async-resource-select';
import type { Permission } from '@/types';

type User = { id: number; name: string; email: string };
type ScopeType = { type: string; label: string };
type AllowedScopes = { outlet: number[]; warehouse: number[] } | null;

type Props = {
    users: User[];
    permissions: Permission[];
    scopeTypes: ScopeType[];
    allowedScopes: AllowedScopes;
    allowedScopeTypes: string[];
};

export default function UserPermissionOverridesCreate({ users, permissions, scopeTypes, allowedScopes, allowedScopeTypes }: Props) {
    const defaultScopeType = allowedScopeTypes[0] ?? 'global';
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        permission_id: '',
        scope_type: defaultScopeType,
        scope_id: '',
        effect: 'allow',
        reason: '',
    });

    const isScoped = data.scope_type !== 'global';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(upoStore.url());
    }

    return (
        <>
            <Head title="Add Permission Override" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Permission Overrides', href: upoIndex.url() },
                    { label: 'Add Override' },
                ]}
                title="Add Permission Override"
                description="Grant or deny a specific permission for a user, overriding their role defaults."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Override Details"
                    description="Select the user, permission, scope, and effect for this override."
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

                        <FormField label="Permission" error={errors.permission_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.permission_id}
                                onChange={(e) => setData('permission_id', e.target.value)}
                            >
                                <option value="">Select a permission...</option>
                                {permissions.map((p) => (
                                    <option key={p.id} value={String(p.id)}>
                                        {p.slug}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Effect" error={errors.effect}>
                            <SearchableSelect
                                value={data.effect}
                                onChange={(e) => setData('effect', e.target.value)}
                            >
                                <option value="allow">Allow</option>
                                <option value="deny">Deny</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Scope Type" error={errors.scope_type}>
                            <SearchableSelect
                                value={data.scope_type}
                                onChange={(e) => {
                                    setData('scope_type', e.target.value);
                                    setData('scope_id', '');
                                }}
                            >
                                {allowedScopeTypes.includes('global') && <option value="global">Global</option>}
                                {scopeTypes.filter((st) => allowedScopeTypes.includes(st.type)).map((st) => (
                                    <option key={st.type} value={st.type}>
                                        {st.label}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        {isScoped && (
                            <FormField label="Scope Resource" error={errors.scope_id} className="md:col-span-2">
                                <AsyncResourceSelect
                                    resourceType={data.scope_type}
                                    value={data.scope_id}
                                    onChange={(val) => setData('scope_id', val)}
                                    allowedIds={allowedScopes ? (allowedScopes[data.scope_type as 'outlet' | 'warehouse'] ?? null) : null}
                                    placeholder="Select a resource..."
                                />
                            </FormField>
                        )}

                        <FormField label="Reason (optional)" error={errors.reason} className="md:col-span-2">
                            <Input
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                placeholder="Why is this override needed?"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link
                        href={upoIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save Override
                    </button>
                </div>
            </form>
        </>
    );
}
