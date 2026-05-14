import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as statesIndex, store as statesStore } from '@/routes/states';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Country } from '@/types';

type Props = { countries: Pick<Country, 'id' | 'name'>[] };

export default function StatesCreate({ countries }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        country_id: '',
        name:       '',
        code:       '',
        is_active:  true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(statesStore.url());
    }

    return (
        <>
            <Head title="Create State" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'States', href: statesIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create State"
                description="Add a new state or province to the system."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="State Details"
                    description="Set the state name, code, and parent country."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Country" error={errors.country_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.country_id}
                                onChange={(e) => setData('country_id', e.target.value)}
                            >
                                <option value="">Select Country</option>
                                {countries.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Sudurpaschim"
                            />
                        </FormField>

                        <FormField label="Code" htmlFor="code" error={errors.code}>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. SP"
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
                    <Link href={statesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create State
                    </button>
                </div>
            </form>
        </>
    );
}
