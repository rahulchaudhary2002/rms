import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as groupsIndex, store as groupsStore } from '@/routes/addon-groups';

export default function AddonGroupCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        is_required: false,
        min_select: '1',
        max_select: '',
        sort_order: '0',
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(groupsStore.url());
    }

    return (
        <>
            <Head title="Create Add-on Group" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Add-on Groups', href: groupsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Add-on Group"
                description="Add a new add-on group for menu customisation."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Group Details" description="Configure name, selection rules and status for this group.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Choose your size" />
                        </FormField>

                        <FormField label="Required" error={errors.is_required}>
                            <SearchableSelect value={data.is_required ? 'true' : 'false'} onChange={(e) => setData('is_required', e.target.value === 'true')}>
                                <option value="false">Optional</option>
                                <option value="true">Required</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect value={data.is_active ? 'true' : 'false'} onChange={(e) => setData('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Min Selection" htmlFor="min_select" error={errors.min_select}>
                            <Input id="min_select" type="number" min="0" value={data.min_select} onChange={(e) => setData('min_select', e.target.value)} />
                        </FormField>

                        <FormField label="Max Selection" htmlFor="max_select" error={errors.max_select}>
                            <Input id="max_select" type="number" min="0" value={data.max_select} onChange={(e) => setData('max_select', e.target.value)} placeholder="Leave blank for unlimited" />
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={errors.sort_order}>
                            <Input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={groupsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Discard</Link>
                    <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Create Group
                    </button>
                </div>
            </form>
        </>
    );
}
