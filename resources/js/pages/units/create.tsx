import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as unitsIndex, store as unitsStore } from '@/routes/units';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function UnitsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name:       '',
        short_name: '',
        type:       'quantity',
        is_base:    false,
        is_active:  true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(unitsStore.url());
    }

    return (
        <>
            <Head title="Create Unit" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Units', href: unitsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Unit"
                description="Define a new measurement unit for ingredients."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Unit Details"
                    description="Set the unit name, abbreviation, and type."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Kilogram"
                            />
                        </FormField>

                        <FormField label="Short Name" htmlFor="short_name" error={errors.short_name}>
                            <Input
                                id="short_name"
                                value={data.short_name}
                                onChange={(e) => setData('short_name', e.target.value)}
                                placeholder="e.g. kg"
                            />
                        </FormField>

                        <FormField label="Type" error={errors.type}>
                            <SearchableSelect value={data.type} onChange={(e) => setData('type', e.target.value as typeof data.type)}>
                                <option value="weight">Weight</option>
                                <option value="volume">Volume</option>
                                <option value="quantity">Quantity</option>
                                <option value="custom">Custom</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Base Unit" error={errors.is_base}>
                            <SearchableSelect
                                value={data.is_base ? 'true' : 'false'}
                                onChange={(e) => setData('is_base', e.target.value === 'true')}
                            >
                                <option value="false">No</option>
                                <option value="true">Yes — this is the base unit for its type</option>
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
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={unitsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Unit
                    </button>
                </div>
            </form>
        </>
    );
}
