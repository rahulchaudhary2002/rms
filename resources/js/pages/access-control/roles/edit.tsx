import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as rolesIndex, update as rolesUpdate } from '@/routes/access-control/roles';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Role } from '@/types';

type Props = { role: Role };

export default function RolesEdit({ role }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        slug: role.slug,
        level: role.level,
        rank: role.rank,
        is_assignable: role.is_assignable,
        description: role.description ?? '',
        is_active: role.is_active,
    });

    function slugify(value: string) {
        return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(rolesUpdate.url(role.id));
    }

    return (
        <>
            <Head title={`Edit Role: ${role.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Access Control', href: rolesIndex.url() },
                    { label: 'Roles', href: rolesIndex.url() },
                    { label: role.name },
                ]}
                title={`Edit Role: ${role.name}`}
                description="Update the role details below."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Role Details"
                    description="Update the role name, slug, and access level."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                disabled={role.is_system}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Slug" htmlFor="slug" error={errors.slug} className="md:col-span-2">
                            <Input
                                id="slug"
                                value={data.slug}
                                disabled={role.is_system}
                                onChange={(e) => setData('slug', slugify(e.target.value))}
                            />
                        </FormField>

                        <FormField label="Level" error={errors.level}>
                            <SearchableSelect
                                value={data.level}
                                disabled={role.is_system}
                                onChange={(e) => setData('level', e.target.value as Role['level'])}
                            >
                                <option value="global">Global</option>
                                <option value="central_warehouse">Central Warehouse</option>
                                <option value="outlet">Outlet</option>
                                <option value="outlet_warehouse">Outlet Warehouse</option>
                                <option value="outlet_department">Outlet Department</option>
                                <option value="department_warehouse">Department Warehouse</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Rank" htmlFor="rank" error={errors.rank}>
                            <Input
                                id="rank"
                                type="number"
                                min={1}
                                max={999}
                                value={data.rank}
                                onChange={(e) => setData('rank', parseInt(e.target.value, 10) || 100)}
                            />
                        </FormField>

                        <FormField label="Assignable" error={errors.is_assignable}>
                            <SearchableSelect
                                value={data.is_assignable ? 'true' : 'false'}
                                onChange={(e) => setData('is_assignable', e.target.value === 'true')}
                            >
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </SearchableSelect>
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

                        <FormField label="Description" htmlFor="description" error={errors.description} className="md:col-span-2">
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                        </FormField>
                    </div>

                    {role.is_system && (
                        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                            System roles have limited editing. Slug and level are locked.
                        </p>
                    )}
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link
                        href={rolesIndex.url()}
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
