import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as stockOutsIndex,
    create as stockOutsCreate,
    store as stockOutsStore,
} from '@/routes/ingredient-stock-outs';
import type { Ingredient, StockOutPurpose, Warehouse } from '@/types';

const PURPOSE_LABELS: Record<StockOutPurpose, string> = {
    production_use: 'Production Use',
    kitchen_use:    'Kitchen Use',
    sample:         'Sample',
    distribution:   'Distribution',
    other:          'Other',
};

type StockEntry = { quantity: string; average_cost: string };

type Props = {
    warehouses: Pick<Warehouse, 'id' | 'name'>[];
    defaultWarehouseId: string;
    ingredients: (Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } })[];
    stockByIngredient: Record<string, StockEntry>;
};

type ItemRow = {
    ingredient_id: string;
    ingredient_batch_id: string;
    quantity: string;
};

function emptyItem(): ItemRow {
    return { ingredient_id: '', ingredient_batch_id: '', quantity: '' };
}

export default function IngredientStockOutsCreate({ warehouses, defaultWarehouseId, ingredients, stockByIngredient }: Props) {
    const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
    const [currentStock, setCurrentStock] = useState<Record<string, StockEntry>>(stockByIngredient);

    const { data, setData, post, processing, errors } = useForm({
        warehouse_id:    defaultWarehouseId,
        stock_out_date:  new Date().toISOString().slice(0, 10),
        purpose:         'other' as StockOutPurpose,
        remarks:         '',
        items:           items,
    });

    function handleWarehouseChange(warehouseId: string) {
        setData('warehouse_id', warehouseId);
        if (warehouseId) {
            router.get(
                stockOutsCreate.url({ query: { warehouse_id: warehouseId } }),
                {},
                {
                    only: ['stockByIngredient'],
                    preserveState: true,
                    onSuccess: (page) => {
                        setCurrentStock((page.props as { stockByIngredient: Record<string, StockEntry> }).stockByIngredient ?? {});
                    },
                }
            );
        } else {
            setCurrentStock({});
        }
    }

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
        post(stockOutsStore.url());
    }

    const ingredientById = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));

    return (
        <>
            <Head title="Create Stock Out" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Stock Outs', href: stockOutsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Stock Out"
                description="Record ingredient stock out from a warehouse."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Stock Out Details" description="Select the warehouse, date, and purpose for the stock out.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Warehouse" error={errors.warehouse_id}>
                            <SearchableSelect value={data.warehouse_id} onChange={(e) => handleWarehouseChange(e.target.value)}>
                                <option value="">Select warehouse…</option>
                                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Stock Out Date" htmlFor="stock_out_date" error={errors.stock_out_date}>
                            <Input id="stock_out_date" type="date" value={data.stock_out_date} onChange={(e) => setData('stock_out_date', e.target.value)} />
                        </FormField>

                        <FormField label="Purpose" error={errors.purpose}>
                            <SearchableSelect value={data.purpose} onChange={(e) => setData('purpose', e.target.value as StockOutPurpose)}>
                                {(Object.keys(PURPOSE_LABELS) as StockOutPurpose[]).map((p) => (
                                    <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Remarks" htmlFor="remarks" error={errors.remarks} className="md:col-span-2">
                            <Input id="remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} placeholder="Optional notes…" />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection title="Items" description="Add ingredients and the quantity to issue out. All quantities must be in the ingredient's base unit.">
                    <div className="space-y-3">
                        {!data.warehouse_id && (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
                                Select a warehouse first to load current stock quantities.
                            </p>
                        )}

                        {items.map((item, index) => {
                            const unit = item.ingredient_id ? ingredientById[item.ingredient_id]?.base_unit?.short_name : '';
                            const availableQty = item.ingredient_id ? parseFloat(currentStock[item.ingredient_id]?.quantity ?? '0') : null;

                            return (
                                <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-border/30 bg-muted/30 p-4 md:grid-cols-[2fr_1fr_1fr_auto] dark:border-stone-700 dark:bg-stone-900/30">
                                    <FormField label="Ingredient" error={(errors as Record<string, string>)[`items.${index}.ingredient_id`]}>
                                        <SearchableSelect value={item.ingredient_id} onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}>
                                            <option value="">Select ingredient…</option>
                                            {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                                        </SearchableSelect>
                                    </FormField>

                                    <FormField label={`Available${unit ? ` (${unit})` : ''}`}>
                                        <Input
                                            value={availableQty !== null ? availableQty.toLocaleString() : '-'}
                                            readOnly
                                            className="cursor-default bg-muted/60 font-mono text-right"
                                        />
                                    </FormField>

                                    <FormField
                                        label={`Quantity${unit ? ` (${unit})` : ''}`}
                                        error={(errors as Record<string, string>)[`items.${index}.quantity`]}
                                    >
                                        <Input
                                            type="number"
                                            min="0.0001"
                                            step="0.0001"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            placeholder="0"
                                            className="font-mono text-right"
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
                            );
                        })}

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
                    <Link href={stockOutsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Stock Out
                    </button>
                </div>
            </form>
        </>
    );
}
