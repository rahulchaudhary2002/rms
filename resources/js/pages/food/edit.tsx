import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as foodsIndex, show as foodsShow, update as foodsUpdate } from '@/routes/foods';
import type { Food, FoodCategory } from '@/types';

type Props = {
    food: Food;
    categories: Pick<FoodCategory, 'id' | 'name'>[];
};

export default function FoodEdit({ food, categories }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: food.name,
        food_category_id: food.food_category_id ? String(food.food_category_id) : '',
        item_type: food.item_type,
        food_type: food.food_type ?? '',
        base_price: food.base_price,
        sku: food.sku ?? '',
        short_description: food.short_description ?? '',
        description: food.description ?? '',
        preparation_time: food.preparation_time ? String(food.preparation_time) : '',
        sort_order: String(food.sort_order),
        has_variants: food.has_variants,
        has_addons: food.has_addons,
        is_recipe_enabled: food.is_recipe_enabled,
        is_taxable: food.is_taxable,
        is_discountable: food.is_discountable,
        is_featured: food.is_featured,
        is_active: food.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(foodsUpdate.url(food.id));
    }

    return (
        <>
            <Head title={`Edit: ${food.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Foods & Menu', href: foodsIndex.url() },
                    { label: food.name, href: foodsShow.url(food.id) },
                    { label: 'Edit' },
                ]}
                title={`Edit: ${food.name}`}
                description="Update core details and settings for this menu item."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Basic Information" description="Core details and pricing for this menu item.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        </FormField>

                        <FormField label="Category" error={errors.food_category_id}>
                            <SearchableSelect value={data.food_category_id} onChange={(e) => setData('food_category_id', e.target.value)}>
                                <option value="">None</option>
                                {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="SKU" htmlFor="sku" error={errors.sku}>
                            <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="Optional" />
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
                                <option value="veg">Veg</option>
                                <option value="non_veg">Non-Veg</option>
                                <option value="egg">Egg</option>
                                <option value="vegan">Vegan</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Base Price (Rs.)" htmlFor="base_price" error={errors.base_price}>
                            <Input id="base_price" type="number" min="0" step="0.01" value={data.base_price} onChange={(e) => setData('base_price', e.target.value)} />
                        </FormField>

                        <FormField label="Preparation Time (min)" htmlFor="preparation_time" error={errors.preparation_time}>
                            <Input id="preparation_time" type="number" min="0" value={data.preparation_time} onChange={(e) => setData('preparation_time', e.target.value)} placeholder="Optional" />
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={errors.sort_order}>
                            <Input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                        </FormField>

                        <FormField label="Short Description" htmlFor="short_description" error={errors.short_description} className="md:col-span-2">
                            <Input id="short_description" value={data.short_description} onChange={(e) => setData('short_description', e.target.value)} placeholder="Brief one-line description" />
                        </FormField>

                        <FormField label="Description" htmlFor="description" error={errors.description} className="md:col-span-2">
                            <textarea id="description" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring" />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection title="Settings" description="Tax, discount, visibility, variants, and recipe settings.">
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                        {([
                            ['Status',         'is_active',         [['true', 'Active'], ['false', 'Inactive']]],
                            ['Taxable',        'is_taxable',        [['true', 'Yes'], ['false', 'No']]],
                            ['Discountable',   'is_discountable',   [['true', 'Yes'], ['false', 'No']]],
                            ['Featured',       'is_featured',       [['false', 'No'], ['true', 'Yes']]],
                            ['Has Variants',   'has_variants',      [['false', 'No'], ['true', 'Yes']]],
                            ['Has Add-ons',    'has_addons',        [['false', 'No'], ['true', 'Yes']]],
                            ['Recipe Enabled', 'is_recipe_enabled', [['false', 'No'], ['true', 'Yes']]],
                        ] as const).map(([label, key, opts]) => (
                            <FormField key={key} label={label} error={errors[key as keyof typeof errors]}>
                                <SearchableSelect value={data[key as keyof typeof data] ? 'true' : 'false'} onChange={(e) => setData(key as any, e.target.value === 'true')}>
                                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </SearchableSelect>
                            </FormField>
                        ))}
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm italic text-muted-foreground sm:inline">Unsaved changes will be lost.</span>
                    <Link href={foodsShow.url(food.id)} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Cancel
                    </Link>
                    <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}
