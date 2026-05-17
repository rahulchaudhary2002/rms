import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as wastagesIndex,
    store as wastagesStore,
} from '@/routes/ingredient-wastages';
import type { Ingredient, WastageReason, Warehouse } from '@/types';

const REASON_LABELS: Record<WastageReason, string> = {
    expired:          'Expired',
    damaged:          'Damaged',
    spoiled:          'Spoiled',
    over_preparation: 'Over Preparation',
    staff_error:      'Staff Error',
    other:            'Other',
};

type Props = {
    warehouses: Pick<Warehouse, 'id' | 'name'>[];
    ingredients: (Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } })[];
};

type ItemRow = {
    ingredient_id: string;
    ingredient_batch_id: string;
    quantity: string;
};

function emptyItem(): ItemRow {
    return { ingredient_id: '', ingredient_batch_id: '', quantity: '' };
}

export default function IngredientWastagesCreate({ warehouses, ingredients }: Props) {
    const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

    const { data, setData, post, processing, errors } = useForm({
        warehouse_id:  '',
        wastage_date:  new Date().toISOString().slice(0, 10),
        reason:        'other' as WastageReason,
        remarks:       '',
        items:         items,
    });

    function updateItem(index: number, field: keyof ItemRow, value: string) {
        const next = items.map((row, i) => i === index ? { ...row, [field]: value } : row);
        setItems(next);
        setData('items', next);
    }

    function addItem() {
        const next = [...items, emptyItem()];
        setItems(next);
        setData('items', next);
    }

    function removeItem(index: number) {
        if (items.length === 1) return;
        const next = items.filter((_, i) => i !== index);
        setItems(next);
        setData('items', next);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(wastagesStore.url());
    }

    const ingredientById = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));

    return (
        <>
            <Head title="Create Wastage" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Wastages', href: wastagesIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Wastage"
                description="Record ingredient wastage from a warehouse."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Wastage Details" description="Select the warehouse, date, and reason for wastage.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Warehouse" error={errors.warehouse_id}>
                            <SearchableSelect value={data.warehouse_id} onChange={(e) => setData('warehouse_id', e.target.value)}>
                                <option value="">Select warehouse…</option>
                                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Wastage Date" htmlFor="wastage_date" error={errors.wastage_date}>
                            <Input id="wastage_date" type="date" value={data.wastage_date} onChange={(e) => setData('wastage_date', e.target.value)} />
                        </FormField>

                        <FormField label="Reason" error={errors.reason}>
                            <SearchableSelect value={data.reason} onChange={(e) => setData('reason', e.target.value as WastageReason)}>
                                {(Object.keys(REASON_LABELS) as WastageReason[]).map((r) => (
                                    <option key={r} value={r}>{REASON_LABELS[r]}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Remarks" htmlFor="remarks" error={errors.remarks} className="md:col-span-2">
                            <Input id="remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} placeholder="Optional notes…" />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection title="Items" description="Add ingredients and the quantity wasted. All quantities must be in the ingredient's base unit.">
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-border/30 bg-muted/30 p-4 md:grid-cols-[2fr_1fr_auto] dark:border-stone-700 dark:bg-stone-900/30">
                                <FormField label="Ingredient" error={(errors as Record<string, string>)[`items.${index}.ingredient_id`]}>
                                    <SearchableSelect value={item.ingredient_id} onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}>
                                        <option value="">Select ingredient…</option>
                                        {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                                    </SearchableSelect>
                                </FormField>

                                <FormField
                                    label={`Quantity${item.ingredient_id && ingredientById[item.ingredient_id]?.base_unit ? ` (${ingredientById[item.ingredient_id]!.base_unit!.short_name})` : ''}`}
                                    error={(errors as Record<string, string>)[`items.${index}.quantity`]}
                                >
                                    <Input
                                        type="number"
                                        min="0.0001"
                                        step="0.0001"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        placeholder="0"
                                    />
                                </FormField>

                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Add Item
                        </button>

                        {typeof errors.items === 'string' && (
                            <p className="text-sm text-red-600 dark:text-red-400">{errors.items}</p>
                        )}
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                    <Link href={wastagesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Wastage
                    </button>
                </div>
            </form>
        </>
    );
}
