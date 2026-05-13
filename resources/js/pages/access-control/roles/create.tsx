import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function RolesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        level: 'global',
        description: '',
        is_active: true,
    });

    function slugify(value: string) {
        return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/access-control/roles');
    }

    return (
        <>
            <Head title="Create Role" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: '/dashboard' },
                    { label: 'Access Control', href: '/access-control/roles' },
                    { label: 'Roles', href: '/access-control/roles' },
                    { label: 'Create' },
                ]}
                title="Create Role"
                description="Define a new role with its level and access scope."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Role Details"
                    description="Set the role name, slug, and the access level it applies to."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => {
                                    setData('name', e.target.value);
                                    setData('slug', slugify(e.target.value));
                                }}
                                placeholder="e.g. Store Manager"
                            />
                        </FormField>

                        <FormField label="Slug" htmlFor="slug" error={errors.slug} className="md:col-span-2">
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', slugify(e.target.value))}
                                placeholder="e.g. store-manager"
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
                        href="/access-control/roles"
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Role
                    </button>
                </div>
            </form>
        </>
    );
}
