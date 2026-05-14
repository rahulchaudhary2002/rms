import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index as ingredientsIndex, store as ingredientsStore } from '@/routes/ingredients';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { IngredientCategory, Unit } from '@/types';

type Props = {
    categories: Pick<IngredientCategory, 'id' | 'name' | 'slug'>[];
    units: Pick<Unit, 'id' | 'name' | 'short_name' | 'type'>[];
};

export default function IngredientsCreate({ categories, units }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        ingredient_category_id:   '',
        name:                     '',
        slug:                     '',
        code:                     '',
        barcode:                  '',
        base_unit_id:             '',
        default_purchase_unit_id: '',
        default_usage_unit_id:    '',
        is_perishable:            false,
        track_expiry:             false,
        description:              '',
        is_active:                true,
    });

    function slugify(value: string) {
        return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function handleTrackExpiryChange(checked: boolean) {
        setData('track_expiry', checked);
        if (checked) setData('is_perishable', true);
    }

    function handlePerishableChange(checked: boolean) {
        setData('is_perishable', checked);
        if (!checked) setData('track_expiry', false);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(ingredientsStore.url());
    }

    return (
        <>
            <Head title="Create Ingredient" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Ingredients', href: ingredientsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Ingredient"
                description="Add a new raw ingredient to the system."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Basic Information"
                    description="Set the ingredient name, code, and category."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => {
                                    setData('name', e.target.value);
                                    if (!data.slug) setData('slug', slugify(e.target.value));
                                }}
                                placeholder="e.g. Tomato"
                            />
                        </FormField>

                        <FormField label="Slug" htmlFor="slug" error={errors.slug}>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', slugify(e.target.value))}
                                placeholder="e.g. tomato"
                            />
                        </FormField>

                        <FormField label="Code" htmlFor="code" error={errors.code}>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="e.g. ING-001"
                            />
                        </FormField>

                        <FormField label="Barcode" htmlFor="barcode" error={errors.barcode}>
                            <Input
                                id="barcode"
                                value={data.barcode}
                                onChange={(e) => setData('barcode', e.target.value)}
                                placeholder="Optional barcode"
                            />
                        </FormField>

                        <FormField label="Category" error={errors.ingredient_category_id}>
                            <SearchableSelect
                                value={data.ingredient_category_id}
                                onChange={(e) => setData('ingredient_category_id', e.target.value)}
                            >
                                <option value="">Uncategorised</option>
                                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Description" htmlFor="description" error={errors.description} className="md:col-span-2">
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Optional description"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Units"
                    description="Specify the base unit and optional default units for purchasing and usage."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Base Unit" error={errors.base_unit_id} className="md:col-span-2">
                            <SearchableSelect
                                value={data.base_unit_id}
                                onChange={(e) => setData('base_unit_id', e.target.value)}
                            >
                                <option value="">Select base unit…</option>
                                {units.map((unit) => (<option key={unit.id} value={unit.id}>{unit.name} ({unit.short_name})</option>))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Default Purchase Unit" error={errors.default_purchase_unit_id}>
                            <SearchableSelect
                                value={data.default_purchase_unit_id}
                                onChange={(e) => setData('default_purchase_unit_id', e.target.value)}
                            >
                                <option value="">Same as base unit</option>
                                {units.map((unit) => (<option key={unit.id} value={unit.id}>{unit.name} ({unit.short_name})</option>))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Default Usage Unit" error={errors.default_usage_unit_id}>
                            <SearchableSelect
                                value={data.default_usage_unit_id}
                                onChange={(e) => setData('default_usage_unit_id', e.target.value)}
                            >
                                <option value="">Same as base unit</option>
                                {units.map((unit) => (<option key={unit.id} value={unit.id}>{unit.name} ({unit.short_name})</option>))}
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Properties & Status"
                    description="Set perishability, expiry tracking, and active status."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Perishable" error={errors.is_perishable}>
                            <SearchableSelect
                                value={data.is_perishable ? 'true' : 'false'}
                                onChange={(e) => handlePerishableChange(e.target.value === 'true')}
                            >
                                <option value="false">No</option>
                                <option value="true">Yes — this ingredient is perishable</option>
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Track Expiry" error={errors.track_expiry}>
                            <SearchableSelect
                                value={data.track_expiry ? 'true' : 'false'}
                                onChange={(e) => handleTrackExpiryChange(e.target.value === 'true')}
                            >
                                <option value="false">No</option>
                                <option value="true">Yes — track expiry dates</option>
                            </SearchableSelect>
                            {data.track_expiry && (
                                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    Tracking expiry automatically marks this ingredient as perishable.
                                </p>
                            )}
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
                    <Link href={ingredientsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard Draft
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Ingredient
                    </button>
                </div>
            </form>
        </>
    );
}
