import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as warehousesIndex,
    store as warehousesStore,
} from '@/routes/warehouses';
import type { Outlet, OutletDepartment, WarehouseType } from '@/types';

const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
    central:    'Central',
    outlet:     'Outlet',
    department: 'Department',
};

type Props = {
    outlets: Pick<Outlet, 'id' | 'name'>[];
    departments: Pick<OutletDepartment, 'id' | 'outlet_id' | 'name'>[];
};

export default function WarehousesCreate({ outlets, departments }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        outlet_id:            '',
        outlet_department_id: '',
        name:                 '',
        code:                 '',
        type:                 'outlet' as WarehouseType,
        address:              '',
        is_default:           false,
        is_active:            true,
    });

    const filteredDepartments = useMemo(
        () => data.outlet_id ? departments.filter((d) => String(d.outlet_id) === String(data.outlet_id)) : departments,
        [departments, data.outlet_id],
    );

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(warehousesStore.url());
    }

    return (
        <>
            <Head title="Create Warehouse" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Warehouses', href: warehousesIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Warehouse"
                description="Add a new warehouse to your network."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Basic Information"
                    description="Set the warehouse name, code, type, and its scope."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Central Warehouse"
                            />
                        </FormField>

                        <FormField label="Code" htmlFor="code" error={errors.code}>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. WH-CENTRAL-01"
                            />
                        </FormField>

                        <FormField label="Type" error={errors.type}>
                            <SearchableSelect
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value as WarehouseType)}
                            >
                                {Object.entries(WAREHOUSE_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Outlet" error={errors.outlet_id}>
                            <SearchableSelect
                                value={data.outlet_id}
                                onChange={(e) => {
                                    setData('outlet_id', e.target.value);
                                    setData('outlet_department_id', '');
                                }}
                            >
                                <option value="">No outlet (central)</option>
                                {outlets.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Department" error={errors.outlet_department_id}>
                            <SearchableSelect
                                value={data.outlet_department_id}
                                onChange={(e) => setData('outlet_department_id', e.target.value)}
                                disabled={filteredDepartments.length === 0}
                            >
                                <option value="">No department</option>
                                {filteredDepartments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Address" htmlFor="address" error={errors.address} className="md:col-span-2">
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Optional address"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Settings"
                    description="Configure default and active state."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) => setData('is_active', e.target.value === 'true')}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Default Warehouse" error={errors.is_default}>
                            <SearchableSelect
                                value={data.is_default ? 'true' : 'false'}
                                onChange={(e) => setData('is_default', e.target.value === 'true')}
                            >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">
                        Unsaved changes will be lost.
                    </span>
                    <Link
                        href={warehousesIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Warehouse
                    </button>
                </div>
            </form>
        </>
    );
}
