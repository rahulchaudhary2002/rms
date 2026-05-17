import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as returnsIndex,
    store as returnsStore,
} from '@/routes/purchase-returns';
import type { Ingredient, IngredientBatch, PurchaseInvoice, PurchaseReceive, Supplier, Unit, Warehouse } from '@/types';

type Props = {
    suppliers:       Pick<Supplier,       'id' | 'name'>[];
    warehouses:      Pick<Warehouse,      'id' | 'name'>[];
    purchaseReceives: Pick<PurchaseReceive, 'id' | 'receive_no'>[];
    purchaseInvoices: Pick<PurchaseInvoice, 'id' | 'invoice_no'>[];
    ingredients:     (Pick<Ingredient,    'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> | null })[];
    batches:         (Pick<IngredientBatch, 'id' | 'batch_no' | 'ingredient_id'>)[];
};

type ItemRow = {
    ingredient_id:      string;
    ingredient_batch_id: string;
    unit_id:            string;
    quantity:           string;
    unit_price:         string;
    reason:             string;
};

function emptyItem(): ItemRow {
    return { ingredient_id: '', ingredient_batch_id: '', unit_id: '', quantity: '', unit_price: '', reason: '' };
}

function lineTotal(item: ItemRow): number {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
}

function fmt(n: number): string {
    return n.toFixed(2);
}

export default function PurchaseReturnsCreate({ suppliers, warehouses, purchaseReceives, purchaseInvoices, ingredients, batches }: Props) {
    const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

    const { data, setData, post, processing, errors } = useForm({
        supplier_id:         '',
        warehouse_id:        '',
        purchase_receive_id: '',
        purchase_invoice_id: '',
        return_date:         new Date().toISOString().slice(0, 10),
        tax_amount:          '0',
        reason:              '',
        items:               items,
    });

    function updateItem(index: number, field: keyof ItemRow, value: string) {
        const next = items.map((row, i) => {
            if (i !== index) return row;
            const updated = { ...row, [field]: value };
            if (field === 'ingredient_id') {
                const ing = ingredients.find((ig) => String(ig.id) === value);
                updated.unit_id = ing?.base_unit ? String(ing.base_unit.id) : '';
                updated.ingredient_batch_id = '';
            }
            return updated;
        });
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

    const subtotal   = items.reduce((sum, item) => sum + lineTotal(item), 0);
    const tax        = parseFloat(data.tax_amount) || 0;
    const grandTotal = subtotal + tax;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(returnsStore.url());
    }

    const ingredientMap = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));
    const batchesByIngredient = batches.reduce<Record<string, typeof batches>>((acc, b) => {
        const key = String(b.ingredient_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push(b);
        return acc;
    }, {});

    return (
        <>
            <Head title="New Purchase Return" />
            <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Purchase Returns', href: returnsIndex.url() },
                        { label: 'New Return' },
                    ]}
                    title="New Purchase Return"
                    description="Record items being returned to a supplier."
                />

                <form onSubmit={submit} className="space-y-8 pb-6">
                    <FormSection title="Return Details" description="Select supplier and warehouse for this return.">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <FormField label="Supplier" required error={errors.supplier_id}>
                                <SearchableSelect
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                >
                                    <option value="">Select supplier…</option>
                                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Warehouse" required error={errors.warehouse_id}>
                                <SearchableSelect
                                    value={data.warehouse_id}
                                    onChange={(e) => setData('warehouse_id', e.target.value)}
                                >
                                    <option value="">Select warehouse…</option>
                                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Return Date" required error={errors.return_date}>
                                <Input type="date" value={data.return_date} onChange={(e) => setData('return_date', e.target.value)} />
                            </FormField>
                            <FormField label="Purchase Receive (optional)" error={errors.purchase_receive_id}>
                                <SearchableSelect
                                    value={data.purchase_receive_id}
                                    onChange={(e) => setData('purchase_receive_id', e.target.value)}
                                >
                                    <option value="">None</option>
                                    {purchaseReceives.map((r) => <option key={r.id} value={r.id}>{r.receive_no}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Purchase Invoice (optional)" error={errors.purchase_invoice_id}>
                                <SearchableSelect
                                    value={data.purchase_invoice_id}
                                    onChange={(e) => setData('purchase_invoice_id', e.target.value)}
                                >
                                    <option value="">None</option>
                                    {purchaseInvoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.invoice_no}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Reason" error={errors.reason} className="md:col-span-2">
                                <textarea
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    rows={2}
                                    placeholder="Reason for return…"
                                    className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    <FormSection title="Return Items" description="Add items being returned with quantities and reasons.">
                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const ing          = item.ingredient_id ? ingredientMap[item.ingredient_id] : null;
                                const ingBatches   = item.ingredient_id ? (batchesByIngredient[item.ingredient_id] ?? []) : [];
                                const total        = lineTotal(item);
                                return (
                                    <div key={index} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
                                            <FormField label="Ingredient" error={(errors as Record<string, string>)[`items.${index}.ingredient_id`]}>
                                                <SearchableSelect
                                                    value={item.ingredient_id}
                                                    onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}
                                                >
                                                    <option value="">Select ingredient…</option>
                                                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}{i.code ? ` (${i.code})` : ''}</option>)}
                                                </SearchableSelect>
                                            </FormField>
                                            <FormField label="Batch" error={(errors as Record<string, string>)[`items.${index}.ingredient_batch_id`]}>
                                                <SearchableSelect
                                                    value={item.ingredient_batch_id}
                                                    onChange={(e) => updateItem(index, 'ingredient_batch_id', e.target.value)}
                                                    disabled={!item.ingredient_id || ingBatches.length === 0}
                                                >
                                                    <option value="">No batch</option>
                                                    {ingBatches.map((b) => <option key={b.id} value={b.id}>{b.batch_no}</option>)}
                                                </SearchableSelect>
                                            </FormField>
                                            <FormField label="Unit">
                                                <Input value={ing?.base_unit?.name ?? '—'} readOnly className="cursor-default bg-muted/60" />
                                            </FormField>
                                            <FormField label="Quantity" error={(errors as Record<string, string>)[`items.${index}.quantity`]}>
                                                <Input
                                                    type="number" min="0.0001" step="0.0001"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    placeholder="0"
                                                    className="font-mono text-right"
                                                />
                                            </FormField>
                                            <FormField label="Unit Price" error={(errors as Record<string, string>)[`items.${index}.unit_price`]}>
                                                <Input
                                                    type="number" min="0" step="0.0001"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                    placeholder="0.00"
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
                                        <div className="mt-3 flex items-center justify-between">
                                            <FormField label="Reason" error={(errors as Record<string, string>)[`items.${index}.reason`]} className="flex-1 mr-4">
                                                <Input value={item.reason} onChange={(e) => updateItem(index, 'reason', e.target.value)} placeholder="Item-level reason (optional)" />
                                            </FormField>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Line Total</p>
                                                <p className="font-mono font-medium">{fmt(total)}</p>
                                            </div>
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
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div className="w-full max-w-xs space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono font-medium">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">Tax</span>
                                    <Input
                                        type="number" min="0" step="0.01"
                                        value={data.tax_amount}
                                        onChange={(e) => setData('tax_amount', e.target.value)}
                                        className="w-28 font-mono text-right"
                                    />
                                </div>
                                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                                    <span>Grand Total</span>
                                    <span className="font-mono">{fmt(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                        <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                        <Link href={returnsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Discard Draft
                        </Link>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                            {processing ? 'Saving…' : 'Create Return'}
                        </button>
                    </div>
            </form>
        </>
    );
}
