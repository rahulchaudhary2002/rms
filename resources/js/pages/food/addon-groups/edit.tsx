import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as groupsIndex, update as groupsUpdate } from '@/routes/addon-groups';
import type { AddonGroup } from '@/types';

type Props = {
    group: AddonGroup;
};

const groupShowUrl = (id: number) => `/addon-groups/${id}`;

export default function AddonGroupEdit({ group }: Props) {
    const form = useForm({
        name: group.name,
        is_required: group.is_required,
        min_select: String(group.min_select),
        max_select: group.max_select !== null ? String(group.max_select) : '',
        sort_order: String(group.sort_order),
        is_active: group.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(groupsUpdate.url(group.id));
    }

    return (
        <>
            <Head title={`Edit ${group.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Add-on Groups', href: groupsIndex.url() },
                    { label: group.name, href: groupShowUrl(group.id) },
                    { label: 'Edit' },
                ]}
                title={`Edit ${group.name}`}
                description="Update group selection rules and status."
                actions={
                    <Link
                        href={groupShowUrl(group.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Back to Group
                    </Link>
                }
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Group Details" description="Configure name, selection rules and status for this add-on group.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={form.errors.name} className="md:col-span-2">
                            <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        </FormField>

                        <FormField label="Required" error={form.errors.is_required}>
                            <SearchableSelect value={form.data.is_required ? 'true' : 'false'} onChange={(e) => form.setData('is_required', e.target.value === 'true')}>
                                <option value="false">Optional</option>
                                <option value="true">Required</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Status" error={form.errors.is_active}>
                            <SearchableSelect value={form.data.is_active ? 'true' : 'false'} onChange={(e) => form.setData('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Min Selection" htmlFor="min_select" error={form.errors.min_select}>
                            <Input id="min_select" type="number" min="0" value={form.data.min_select} onChange={(e) => form.setData('min_select', e.target.value)} />
                        </FormField>

                        <FormField label="Max Selection" htmlFor="max_select" error={form.errors.max_select}>
                            <Input id="max_select" type="number" min="0" value={form.data.max_select} onChange={(e) => form.setData('max_select', e.target.value)} placeholder="Leave blank for unlimited" />
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={form.errors.sort_order}>
                            <Input id="sort_order" type="number" min="0" value={form.data.sort_order} onChange={(e) => form.setData('sort_order', e.target.value)} />
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={groupShowUrl(group.id)} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard
                    </Link>
                    <button type="submit" disabled={form.processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}
