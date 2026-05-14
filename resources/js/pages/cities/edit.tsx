import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { dashboard } from '@/routes';
import { index as citiesIndex, update as citiesUpdate } from '@/routes/cities';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { City, Country, State } from '@/types';

type Props = {
    city: City;
    countries: Pick<Country, 'id' | 'name'>[];
    states: Pick<State, 'id' | 'name' | 'country_id'>[];
};

export default function CitiesEdit({ city, countries, states }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        country_id: String(city.country_id),
        state_id:   city.state_id ? String(city.state_id) : '',
        name:       city.name,
        is_active:  city.is_active,
    });

    const filteredStates = useMemo(
        () => data.country_id ? states.filter((s) => String(s.country_id) === data.country_id) : [],
        [states, data.country_id],
    );

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(citiesUpdate.url(city.id));
    }

    return (
        <>
            <Head title={`Edit City: ${city.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Cities', href: citiesIndex.url() },
                    { label: city.name },
                ]}
                title={`Edit City: ${city.name}`}
                description="Update the city details below."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="City Details"
                    description="Update the city name and location."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Country" error={errors.country_id}>
                            <SearchableSelect
                                value={data.country_id}
                                onChange={(e) => setData((prev) => ({ ...prev, country_id: e.target.value, state_id: '' }))}
                            >
                                <option value="">Select Country</option>
                                {countries.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="State / Province" error={errors.state_id}>
                            <SearchableSelect
                                value={data.state_id}
                                onChange={(e) => setData('state_id', e.target.value)}
                                disabled={!data.country_id}
                            >
                                <option value="">No State</option>
                                {filteredStates.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
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
                    <Link href={citiesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
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
