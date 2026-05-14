import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { QuickCreateCountryModal } from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import { index as statesIndex, update as statesUpdate } from '@/routes/states';
import type { Country, State } from '@/types';

type Props = {
    state: State;
    countries: Pick<Country, 'id' | 'name'>[];
};

export default function StatesEdit({ state, countries }: Props) {
    const { can } = useCan();
    const [showCountryModal, setShowCountryModal] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        country_id: String(state.country_id),
        name: state.name,
        code: state.code ?? '',
        is_active: state.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(statesUpdate.url(state.id));
    }

    return (
        <>
            <Head title={`Edit State: ${state.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'States', href: statesIndex.url() },
                    { label: state.name },
                ]}
                title={`Edit State: ${state.name}`}
                description="Update the state details below."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="State Details"
                    description="Update the state name, code, and parent country."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Country"
                            error={errors.country_id}
                            className="md:col-span-2"
                        >
                            <SearchableSelect
                                value={data.country_id}
                                onChange={(e) =>
                                    setData('country_id', e.target.value)
                                }
                                onAddNew={
                                    can('countries-create')
                                        ? () => setShowCountryModal(true)
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
                                onChange={(e) =>
                                    setData('code', e.target.value)
                                }
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
                        href={statesIndex.url()}
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

            <QuickCreateCountryModal
                open={showCountryModal}
                onClose={() => setShowCountryModal(false)}
            />
        </>
    );
}
