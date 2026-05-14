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
    update as customersUpdate,
} from '@/routes/customers';
import type { Customer } from '@/types';

type Props = { customer: Customer };

export default function CustomersEdit({ customer }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        address: customer.address ?? '',
        is_active: customer.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(customersUpdate.url(customer.id));
    }

    return (
        <>
            <Head title={`Edit Customer: ${customer.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Customers', href: customersIndex.url() },
                    { label: customer.name },
                ]}
                title={`Edit Customer: ${customer.name}`}
                description="Update this global customer profile."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Customer Details"
                    description="Update customer identity and contact information."
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
