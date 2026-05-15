import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import type { Food, FoodVariant } from '@/types';

type Props = {
    variant: FoodVariant;
    foods: Pick<Food, 'id' | 'name'>[];
};

const indexUrl = '/food-variants';
const updateUrl = (id: number) => `/food-variants/${id}`;

export default function FoodVariantEdit({ variant, foods }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        food_id: String(variant.food_id),
        name: variant.name,
        sku: variant.sku ?? '',
        price: String(variant.price ?? '0.00'),
        is_default: variant.is_default,
        is_active: variant.is_active,
        sort_order: String(variant.sort_order ?? 0),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(updateUrl(variant.id));
    }

    return (
        <>
            <Head title={`Edit Variant: ${variant.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Food Variants', href: indexUrl },
                    { label: 'Edit' },
                ]}
                title={`Edit Variant: ${variant.name}`}
                description={variant.food?.name ?? 'Update this food variant.'}
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Variant Details" description="Update the parent food, pricing, SKU, and display order.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Food" error={errors.food_id} className="md:col-span-2">
                            <SearchableSelect value={data.food_id} onChange={(e) => setData('food_id', e.target.value)}>
                                <option value="">Select food...</option>
                                {foods.map((food) => <option key={food.id} value={String(food.id)}>{food.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Variant Name" htmlFor="name" error={errors.name}>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        </FormField>

                        <FormField label="SKU" htmlFor="sku" error={errors.sku}>
                            <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="Optional SKU code" />
                        </FormField>

                        <FormField label="Price (Rs.)" htmlFor="price" error={errors.price}>
                            <Input id="price" type="number" min="0" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} />
                        </FormField>

                        <FormField label="Sort Order" htmlFor="sort_order" error={errors.sort_order}>
                            <Input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                        </FormField>

                        <FormField label="Default Variant" error={errors.is_default}>
                            <SearchableSelect value={data.is_default ? 'true' : 'false'} onChange={(e) => setData('is_default', e.target.value === 'true')}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect value={data.is_active ? 'true' : 'false'} onChange={(e) => setData('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8">
                    <Link href={indexUrl} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Discard</Link>
                    <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Update Variant
                    </button>
                </div>
            </form>
        </>
    );
}
