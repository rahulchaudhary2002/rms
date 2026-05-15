import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { DropzoneUploader } from '@/components/ui/dropzone-uploader';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as categoriesIndex, update as categoriesUpdate } from '@/routes/food-categories';
import type { FoodCategory } from '@/types';

type Props = {
    category: FoodCategory;
    parentCategories: Pick<FoodCategory, 'id' | 'name'>[];
};

export default function FoodCategoriesEdit({ category, parentCategories }: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(category.image_url ?? null);
    const { data, setData, post, processing, errors } = useForm({
        parent_id: category.parent_id ? String(category.parent_id) : '',
        name: category.name,
        description: category.description ?? '',
        image: null as File | null,
        sort_order: String(category.sort_order),
        is_active: category.is_active,
        remove_image: false,
        _method: 'PUT',
    });

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function holdImage(files: File[]) {
        const file = files[0] ?? null;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setData('image', file);
        setData('remove_image', false);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    }

    function removeImage(e: React.MouseEvent) {
        e.stopPropagation();

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setData('image', null);
        setData('remove_image', true);
        setPreviewUrl(null);
        setCurrentImageUrl(null);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(categoriesUpdate.url(category.id), { forceFormData: true });
    }

    return (
        <>
            <Head title={`Edit: ${category.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Food Categories', href: categoriesIndex.url() },
                    { label: category.name },
                ]}
                title={`Edit: ${category.name}`}
                description="Update category details."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Category Details" description="Basic information for this category.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        </FormField>

                        <FormField label="Parent Category (optional)" error={errors.parent_id}>
                            <SearchableSelect value={data.parent_id} onChange={(e) => setData('parent_id', e.target.value)}>
                                <option value="">None (root category)</option>
                                {parentCategories.filter((c) => c.id !== category.id).map((c) => (
                                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={errors.sort_order}>
                            <Input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                        </FormField>

                        <FormField label="Image (optional)" error={errors.image} className="md:col-span-2">
                            <DropzoneUploader
                                accept="image/*"
                                multiple={false}
                                disabled={processing}
                                onFiles={holdImage}
                                className="min-h-56 p-4"
                                preview={(previewUrl || currentImageUrl) && (
                                    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card">
                                        <img src={previewUrl ?? currentImageUrl ?? ''} alt={category.name} className="h-44 w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-black"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">close</span>
                                            Remove
                                        </button>
                                    </div>
                                )}
                            />
                        </FormField>

                        <FormField label="Description (optional)" htmlFor="description" error={errors.description} className="md:col-span-2">
                            <textarea
                                id="description"
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring"
                            />
                        </FormField>

                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect value={data.is_active ? 'true' : 'false'} onChange={(e) => setData('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={categoriesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Discard</Link>
                    <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}
