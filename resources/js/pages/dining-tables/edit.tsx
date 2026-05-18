import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as diningTablesIndex,
    update as diningTablesUpdate,
} from '@/routes/dining-tables';

type Outlet = { id: number; name: string };
type DiningArea = { id: number; name: string; outlet_id: number };

type DiningTable = {
    id: number;
    outlet_id: number;
    dining_area_id: number;
    name: string;
    code: string | null;
    capacity: number;
    status: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    rotation: number;
    shape: string;
    sort_order: number;
    is_active: boolean;
};

type Props = {
    diningTable: DiningTable;
    outlets: Outlet[];
    diningAreas: DiningArea[];
};

export default function DiningTablesEdit({ diningTable, outlets, diningAreas }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        outlet_id:      String(diningTable.outlet_id),
        dining_area_id: String(diningTable.dining_area_id),
        name:           diningTable.name,
        code:           diningTable.code ?? '',
        capacity:       String(diningTable.capacity),
        status:         diningTable.status,
        position_x:     String(diningTable.position_x),
        position_y:     String(diningTable.position_y),
        width:          String(diningTable.width),
        height:         String(diningTable.height),
        rotation:       String(diningTable.rotation),
        shape:          diningTable.shape,
        sort_order:     String(diningTable.sort_order),
        is_active:      diningTable.is_active,
    });

    const filteredDiningAreas = useMemo(() => {
        if (!data.outlet_id) return diningAreas;
        return diningAreas.filter((a) => String(a.outlet_id) === data.outlet_id);
    }, [diningAreas, data.outlet_id]);

    function handleOutletChange(outletId: string) {
        setData((prev) => ({ ...prev, outlet_id: outletId, dining_area_id: '' }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(diningTablesUpdate.url(diningTable.id));
    }

    return (
        <>
            <Head title={`Edit ${diningTable.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Dining Tables', href: diningTablesIndex.url() },
                    { label: diningTable.name },
                ]}
                title={`Edit: ${diningTable.name}`}
                description="Update the dining table details."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Location"
                    description="Assign this table to an outlet and dining area."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Outlet" error={errors.outlet_id}>
                            <SearchableSelect
                                value={data.outlet_id}
                                onChange={(e) => handleOutletChange(e.target.value)}
                            >
                                <option value="">Select outlet…</option>
                                {outlets.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Dining Area" error={errors.dining_area_id}>
                            <SearchableSelect
                                value={data.dining_area_id}
                                onChange={(e) => setData('dining_area_id', e.target.value)}
                            >
                                <option value="">Select dining area…</option>
                                {filteredDiningAreas.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Table Details"
                    description="Update the table name, code, capacity, and shape."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Table 1, VIP Table 1"
                            />
                        </FormField>

                        <FormField label="Code" htmlFor="code" error={errors.code}>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. T-01, VIP-01"
                            />
                        </FormField>

                        <FormField label="Capacity (seats)" htmlFor="capacity" error={errors.capacity}>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={data.capacity}
                                onChange={(e) => setData('capacity', e.target.value)}
                                placeholder="2"
                            />
                        </FormField>

                        <FormField label="Shape" error={errors.shape}>
                            <SearchableSelect
                                value={data.shape}
                                onChange={(e) => setData('shape', e.target.value)}
                            >
                                <option value="rectangle">Rectangle</option>
                                <option value="square">Square</option>
                                <option value="circle">Circle</option>
                                <option value="oval">Oval</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Status" error={errors.status}>
                            <SearchableSelect
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="inactive">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={errors.sort_order}>
                            <Input
                                id="sort_order"
                                type="number"
                                min="0"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', e.target.value)}
                                placeholder="100"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Layout Position"
                    description="Update position and size. Changes here are reflected in the Layout Editor."
                >
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                        <FormField label="X Position" htmlFor="position_x" error={errors.position_x}>
                            <Input id="position_x" type="number" min="0" step="any" value={data.position_x} onChange={(e) => setData('position_x', e.target.value)} placeholder="0" />
                        </FormField>
                        <FormField label="Y Position" htmlFor="position_y" error={errors.position_y}>
                            <Input id="position_y" type="number" min="0" step="any" value={data.position_y} onChange={(e) => setData('position_y', e.target.value)} placeholder="0" />
                        </FormField>
                        <FormField label="Width (px)" htmlFor="width" error={errors.width}>
                            <Input id="width" type="number" min="20" step="any" value={data.width} onChange={(e) => setData('width', e.target.value)} placeholder="80" />
                        </FormField>
                        <FormField label="Height (px)" htmlFor="height" error={errors.height}>
                            <Input id="height" type="number" min="20" step="any" value={data.height} onChange={(e) => setData('height', e.target.value)} placeholder="80" />
                        </FormField>
                        <FormField label="Rotation (°)" htmlFor="rotation" error={errors.rotation}>
                            <Input id="rotation" type="number" min="0" max="360" step="1" value={data.rotation} onChange={(e) => setData('rotation', e.target.value)} placeholder="0" />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Active Status"
                    description="Control whether this table is visible and available."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Active" error={errors.is_active}>
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) => setData('is_active', e.target.value === 'true')}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">
                        Unsaved changes will be lost.
                    </span>
                    <Link
                        href={diningTablesIndex.url()}
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
