import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as diningAreasIndex,
    store as diningAreasStore,
} from '@/routes/dining-areas';

type Outlet = { id: number; name: string };

type Props = {
    outlets: Outlet[];
};

export default function DiningAreasCreate({ outlets }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        outlet_id:     '',
        name:          '',
        code:          '',
        description:   '',
        layout_width:  '1000',
        layout_height: '700',
        sort_order:    '100',
        is_active:     true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(diningAreasStore.url());
    }

    return (
        <>
            <Head title="Create Dining Area" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Dining Areas', href: diningAreasIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Dining Area"
                description="Add a new dining zone to an outlet."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Basic Information"
                    description="Set the dining area name, code, and which outlet it belongs to."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Outlet" error={errors.outlet_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.outlet_id}
                                onChange={(e) => setData('outlet_id', e.target.value)}
                            >
                                <option value="">Select outlet…</option>
                                {outlets.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Ground Floor, Rooftop, Garden"
                            />
                        </FormField>

                        <FormField label="Code" htmlFor="code" error={errors.code}>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. GF, RF, VIP"
                            />
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

                <FormSection
                    title="Layout Canvas"
                    description="Set the canvas dimensions used in the dining table layout editor."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Layout Width (px)" htmlFor="layout_width" error={errors.layout_width}>
                            <Input
                                id="layout_width"
                                type="number"
                                min="100"
                                value={data.layout_width}
                                onChange={(e) => setData('layout_width', e.target.value)}
                                placeholder="1000"
                            />
                        </FormField>

                        <FormField label="Layout Height (px)" htmlFor="layout_height" error={errors.layout_height}>
                            <Input
                                id="layout_height"
                                type="number"
                                min="100"
                                value={data.layout_height}
                                onChange={(e) => setData('layout_height', e.target.value)}
                                placeholder="700"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Status"
                    description="Control whether this dining area is active and available."
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
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">
                        Unsaved changes will be lost.
                    </span>
                    <Link
                        href={diningAreasIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Dining Area
                    </button>
                </div>
            </form>
        </>
    );
}
