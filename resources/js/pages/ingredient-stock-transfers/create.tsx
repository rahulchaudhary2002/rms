import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as transfersIndex,
    create as transfersCreate,
    store as transfersStore,
} from '@/routes/ingredient-stock-transfers';
import type { Ingredient, Warehouse } from '@/types';

type StockEntry = { quantity: string; average_cost: string };

type Props = {
    fromWarehouses: Pick<Warehouse, 'id' | 'name'>[];
    allWarehouses: Pick<Warehouse, 'id' | 'name'>[];
    defaultFromWarehouseId: string;
    ingredients: (Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: { id: number; name: string; short_name: string } })[];
    stockByIngredient: Record<string, StockEntry>;
};

type ItemRow = {
    ingredient_id: string;
    ingredient_batch_id: string;
    requested_quantity: string;
    remarks: string;
};

function emptyItem(): ItemRow {
    return { ingredient_id: '', ingredient_batch_id: '', requested_quantity: '', remarks: '' };
}

export default function IngredientStockTransfersCreate({ fromWarehouses, allWarehouses, defaultFromWarehouseId, ingredients, stockByIngredient }: Props) {
    const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
    const [currentStock, setCurrentStock] = useState<Record<string, StockEntry>>(stockByIngredient);

    const { data, setData, post, processing, errors } = useForm({
        from_warehouse_id: defaultFromWarehouseId,
        to_warehouse_id:   '',
        transfer_date:     new Date().toISOString().slice(0, 10),
        remarks:           '',
        items:             items,
    });

    function handleFromWarehouseChange(warehouseId: string) {
        setData('from_warehouse_id', warehouseId);
        if (warehouseId) {
            router.get(
                transfersCreate.url({ query: { from_warehouse_id: warehouseId } }),
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
        post(transfersStore.url());
    }

    const ingredientById = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));

    return (
        <>
            <Head title="Create Stock Transfer" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Stock Transfers', href: transfersIndex.url() },
                    { label: 'Create' },
                ]}
                title="Create Stock Transfer"
                description="Move ingredients from one warehouse to another."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection title="Transfer Details" description="Select source and destination warehouses and the transfer date.">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="From Warehouse" error={errors.from_warehouse_id}>
                            <SearchableSelect value={data.from_warehouse_id} onChange={(e) => handleFromWarehouseChange(e.target.value)}>
                                <option value="">Select source warehouse…</option>
                                {fromWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="To Warehouse" error={errors.to_warehouse_id}>
                            <SearchableSelect value={data.to_warehouse_id} onChange={(e) => setData('to_warehouse_id', e.target.value)}>
                                <option value="">Select destination warehouse…</option>
                                {allWarehouses.filter((w) => String(w.id) !== data.from_warehouse_id).map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </SearchableSelect>
                        </FormField>

                        <FormField label="Transfer Date" htmlFor="transfer_date" error={errors.transfer_date}>
                            <Input id="transfer_date" type="date" value={data.transfer_date} onChange={(e) => setData('transfer_date', e.target.value)} />
                        </FormField>

                        <FormField label="Remarks" htmlFor="remarks" error={errors.remarks} className="md:col-span-2">
                            <Input id="remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} placeholder="Optional notes…" />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection title="Items" description="Add ingredients and the quantity to transfer. All quantities must be in the ingredient's base unit.">
                    <div className="space-y-3">
                        {!data.from_warehouse_id && (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
                                Select a source warehouse first to load available stock quantities.
                            </p>
                        )}

                        {items.map((item, index) => {
                            const unit = item.ingredient_id ? ingredientById[item.ingredient_id]?.base_unit?.short_name : '';
                            const availableQty = item.ingredient_id ? parseFloat(currentStock[item.ingredient_id]?.quantity ?? '0') : null;

                            return (
                                <div key={index} className="rounded-lg border border-border/30 bg-muted/30 p-4 dark:border-stone-700 dark:bg-stone-900/30">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
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
                                            error={(errors as Record<string, string>)[`items.${index}.requested_quantity`]}
                                        >
                                            <Input
                                                type="number"
                                                min="0.0001"
                                                step="0.0001"
                                                value={item.requested_quantity}
                                                onChange={(e) => updateItem(index, 'requested_quantity', e.target.value)}
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

                                    <div className="mt-3">
                                        <FormField label="Remarks (optional)" error={(errors as Record<string, string>)[`items.${index}.remarks`]}>
                                            <Input value={item.remarks} onChange={(e) => updateItem(index, 'remarks', e.target.value)} placeholder="Optional item notes…" />
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
                    <Link href={transfersIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                        Discard
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Create Transfer
                    </button>
                </div>
            </form>
        </>
    );
}
