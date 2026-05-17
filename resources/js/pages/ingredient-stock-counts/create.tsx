import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as countsIndex,
    create as countsCreate,
    store as countsStore,
} from '@/routes/ingredient-stock-counts';
import { cn } from '@/lib/utils';
import type { Ingredient, Warehouse } from '@/types';

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
    counted_quantity: string;
    remarks: string;
};

function emptyItem(): ItemRow {
    return { ingredient_id: '', ingredient_batch_id: '', counted_quantity: '', remarks: '' };
}

export default function IngredientStockCountsCreate({ warehouses, defaultWarehouseId, ingredients, stockByIngredient }: Props) {
    const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
    const [currentStock, setCurrentStock] = useState<Record<string, StockEntry>>(stockByIngredient);

    const { data, setData, post, processing, errors } = useForm({
        warehouse_id: defaultWarehouseId,
        count_date:   new Date().toISOString().slice(0, 10),
        remarks:      '',
        items:        items,
    });

    function handleWarehouseChange(warehouseId: string) {
        setData('warehouse_id', warehouseId);
        if (warehouseId) {
            router.get(
                countsCreate.url({ warehouse_id: warehouseId }),
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
        post(countsStore.url());
    }

    const ingredientById = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));

    function getDifference(item: ItemRow): number | null {
        if (!item.ingredient_id || item.counted_quantity === '') return null;
        const sys = parseFloat(currentStock[item.ingredient_id]?.quantity ?? '0');
        const counted = parseFloat(item.counted_quantity);
        if (isNaN(counted)) return null;
        return counted - sys;
    }

    return (
        <>
            <Head title="Create Stock Count" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Stock Counts', href: countsIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Stock Count"
                description="Record a physical inventory count to identify stock discrepancies."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Count Details" description="Select the warehouse and date for this count.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Warehouse" error={errors.warehouse_id}>
                            <SearchableSelect value={data.warehouse_id} onChange={(e) => handleWarehouseChange(e.target.value)}>
                                <option value="">Select warehouse…</option>
                                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Count Date" htmlFor="count_date" error={errors.count_date}>
                            <Input id="count_date" type="date" value={data.count_date} onChange={(e) => setData('count_date', e.target.value)} />
                        </FormField>

                        <FormField label="Remarks" htmlFor="remarks" error={errors.remarks} className="md:col-span-2">
                            <Input id="remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} placeholder="Optional notes about this count…" />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Items"
                    description="Enter the ingredients to count. System quantity is read from current stock."
                >
                    <div className="space-y-3">
                        {!data.warehouse_id && (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
                                Select a warehouse first to load current stock quantities.
                            </p>
                        )}

                        {items.map((item, index) => {
                            const diff = getDifference(item);
                            const systemQty = item.ingredient_id ? parseFloat(currentStock[item.ingredient_id]?.quantity ?? '0') : 0;
                            const unit = item.ingredient_id ? ingredientById[item.ingredient_id]?.base_unit?.short_name : '';

                            return (
                                <div key={index} className="rounded-lg border border-border/30 bg-muted/30 p-4 dark:border-stone-700 dark:bg-stone-900/30">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                                        <FormField label="Ingredient" error={(errors as Record<string, string>)[`items.${index}.ingredient_id`]}>
                                            <SearchableSelect value={item.ingredient_id} onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}>
                                                <option value="">Select ingredient…</option>
                                                {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                                            </SearchableSelect>
                                        </FormField>

                                        <FormField label={`System Qty${unit ? ` (${unit})` : ''}`}>
                                            <Input
                                                value={item.ingredient_id ? systemQty.toLocaleString() : '-'}
                                                readOnly
                                                className="cursor-default bg-muted/60 font-mono text-right"
                                            />
                                        </FormField>

                                        <FormField label={`Counted Qty${unit ? ` (${unit})` : ''}`} error={(errors as Record<string, string>)[`items.${index}.counted_quantity`]}>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.0001"
                                                value={item.counted_quantity}
                                                onChange={(e) => updateItem(index, 'counted_quantity', e.target.value)}
                                                placeholder="0"
                                                className="font-mono text-right"
                                            />
                                        </FormField>

                                        <FormField label="Difference">
                                            <div className={cn(
                                                'flex h-9 items-center justify-end rounded-md border px-3 font-mono text-sm font-bold',
                                                diff === null ? 'border-border/20 bg-muted/40 text-muted-foreground dark:border-stone-700' :
                                                diff > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/10 dark:text-emerald-400' :
                                                diff < 0 ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-400' :
                                                'border-border/20 bg-muted/40 text-muted-foreground dark:border-stone-700',
                                            )}>
                                                {diff === null ? '-' : (diff > 0 ? '+' : '') + diff.toFixed(4)}
                                            </div>
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

                                    <div className="mt-3">
                                        <FormField label="Remarks (optional)" error={(errors as Record<string, string>)[`items.${index}.remarks`]}>
                                            <Input value={item.remarks} onChange={(e) => updateItem(index, 'remarks', e.target.value)} placeholder="Optional item-level note…" />
                                        </FormField>
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
                    <Link href={countsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save Draft
                    </button>
                </div>
            </form>
        </>
    );
}
