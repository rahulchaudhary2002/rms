import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import {
    QuickCreateCountryModal,
    QuickCreateStateModal,
} from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import { index as citiesIndex, store as citiesStore } from '@/routes/cities';
import type { Country, State } from '@/types';

type Props = {
    countries: Pick<Country, 'id' | 'name'>[];
    states: Pick<State, 'id' | 'name' | 'country_id'>[];
};

export default function CitiesCreate({ countries, states }: Props) {
    const { can } = useCan();
    const [modal, setModal] = useState<'country' | 'state' | null>(null);
    const { data, setData, post, processing, errors } = useForm({
        country_id: '',
        state_id: '',
        name: '',
        is_active: true,
    });

    const filteredStates = useMemo(
        () =>
            data.country_id
                ? states.filter((s) => String(s.country_id) === data.country_id)
                : [],
        [states, data.country_id],
    );

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(citiesStore.url());
    }

    return (
        <>
            <Head title="Create City" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Cities', href: citiesIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create City"
                description="Add a new city to the system."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="City Details"
                    description="Set the city name and its location."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Country" error={errors.country_id}>
                            <SearchableSelect
                                value={data.country_id}
                                onChange={(e) =>
                                    setData((prev) => ({
                                        ...prev,
                                        country_id: e.target.value,
                                        state_id: '',
                                    }))
                                }
                                onAddNew={
                                    can('countries-create')
                                        ? () => setModal('country')
                                        : undefined
                                }
                                addNewLabel="Add Country"
                            >
                                <option value="">Select Country</option>
                                {countries.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="State / Province"
                            error={errors.state_id}
                        >
                            <SearchableSelect
                                value={data.state_id}
                                onChange={(e) =>
                                    setData('state_id', e.target.value)
                                }
                                disabled={!data.country_id}
                                onAddNew={
                                    can('states-create')
                                        ? () => setModal('state')
                                        : undefined
                                }
                                addNewLabel="Add State"
                            >
                                <option value="">
                                    No State / Select Country first
                                </option>
                                {filteredStates.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Name"
                            htmlFor="name"
                            error={errors.name}
                            className="md:col-span-2"
                        >
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. Dhangadhi"
                            />
                        </FormField>

                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) =>
                                    setData(
                                        'is_active',
                                        e.target.value === 'true',
                                    )
                                }
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
                        href={citiesIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create City
                    </button>
                </div>
            </form>

            <QuickCreateCountryModal
                open={modal === 'country'}
                onClose={() => setModal(null)}
            />
            <QuickCreateStateModal
                open={modal === 'state'}
                onClose={() => setModal(null)}
                countries={countries}
                defaultCountryId={data.country_id}
            />
        </>
    );
}
