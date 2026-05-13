import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { AsyncResourceSelect } from '@/components/ui/async-resource-select';
import type { Permission } from '@/types';

type User = { id: number; name: string; email: string };
type ResourceType = { type: string; label: string };

type Props = {
    users: User[];
    permissions: Permission[];
    resourceTypes: ResourceType[];
};

export default function UserResourcePermissionsCreate({ users, permissions, resourceTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        permission_id: '',
        resource_type: '',
        resource_id: '',
        effect: 'allow',
        reason: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/access-control/user-resource-permissions');
    }

    return (
        <>
            <Head title="Add Resource Permission" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: '/dashboard' },
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Resource Permissions', href: '/access-control/user-resource-permissions' },
                    { label: 'Add Permission' },
                ]}
                title="Add Resource Permission"
                description="Grant or deny access to a specific resource instance for a user."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Resource Permission Details"
                    description="Select the user, permission, resource, and effect."
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

                        <FormField label="Resource Type" error={errors.resource_type}>
                            <SearchableSelect
                                value={data.resource_type}
                                onChange={(e) => {
                                    setData('resource_type', e.target.value);
                                    setData('resource_id', '');
                                }}
                            >
                                <option value="">Select a type...</option>
                                {resourceTypes.map((rt) => (
                                    <option key={rt.type} value={rt.type}>
                                        {rt.label}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Resource" error={errors.resource_id}>
                            <AsyncResourceSelect
                                resourceType={data.resource_type}
                                value={data.resource_id}
                                onChange={(val) => setData('resource_id', val)}
                                placeholder="Select a resource..."
                                disabled={!data.resource_type}
                            />
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

                        <FormField label="Reason (optional)" error={errors.reason}>
                            <Input
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                placeholder="Optional reason for this permission"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link
                        href="/access-control/user-resource-permissions"
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save Permission
                    </button>
                </div>
            </form>
        </>
    );
}
