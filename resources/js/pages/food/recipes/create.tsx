import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import type { Food, FoodVariant, Ingredient, Unit } from '@/types';

type FoodOption = Pick<Food, 'id' | 'name'> & { variants?: Pick<FoodVariant, 'id' | 'name' | 'food_id'>[] };

type Props = {
    foods: FoodOption[];
    ingredients: Pick<Ingredient, 'id' | 'name'>[];
    units: Pick<Unit, 'id' | 'name' | 'short_name'>[];
};

const indexUrl = '/recipes/food';
const storeUrl = '/recipes/food';

export default function FoodRecipeCreate({ foods, ingredients, units }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        food_id: '',
        food_variant_id: '',
        ingredient_id: '',
        unit_id: '',
        quantity: '',
        wastage_quantity: '0',
        is_active: true,
    });

    const selectedFood = useMemo(
        () => foods.find((food) => String(food.id) === String(data.food_id)),
        [foods, data.food_id],
    );
    const variants = selectedFood?.variants ?? [];

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(storeUrl);
    }

    return (
        <>
            <Head title="Create Food Recipe" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Food Recipes', href: indexUrl },
                    { label: 'Create' },
                ]}
                title="Create Food Recipe"
                description="Add an ingredient recipe line to a food item or variant."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Recipe Line" description="Choose the food, ingredient, usage unit, and quantity.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Food" error={errors.food_id}>
                            <SearchableSelect value={data.food_id} onChange={(e) => {
                                setData((current) => ({ ...current, food_id: e.target.value, food_variant_id: '' }));
                            }}>
                                <option value="">Select food...</option>
                                {foods.map((food) => <option key={food.id} value={String(food.id)}>{food.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Variant" error={errors.food_variant_id}>
                            <SearchableSelect value={data.food_variant_id} onChange={(e) => setData('food_variant_id', e.target.value)} disabled={!selectedFood}>
                                <option value="">Base recipe</option>
                                {variants.map((variant) => <option key={variant.id} value={String(variant.id)}>{variant.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Ingredient" error={errors.ingredient_id}>
                            <SearchableSelect value={data.ingredient_id} onChange={(e) => setData('ingredient_id', e.target.value)}>
                                <option value="">Select ingredient...</option>
                                {ingredients.map((ingredient) => <option key={ingredient.id} value={String(ingredient.id)}>{ingredient.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Unit" error={errors.unit_id}>
                            <SearchableSelect value={data.unit_id} onChange={(e) => setData('unit_id', e.target.value)}>
                                <option value="">Select unit...</option>
                                {units.map((unit) => <option key={unit.id} value={String(unit.id)}>{unit.name} ({unit.short_name})</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Quantity" htmlFor="quantity" error={errors.quantity}>
                            <Input id="quantity" type="number" min="0" step="0.0001" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} placeholder="0.0000" />
                        </FormField>

                        <FormField label="Wastage Quantity" htmlFor="wastage_quantity" error={errors.wastage_quantity}>
                            <Input id="wastage_quantity" type="number" min="0" step="0.0001" value={data.wastage_quantity} onChange={(e) => setData('wastage_quantity', e.target.value)} placeholder="0.0000" />
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
                        Create Recipe
                    </button>
                </div>
            </form>
        </>
    );
}
