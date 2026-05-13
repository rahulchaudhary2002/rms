import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Permission } from '@/types';

const COMMON_ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'export', 'manage'];

type Props = { permission: Permission };

export default function PermissionsEdit({ permission }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
        slug: permission.slug,
        module: permission.module,
        action: permission.action,
        level: permission.level,
        description: permission.description ?? '',
        is_active: permission.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/access-control/permissions/${permission.id}`);
    }

    return (
        <>
            <Head title={`Edit Permission: ${permission.slug}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: '/dashboard' },
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Permissions', href: '/access-control/permissions' },
                    { label: permission.slug },
                ]}
                title={`Edit Permission: ${permission.slug}`}
                description="Update the permission details below."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Permission Details"
                    description="Core identity of this permission — name, slug, module, and action."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Display Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                disabled={permission.is_system}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Module" htmlFor="module" error={errors.module}>
                            <Input
                                id="module"
                                value={data.module}
                                disabled={permission.is_system}
                                onChange={(e) => setData('module', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Action" error={errors.action}>
                            <SearchableSelect
                                value={data.action}
                                disabled={permission.is_system}
                                onChange={(e) => setData('action', e.target.value)}
                            >
                                <option value="">Select action</option>
                                {COMMON_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Slug" htmlFor="slug" error={errors.slug} className="md:col-span-2">
                            <Input
                                id="slug"
                                value={data.slug}
                                disabled={permission.is_system}
                                onChange={(e) => setData('slug', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Level" error={errors.level}>
                            <SearchableSelect
                                value={data.level}
                                disabled={permission.is_system}
                                onChange={(e) => setData('level', e.target.value)}
                            >
                                <option value="global">Global</option>
                                <option value="outlet">Outlet</option>
                                <option value="warehouse">Warehouse</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Status">
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) => setData('is_active', e.target.value === 'true')}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Description" htmlFor="description" error={errors.description} className="md:col-span-2">
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                        </FormField>
                    </div>

                    {permission.is_system && (
                        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                            System permissions have limited editing.
                        </p>
                    )}
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link
                        href="/access-control/permissions"
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Changes
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}
