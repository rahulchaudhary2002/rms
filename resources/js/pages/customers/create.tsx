import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import {
    index as customersIndex,
    store as customersStore,
} from '@/routes/customers';

export default function CustomersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(customersStore.url());
    }

    return (
        <>
            <Head title="Create Customer" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Customers', href: customersIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Customer"
                description="Add a global customer profile."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Customer Details"
                    description="Set the customer identity and contact information."
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
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. Jane Smith"
                            />
                        </FormField>

                        <FormField
                            label="Phone"
                            htmlFor="phone"
                            error={errors.phone}
                        >
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                placeholder="Optional phone number"
                            />
                        </FormField>

                        <FormField
                            label="Email"
                            htmlFor="email"
                            error={errors.email}
                        >
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="Optional email address"
                            />
                        </FormField>

                        <FormField
                            label="Address"
                            htmlFor="address"
                            error={errors.address}
                            className="md:col-span-2"
                        >
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                                placeholder="Optional address"
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
                        href={customersIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Customer
                    </button>
                </div>
            </form>
        </>
    );
}
