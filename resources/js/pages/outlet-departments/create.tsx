import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { QuickCreateOutletModal } from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import {
    index as departmentsIndex,
    store as departmentsStore,
} from '@/routes/outlet-departments';
import type { DepartmentType, Outlet } from '@/types';

const DEPARTMENT_TYPE_LABELS: Record<DepartmentType, string> = {
    kitchen:      'Kitchen',
    bar:          'Bar',
    counter:      'Counter',
    store:        'Store',
    bakery:       'Bakery',
    housekeeping: 'Housekeeping',
    other:        'Other',
};

type Props = {
    outlets: Pick<Outlet, 'id' | 'name'>[];
};

export default function OutletDepartmentsCreate({ outlets }: Props) {
    const { can } = useCan();
    const [modal, setModal] = useState<'outlet' | null>(null);
    const { data, setData, post, processing, errors } = useForm({
        outlet_id:   '',
        name:        '',
        code:        '',
        type:        'other' as DepartmentType,
        description: '',
        is_active:   true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(departmentsStore.url());
    }

    return (
        <>
            <Head title="Create Department" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Outlet Departments', href: departmentsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Department"
                description="Add a new department to an outlet."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Basic Information"
                    description="Set the department name, code, type, and the outlet it belongs to."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Outlet"
                            error={errors.outlet_id}
                            className="md:col-span-2"
                        >
                            <SearchableSelect
                                value={data.outlet_id}
                                onChange={(e) => setData('outlet_id', e.target.value)}
                                onAddNew={can('outlets-create') ? () => setModal('outlet') : undefined}
                                addNewLabel="Add Outlet"
                            >
                                <option value="">Select outlet…</option>
                                {outlets.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Name"
                            htmlFor="name"
                            error={errors.name}
                        >
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Main Kitchen"
                            />
                        </FormField>

                        <FormField
                            label="Code"
                            htmlFor="code"
                            error={errors.code}
                        >
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. KIT-01 (optional)"
                            />
                        </FormField>

                        <FormField
                            label="Type"
                            error={errors.type}
                        >
                            <SearchableSelect
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value as DepartmentType)}
                            >
                                {Object.entries(DEPARTMENT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Status"
                            error={errors.is_active}
                        >
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) => setData('is_active', e.target.value === 'true')}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Description"
                            htmlFor="description"
                            error={errors.description}
                            className="md:col-span-2"
                        >
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
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">
                        Unsaved changes will be lost.
                    </span>
                    <Link
                        href={departmentsIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Department
                    </button>
                </div>
            </form>

            <QuickCreateOutletModal open={modal === 'outlet'} onClose={() => setModal(null)} />
        </>
    );
}
