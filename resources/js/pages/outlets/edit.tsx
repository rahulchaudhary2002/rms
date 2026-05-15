import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { index as outletsIndex, update as outletsUpdate } from '@/routes/outlets';
import type { Outlet } from '@/types';

type Props = {
    outlet: Outlet;
};

export default function OutletsEdit({ outlet }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: outlet.name,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(outletsUpdate.url(outlet.id));
    }

    return (
        <>
            <Head title={`Edit Outlet: ${outlet.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Outlets', href: outletsIndex.url() },
                    { label: outlet.name },
                ]}
                title={`Edit Outlet: ${outlet.name}`}
                description="Update the outlet details below."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Outlet Details"
                    description="Update the outlet name."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Name"
                            htmlFor="name"
                            error={errors.name}
                            className="md:col-span-2"
                        >
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">
                        Unsaved changes will be lost.
                    </span>
                    <Link
                        href={outletsIndex.url()}
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
