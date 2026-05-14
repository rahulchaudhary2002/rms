import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as rolesIndex } from '@/routes/access-control/roles';
import { index as permissionsIndex, store as permissionsStore } from '@/routes/access-control/permissions';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';

const COMMON_ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'export', 'manage'];

export default function PermissionsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        module: '',
        action: '',
        level: 'global',
        description: '',
        is_active: true,
    });

    function syncSlug(module: string, action: string) {
        if (module && action) {
            setData('slug', `${module}.${action}`);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(permissionsStore.url());
    }

    return (
        <>
            <Head title="Create Permission" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Permissions', href: permissionsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Permission"
                description="Define a new system permission by setting its module, action, and access level."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Permission Details"
                    description="Core identity of this permission - name, slug, module, and action."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Display Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. View Inventory"
                            />
                        </FormField>

                        <FormField label="Module" htmlFor="module" error={errors.module}>
                            <Input
                                id="module"
                                value={data.module}
                                onChange={(e) => {
                                    setData('module', e.target.value);
                                    syncSlug(e.target.value, data.action);
                                }}
                                placeholder="e.g. inventory"
                            />
                        </FormField>

                        <FormField label="Action" error={errors.action}>
                            <SearchableSelect
                                value={data.action}
                                onChange={(e) => {
                                    setData('action', e.target.value);
                                    syncSlug(data.module, e.target.value);
                                }}
                            >
                                <option value="">Select action</option>
                                {COMMON_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Slug" htmlFor="slug" error={errors.slug} className="md:col-span-2">
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                placeholder="module.action"
                            />
                        </FormField>

                        <FormField label="Level" error={errors.level}>
                            <SearchableSelect value={data.level} onChange={(e) => setData('level', e.target.value)}>
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
                                placeholder="Optional description"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link
                        href={permissionsIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Permission
                    </button>
                </div>
            </form>
        </>
    );
}
