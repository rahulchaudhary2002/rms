import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { QuickCreateFoodCategoryModal } from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import { index as foodsIndex, store as foodsStore } from '@/routes/foods';
import type { FoodCategory } from '@/types';

type Props = {
    categories: Pick<FoodCategory, 'id' | 'name'>[];
};

export default function FoodCreate({ categories }: Props) {
    const { can } = useCan();
    const [modal, setModal] = useState<'food-category' | null>(null);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        food_category_id: '',
        item_type: 'food' as 'food' | 'beverage' | 'combo',
        food_type: '' as '' | 'veg' | 'non_veg' | 'egg' | 'vegan',
        base_price: '0.00',
        sku: '',
        short_description: '',
        description: '',
        preparation_time: '',
        sort_order: '0',
        has_variants: false,
        has_addons: false,
        is_recipe_enabled: false,
        is_taxable: true,
        is_discountable: true,
        is_featured: false,
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(foodsStore.url());
    }

    return (
        <>
            <Head title="Create Food Item" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Foods & Menu', href: foodsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Food Item"
                description="Add a new food item, beverage, or combo to your menu."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Basic Information" description="Core details and pricing for this menu item.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Chicken Burger" />
                        </FormField>

                        <FormField label="Category" error={errors.food_category_id}>
                            <SearchableSelect
                                value={data.food_category_id}
                                onChange={(e) => setData('food_category_id', e.target.value)}
                                onAddNew={can('food-categories-create') ? () => setModal('food-category') : undefined}
                                addNewLabel="Add Category"
                            >
                                <option value="">None</option>
                                {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="SKU" htmlFor="sku" error={errors.sku}>
                            <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="Optional SKU code" />
                        </FormField>

                        <FormField label="Item Type" error={errors.item_type}>
                            <SearchableSelect value={data.item_type} onChange={(e) => setData('item_type', e.target.value as typeof data.item_type)}>
                                <option value="food">Food</option>
                                <option value="beverage">Beverage</option>
                                <option value="combo">Combo</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Food Type" error={errors.food_type}>
                            <SearchableSelect value={data.food_type} onChange={(e) => setData('food_type', e.target.value as typeof data.food_type)}>
                                <option value="">Not specified</option>
                                <option value="veg">🟢 Veg</option>
                                <option value="non_veg">🔴 Non-Veg</option>
                                <option value="egg">🟡 Egg</option>
                                <option value="vegan">🌱 Vegan</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Base Price (Rs.)" htmlFor="base_price" error={errors.base_price}>
                            <Input id="base_price" type="number" min="0" step="0.01" value={data.base_price} onChange={(e) => setData('base_price', e.target.value)} />
                        </FormField>

                        <FormField label="Preparation Time (minutes)" htmlFor="preparation_time" error={errors.preparation_time}>
                            <Input id="preparation_time" type="number" min="0" value={data.preparation_time} onChange={(e) => setData('preparation_time', e.target.value)} placeholder="Optional" />
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={errors.sort_order}>
                            <Input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                        </FormField>

                        <FormField label="Short Description" htmlFor="short_description" error={errors.short_description} className="md:col-span-2">
                            <Input id="short_description" value={data.short_description} onChange={(e) => setData('short_description', e.target.value)} placeholder="Brief one-line description" />
                        </FormField>

                        <FormField label="Description" htmlFor="description" error={errors.description} className="md:col-span-2">
                            <textarea
                                id="description"
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                                placeholder="Full description..."
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection title="Settings" description="Tax, discount, visibility, variants, and recipe settings.">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect value={data.is_active ? 'true' : 'false'} onChange={(e) => setData('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Taxable" error={errors.is_taxable}>
                            <SearchableSelect value={data.is_taxable ? 'true' : 'false'} onChange={(e) => setData('is_taxable', e.target.value === 'true')}>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Discountable" error={errors.is_discountable}>
                            <SearchableSelect value={data.is_discountable ? 'true' : 'false'} onChange={(e) => setData('is_discountable', e.target.value === 'true')}>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Featured" error={errors.is_featured}>
                            <SearchableSelect value={data.is_featured ? 'true' : 'false'} onChange={(e) => setData('is_featured', e.target.value === 'true')}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Has Variants" error={errors.has_variants}>
                            <SearchableSelect value={data.has_variants ? 'true' : 'false'} onChange={(e) => setData('has_variants', e.target.value === 'true')}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Has Add-ons" error={errors.has_addons}>
                            <SearchableSelect value={data.has_addons ? 'true' : 'false'} onChange={(e) => setData('has_addons', e.target.value === 'true')}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Recipe Enabled" error={errors.is_recipe_enabled}>
                            <SearchableSelect value={data.is_recipe_enabled ? 'true' : 'false'} onChange={(e) => setData('is_recipe_enabled', e.target.value === 'true')}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={foodsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Discard</Link>
                    <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Create & Continue Editing
                    </button>
                </div>
            </form>

            <QuickCreateFoodCategoryModal open={modal === 'food-category'} onClose={() => setModal(null)} />
        </>
    );
}
