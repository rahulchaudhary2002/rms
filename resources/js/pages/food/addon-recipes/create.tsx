import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as recipesIndex, store as recipesStore } from '@/routes/recipes/addons';
import type { Addon, AddonGroup, Ingredient, Unit } from '@/types';

type AddonOption = Pick<Addon, 'id' | 'name' | 'addon_group_id'> & { group?: Pick<AddonGroup, 'id' | 'name'> | null };

type Props = {
    addons: AddonOption[];
    ingredients: Pick<Ingredient, 'id' | 'name'>[];
    units: Pick<Unit, 'id' | 'name' | 'short_name'>[];
};

export default function AddonRecipeCreate({ addons, ingredients, units }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        addon_id: '',
        ingredient_id: '',
        unit_id: '',
        quantity: '',
        wastage_quantity: '0',
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(recipesStore.url());
    }

    return (
        <>
            <Head title="Create Add-on Recipe" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Add-on Recipes', href: recipesIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Add-on Recipe"
                description="Add an ingredient recipe line to an add-on."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Recipe Line" description="Choose the add-on, ingredient, usage unit, and quantity.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Add-on" error={errors.addon_id} className="md:col-span-2">
                            <SearchableSelect value={data.addon_id} onChange={(e) => setData('addon_id', e.target.value)}>
                                <option value="">Select add-on...</option>
                                {addons.map((addon) => (
                                    <option key={addon.id} value={String(addon.id)}>
                                        {addon.name}{addon.group ? ` (${addon.group.name})` : ''}
                                    </option>
                                ))}
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
                    <Link href={recipesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Discard</Link>
                    <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                        Create Recipe
                    </button>
                </div>
            </form>
        </>
    );
}
