import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as groupsIndex } from '@/routes/addon-groups';
import { index as addonsIndex } from '@/routes/addons';
import type { AddonGroup } from '@/types';

type Props = {
    groups: Pick<AddonGroup, 'id' | 'name'>[];
};

const selectedGroupFromQuery = () => {
    if (typeof window === 'undefined') {
        return '';
    }

    return new URLSearchParams(window.location.search).get('addon_group_id') ?? '';
};

export default function AddonCreate({ groups }: Props) {
    const form = useForm({
        addon_group_id: selectedGroupFromQuery(),
        name: '',
        price: '0.00',
        sort_order: '0',
        is_recipe_enabled: false,
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/addons');
    }

    return (
        <>
            <Head title="Create Add-on" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Add-ons', href: addonsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Add-on"
                description="Add a new add-on item and assign it to a group."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Add-on Details" description="Set the add-on group, price, recipe flag and status.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Group" error={form.errors.addon_group_id} className="md:col-span-2">
                            <SearchableSelect value={form.data.addon_group_id} onChange={(e) => form.setData('addon_group_id', e.target.value)}>
                                <option value="">Select group...</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={String(group.id)}>{group.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Name" htmlFor="name" error={form.errors.name} className="md:col-span-2">
                            <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="e.g. Extra Cheese" />
                        </FormField>

                        <FormField label="Price (Rs.)" htmlFor="price" error={form.errors.price}>
                            <Input id="price" type="number" min="0" step="0.01" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} />
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={form.errors.sort_order}>
                            <Input id="sort_order" type="number" min="0" value={form.data.sort_order} onChange={(e) => form.setData('sort_order', e.target.value)} />
                        </FormField>

                        <FormField label="Recipe Enabled" error={form.errors.is_recipe_enabled}>
                            <SearchableSelect value={form.data.is_recipe_enabled ? 'true' : 'false'} onChange={(e) => form.setData('is_recipe_enabled', e.target.value === 'true')}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Status" error={form.errors.is_active}>
                            <SearchableSelect value={form.data.is_active ? 'true' : 'false'} onChange={(e) => form.setData('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <Link href={form.data.addon_group_id ? `/addon-groups/${form.data.addon_group_id}` : groupsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard
                    </Link>
                    <button type="submit" disabled={form.processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Create Add-on
                    </button>
                </div>
            </form>
        </>
    );
}
