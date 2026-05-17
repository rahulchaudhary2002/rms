import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as suppliersIndex, store as suppliersStore } from '@/routes/suppliers';

export default function SuppliersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name:           '',
        code:           '',
        contact_person: '',
        phone:          '',
        email:          '',
        pan_vat_no:     '',
        address:        '',
        is_active:      true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(suppliersStore.url(), { preserveScroll: true });
    };

    return (
        <>
            <Head title="New Supplier" />
            <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Suppliers', href: suppliersIndex.url() },
                        { label: 'New Supplier' },
                    ]}
                    title="New Supplier"
                    description="Create a new supplier for purchase orders."
                />

            <form onSubmit={submit} className="space-y-8 pb-6">
                    <FormSection title="Supplier Details" description="Enter basic supplier information and contact details.">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label="Supplier Name" required error={errors.name}>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Supplier name"
                                />
                            </FormField>
                            <FormField label="Code" error={errors.code}>
                                <Input
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="Supplier code (optional)"
                                />
                            </FormField>
                            <FormField label="Contact Person" error={errors.contact_person}>
                                <Input
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                    placeholder="Contact person name"
                                />
                            </FormField>
                            <FormField label="Phone" error={errors.phone}>
                                <Input
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="Phone number"
                                />
                            </FormField>
                            <FormField label="Email" error={errors.email}>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Email address"
                                />
                            </FormField>
                            <FormField label="PAN / VAT No." error={errors.pan_vat_no}>
                                <Input
                                    value={data.pan_vat_no}
                                    onChange={(e) => setData('pan_vat_no', e.target.value)}
                                    placeholder="PAN or VAT number"
                                />
                            </FormField>
                            <FormField label="Address" error={errors.address} className="sm:col-span-2">
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={3}
                                    placeholder="Full address"
                                    className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                                />
                            </FormField>
                            <FormField label="Active" error={errors.is_active}>
                                <SearchableSelect value={data.is_active ? 'true' : 'false'} onChange={(e) => setData('is_active', e.target.value === 'true')}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </SearchableSelect>
                            </FormField>
                        </div>
                    </FormSection>

                    <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                        <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                        <Link href={suppliersIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Discard Draft
                        </Link>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                            {processing ? 'Saving…' : 'Create Supplier'}
                        </button>
                    </div>
            </form>
        </>
    );
}
