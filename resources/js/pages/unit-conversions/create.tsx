import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as conversionsIndex, store as conversionsStore } from '@/routes/unit-conversions';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Unit } from '@/types';

type Props = { units: Unit[] };

export default function UnitConversionsCreate({ units }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        from_unit_id: '',
        to_unit_id:   '',
        multiplier:   '',
        is_active:    true,
    });

    const fromUnit = units.find((u) => String(u.id) === String(data.from_unit_id));
    const toUnit   = units.find((u) => String(u.id) === String(data.to_unit_id));

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(conversionsStore.url());
    }

    return (
        <>
            <Head title="Create Unit Conversion" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Unit Conversions', href: conversionsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Unit Conversion"
                description="Define a conversion rate between two units."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Conversion Details"
                    description="Select the two units and specify the multiplier."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="From Unit" error={errors.from_unit_id}>
                            <SearchableSelect
                                value={String(data.from_unit_id)}
                                onChange={(e) => setData('from_unit_id', e.target.value)}
                            >
                                <option value="">Select unit…</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id} disabled={String(unit.id) === String(data.to_unit_id)}>
                                        {unit.name} ({unit.short_name})
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="To Unit" error={errors.to_unit_id}>
                            <SearchableSelect
                                value={String(data.to_unit_id)}
                                onChange={(e) => setData('to_unit_id', e.target.value)}
                            >
                                <option value="">Select unit…</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id} disabled={String(unit.id) === String(data.from_unit_id)}>
                                        {unit.name} ({unit.short_name})
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Multiplier" htmlFor="multiplier" error={errors.multiplier} className="md:col-span-2">
                            <Input
                                id="multiplier"
                                type="number"
                                step="any"
                                min="0.000001"
                                value={data.multiplier}
                                onChange={(e) => setData('multiplier', e.target.value)}
                                placeholder="e.g. 1000"
                            />
                            {fromUnit && toUnit && data.multiplier && (
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    Formula: 1 {fromUnit.short_name} = {data.multiplier} {toUnit.short_name}
                                </p>
                            )}
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
                    <Link href={conversionsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Conversion
                    </button>
                </div>
            </form>
        </>
    );
}
