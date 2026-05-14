import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as categoriesIndex, store as categoriesStore } from '@/routes/ingredient-categories';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { IngredientCategory } from '@/types';

type Props = { categories: Pick<IngredientCategory, 'id' | 'name' | 'slug'>[] };

export default function IngredientCategoriesCreate({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name:      '',
        slug:      '',
        code:      '',
        parent_id: '',
        is_active: true,
    });

    function slugify(value: string) {
        return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(categoriesStore.url());
    }

    return (
        <>
            <Head title="Create Ingredient Category" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Ingredient Categories', href: categoriesIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Ingredient Category"
                description="Define a new category for organising ingredients."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Category Details"
                    description="Set the category name, slug, and optional parent."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => {
                                    setData('name', e.target.value);
                                    if (!data.slug) {
                                        setData('slug', slugify(e.target.value));
                                    }
                                }}
                                placeholder="e.g. Vegetables"
                            />
                        </FormField>

                        <FormField label="Slug" htmlFor="slug" error={errors.slug}>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', slugify(e.target.value))}
                                placeholder="e.g. vegetables"
                            />
                        </FormField>

                        <FormField label="Code" htmlFor="code" error={errors.code}>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. VEG"
                            />
                        </FormField>

                        <FormField label="Parent Category" error={errors.parent_id}>
                            <SearchableSelect
                                value={data.parent_id}
                                onChange={(e) => setData('parent_id', e.target.value)}
                            >
                                <option value="">None (top-level)</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </SearchableSelect>
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
                    <Link href={categoriesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Category
                    </button>
                </div>
            </form>
        </>
    );
}
