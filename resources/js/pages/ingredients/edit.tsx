import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import {
    QuickCreateIngredientCategoryModal,
    QuickCreateUnitModal,
} from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import {
    index as ingredientsIndex,
    update as ingredientsUpdate,
} from '@/routes/ingredients';
import type { Ingredient, IngredientCategory, Unit } from '@/types';

const INGREDIENT_TYPE_LABELS: Record<string, string> = {
    raw_material:   'Raw Material (e.g. Chicken, Rice, Oil)',
    ready_product:  'Ready Product (e.g. Coke bottle, Chips)',
    packaging:      'Packaging (e.g. Box, Cup, Spoon)',
    consumable:     'Consumable (e.g. Gas, Tissue, Gloves)',
};

const COSTING_METHOD_LABELS: Record<string, string> = {
    fifo:                    'FIFO – First In, First Out',
    lifo:                    'LIFO – Last In, First Out',
    weighted_average:        'Weighted Average',
    moving_average:          'Moving Average',
    specific_identification: 'Specific Identification',
};

type Props = {
    ingredient: Ingredient;
    categories: Pick<IngredientCategory, 'id' | 'name' | 'slug'>[];
    units: Pick<Unit, 'id' | 'name' | 'short_name' | 'type'>[];
};

export default function IngredientsEdit({
    ingredient,
    categories,
    units,
}: Props) {
    const { can } = useCan();
    const [modal, setModal] = useState<'category' | 'unit' | null>(null);
    const { data, setData, put, processing, errors } = useForm({
        ingredient_category_id:
            ingredient.ingredient_category_id !== null
                ? String(ingredient.ingredient_category_id)
                : '',
        name: ingredient.name,
        slug: ingredient.slug,
        code: ingredient.code,
        barcode: ingredient.barcode ?? '',
        type: ingredient.type,
        base_unit_id: String(ingredient.base_unit_id),
        default_purchase_unit_id:
            ingredient.default_purchase_unit_id !== null
                ? String(ingredient.default_purchase_unit_id)
                : '',
        default_usage_unit_id:
            ingredient.default_usage_unit_id !== null
                ? String(ingredient.default_usage_unit_id)
                : '',
        minimum_stock: ingredient.minimum_stock,
        reorder_stock: ingredient.reorder_stock,
        costing_method: ingredient.costing_method,
        is_perishable: ingredient.is_perishable,
        track_expiry: ingredient.track_expiry,
        description: ingredient.description ?? '',
        is_active: ingredient.is_active,
    });

    function slugify(value: string) {
        return value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    function handleTrackExpiryChange(checked: boolean) {
        setData('track_expiry', checked);

        if (checked) {
            setData('is_perishable', true);
        }
    }

    function handlePerishableChange(checked: boolean) {
        setData('is_perishable', checked);

        if (!checked) {
            setData('track_expiry', false);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(ingredientsUpdate.url(ingredient.id));
    }

    return (
        <>
            <Head title={`Edit Ingredient: ${ingredient.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Ingredients', href: ingredientsIndex.url() },
                    { label: ingredient.name },
                ]}
                title={`Edit Ingredient: ${ingredient.name}`}
                description="Update the ingredient details below."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Basic Information"
                    description="Update the ingredient name, code, and category."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Name"
                            htmlFor="name"
                            error={errors.name}
                            className="md:col-span-2"
                        >
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                        </FormField>

                        <FormField
                            label="Slug"
                            htmlFor="slug"
                            error={errors.slug}
                        >
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) =>
                                    setData('slug', slugify(e.target.value))
                                }
                            />
                        </FormField>

                        <FormField
                            label="Code"
                            htmlFor="code"
                            error={errors.code}
                        >
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) =>
                                    setData('code', e.target.value)
                                }
                            />
                        </FormField>

                        <FormField
                            label="Barcode"
                            htmlFor="barcode"
                            error={errors.barcode}
                        >
                            <Input
                                id="barcode"
                                value={data.barcode}
                                onChange={(e) =>
                                    setData('barcode', e.target.value)
                                }
                            />
                        </FormField>

                        <FormField
                            label="Type"
                            error={errors.type}
                        >
                            <SearchableSelect
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                            >
                                {Object.entries(INGREDIENT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Category"
                            error={errors.ingredient_category_id}
                        >
                            <SearchableSelect
                                value={data.ingredient_category_id}
                                onChange={(e) =>
                                    setData(
                                        'ingredient_category_id',
                                        e.target.value,
                                    )
                                }
                                onAddNew={
                                    can('ingredient-categories-create')
                                        ? () => setModal('category')
                                        : undefined
                                }
                                addNewLabel="Add Category"
                            >
                                <option value="">Uncategorised</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Description"
                            htmlFor="description"
                            error={errors.description}
                            className="md:col-span-2"
                        >
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Units"
                    description="Update the base unit and optional default units."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Base Unit"
                            error={errors.base_unit_id}
                            className="md:col-span-2"
                        >
                            <SearchableSelect
                                value={data.base_unit_id}
                                onChange={(e) =>
                                    setData('base_unit_id', e.target.value)
                                }
                                onAddNew={
                                    can('units-create')
                                        ? () => setModal('unit')
                                        : undefined
                                }
                                addNewLabel="Add Unit"
                            >
                                <option value="">Select base unit…</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name} ({unit.short_name})
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Default Purchase Unit"
                            error={errors.default_purchase_unit_id}
                        >
                            <SearchableSelect
                                value={data.default_purchase_unit_id}
                                onChange={(e) =>
                                    setData(
                                        'default_purchase_unit_id',
                                        e.target.value,
                                    )
                                }
                                onAddNew={
                                    can('units-create')
                                        ? () => setModal('unit')
                                        : undefined
                                }
                                addNewLabel="Add Unit"
                            >
                                <option value="">Same as base unit</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name} ({unit.short_name})
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Default Usage Unit"
                            error={errors.default_usage_unit_id}
                        >
                            <SearchableSelect
                                value={data.default_usage_unit_id}
                                onChange={(e) =>
                                    setData(
                                        'default_usage_unit_id',
                                        e.target.value,
                                    )
                                }
                                onAddNew={
                                    can('units-create')
                                        ? () => setModal('unit')
                                        : undefined
                                }
                                addNewLabel="Add Unit"
                            >
                                <option value="">Same as base unit</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name} ({unit.short_name})
                                    </option>
                                ))}
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Stock & Costing"
                    description="Update stock alert thresholds and the costing method used for valuation."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Minimum Stock"
                            htmlFor="minimum_stock"
                            error={errors.minimum_stock}
                        >
                            <Input
                                id="minimum_stock"
                                type="number"
                                min="0"
                                step="0.0001"
                                value={data.minimum_stock}
                                onChange={(e) => setData('minimum_stock', e.target.value)}
                            />
                        </FormField>

                        <FormField
                            label="Reorder Stock"
                            htmlFor="reorder_stock"
                            error={errors.reorder_stock}
                        >
                            <Input
                                id="reorder_stock"
                                type="number"
                                min="0"
                                step="0.0001"
                                value={data.reorder_stock}
                                onChange={(e) => setData('reorder_stock', e.target.value)}
                            />
                        </FormField>

                        <FormField
                            label="Costing Method"
                            error={errors.costing_method}
                            className="md:col-span-2"
                        >
                            <SearchableSelect
                                value={data.costing_method}
                                onChange={(e) => setData('costing_method', e.target.value)}
                            >
                                {Object.entries(COSTING_METHOD_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Properties & Status"
                    description="Update perishability, expiry tracking, and active status."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                            label="Perishable"
                            error={errors.is_perishable}
                        >
                            <SearchableSelect
                                value={data.is_perishable ? 'true' : 'false'}
                                onChange={(e) =>
                                    handlePerishableChange(
                                        e.target.value === 'true',
                                    )
                                }
                            >
                                <option value="false">No</option>
                                <option value="true">
                                    Yes - this ingredient is perishable
                                </option>
                            </SearchableSelect>
                        </FormField>

                        <FormField
                            label="Track Expiry"
                            error={errors.track_expiry}
                        >
                            <SearchableSelect
                                value={data.track_expiry ? 'true' : 'false'}
                                onChange={(e) =>
                                    handleTrackExpiryChange(
                                        e.target.value === 'true',
                                    )
                                }
                            >
                                <option value="false">No</option>
                                <option value="true">
                                    Yes - track expiry dates
                                </option>
                            </SearchableSelect>
                            {data.track_expiry && (
                                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    Tracking expiry automatically marks this
                                    ingredient as perishable.
                                </p>
                            )}
                        </FormField>

                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) =>
                                    setData(
                                        'is_active',
                                        e.target.value === 'true',
                                    )
                                }
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">
                        Unsaved changes will be lost.
                    </span>
                    <Link
                        href={ingredientsIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Changes
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save Changes
                    </button>
                </div>
            </form>

            <QuickCreateIngredientCategoryModal
                open={modal === 'category'}
                onClose={() => setModal(null)}
            />
            <QuickCreateUnitModal
                open={modal === 'unit'}
                onClose={() => setModal(null)}
            />
        </>
    );
}
