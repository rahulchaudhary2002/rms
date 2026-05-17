import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as receivesIndex,
    store as receivesStore,
} from '@/routes/purchase-receives';
import type { Ingredient, Supplier, Unit, Warehouse } from '@/types';

type PurchaseOrderPrefill = {
    id:                string;
    purchase_order_id: string;
    purchase_order_no: string;
    supplier_id:       string;
    warehouse_id:      string;
    items: {
        purchase_order_item_id: string;
        ingredient_id:          string;
        unit_id:                string;
        ordered_quantity:       string;
        unit_price:             string;
        ingredient_name:        string;
        unit_name:              string;
    }[];
};

type PurchaseOrderOption = Omit<PurchaseOrderPrefill, 'id'> & {
    id: number | string;
};

type Props = {
    suppliers:      Pick<Supplier,      'id' | 'name'>[];
    warehouses:     Pick<Warehouse,     'id' | 'name'>[];
    ingredients:    (Pick<Ingredient,   'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> | null })[];
    purchaseOrders: PurchaseOrderOption[];
    prefill?: PurchaseOrderPrefill | null;
};

type ItemRow = {
    purchase_order_item_id: string;
    ingredient_id:          string;
    unit_id:                string;
    ordered_quantity:       string;
    received_quantity:      string;
    rejected_quantity:      string;
    unit_price:             string;
    batch_no:               string;
    manufactured_date:      string;
    expiry_date:            string;
    remarks:                string;
};

function emptyItem(): ItemRow {
    return {
        purchase_order_item_id: '',
        ingredient_id:          '',
        unit_id:                '',
        ordered_quantity:       '',
        received_quantity:      '',
        rejected_quantity:      '0',
        unit_price:             '',
        batch_no:               '',
        manufactured_date:      '',
        expiry_date:            '',
        remarks:                '',
    };
}

function itemsFromPurchaseOrder(order?: PurchaseOrderPrefill | null): ItemRow[] {
    return order?.items.map((it) => ({
        purchase_order_item_id: it.purchase_order_item_id,
        ingredient_id:          it.ingredient_id,
        unit_id:                it.unit_id,
        ordered_quantity:       it.ordered_quantity,
        received_quantity:      '',
        rejected_quantity:      '0',
        unit_price:             it.unit_price,
        batch_no:               '',
        manufactured_date:      '',
        expiry_date:            '',
        remarks:                '',
    })) ?? [];
}

export default function PurchaseReceivesCreate({ suppliers, warehouses, ingredients, purchaseOrders, prefill }: Props) {
    const prefillItems = itemsFromPurchaseOrder(prefill);

    const [items, setItems] = useState<ItemRow[]>(prefillItems.length ? prefillItems : [emptyItem()]);

    const { data, setData, post, processing, errors } = useForm({
        purchase_order_id: prefill?.purchase_order_id ?? '',
        supplier_id:       prefill?.supplier_id       ?? '',
        warehouse_id:      prefill?.warehouse_id      ?? '',
        received_date:     new Date().toISOString().slice(0, 10),
        notes:             '',
        items:             items,
    });

    function updateItem(index: number, field: keyof ItemRow, value: string) {
        const next = items.map((row, i) => {
            if (i !== index) return row;
            const updated = { ...row, [field]: value };
            if (field === 'ingredient_id') {
                const ing = ingredients.find((ig) => String(ig.id) === value);
                updated.unit_id = ing?.base_unit ? String(ing.base_unit.id) : '';
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

    const hasPrefill = !!prefill;
    const isPurchaseOrderReceive = !!data.purchase_order_id;
    const formErrors = errors as Record<string, string | undefined>;

    function handlePurchaseOrderChange(purchaseOrderId: string) {
        setData('purchase_order_id', purchaseOrderId);

        if (!purchaseOrderId) {
            const next = [emptyItem()];
            setItems(next);
            setData('supplier_id', '');
            setData('warehouse_id', '');
            setData('items', next);
            return;
        }

        const order = purchaseOrders.find((po) => String(po.id) === purchaseOrderId || po.purchase_order_id === purchaseOrderId) as PurchaseOrderPrefill | undefined;
        if (!order) return;

        const next = itemsFromPurchaseOrder(order);
        const receiveItems = next.length ? next : [emptyItem()];
        setItems(receiveItems);
        setData('supplier_id', order.supplier_id);
        setData('warehouse_id', order.warehouse_id);
        setData('items', receiveItems);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(receivesStore.url());
    }

    const ingredientMap = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));

    return (
        <>
            <Head title="New Purchase Receive" />
            <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Purchase Receives', href: receivesIndex.url() },
                        { label: 'New Receive' },
                    ]}
                    title="New Purchase Receive"
                    description="Record goods received from a supplier."
                />

                <form onSubmit={submit} className="space-y-8 pb-6">
                    {formErrors.receive && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300">
                            {formErrors.receive}
                        </p>
                    )}

                    <FormSection title="Receive Details" description="Select supplier and warehouse for this receipt.">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <FormField label="Purchase Order" error={errors.purchase_order_id}>
                                <SearchableSelect
                                    value={data.purchase_order_id}
                                    onChange={(e) => handlePurchaseOrderChange(e.target.value)}
                                    disabled={hasPrefill}
                                >
                                    <option value="">— Direct Receive (no PO) —</option>
                                    {purchaseOrders.map((o) => <option key={o.id} value={o.id}>{o.purchase_order_no}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Supplier" required error={errors.supplier_id}>
                                <SearchableSelect
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    disabled={isPurchaseOrderReceive}
                                >
                                    <option value="">Select supplier…</option>
                                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Warehouse" required error={errors.warehouse_id}>
                                <SearchableSelect
                                    value={data.warehouse_id}
                                    onChange={(e) => setData('warehouse_id', e.target.value)}
                                    disabled={isPurchaseOrderReceive}
                                >
                                    <option value="">Select warehouse…</option>
                                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Received Date" required error={errors.received_date}>
                                <Input type="date" value={data.received_date} onChange={(e) => setData('received_date', e.target.value)} />
                            </FormField>
                            <FormField label="Notes" error={errors.notes} className="md:col-span-2">
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Optional notes…"
                                    className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    <FormSection title="Received Items" description="Add items received with quantities and quality notes.">
                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const ing = item.ingredient_id ? ingredientMap[item.ingredient_id] : null;
                                const accepted = (parseFloat(item.received_quantity) || 0) - (parseFloat(item.rejected_quantity) || 0);
                                return (
                                    <div key={index} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
                                            <FormField label="Ingredient" error={(errors as Record<string, string>)[`items.${index}.ingredient_id`]}>
                                                {isPurchaseOrderReceive && item.purchase_order_item_id ? (
                                                    <Input value={ing?.name ?? ''} readOnly className="cursor-default bg-muted/60" />
                                                ) : (
                                                    <SearchableSelect
                                                        value={item.ingredient_id}
                                                        onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}
                                                    >
                                                        <option value="">Select ingredient…</option>
                                                        {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}{i.code ? ` (${i.code})` : ''}</option>)}
                                                    </SearchableSelect>
                                                )}
                                            </FormField>
                                            <FormField label="Ordered Qty">
                                                <Input value={item.ordered_quantity || '—'} readOnly className="cursor-default bg-muted/60 font-mono text-right" />
                                            </FormField>
                                            <FormField label="Received Qty" error={(errors as Record<string, string>)[`items.${index}.received_quantity`]}>
                                                <Input
                                                    type="number" min="0.0001" step="0.0001"
                                                    value={item.received_quantity}
                                                    onChange={(e) => updateItem(index, 'received_quantity', e.target.value)}
                                                    placeholder="0"
                                                    className="font-mono text-right"
                                                />
                                            </FormField>
                                            <FormField label="Rejected Qty" error={(errors as Record<string, string>)[`items.${index}.rejected_quantity`]}>
                                                <Input
                                                    type="number" min="0" step="0.0001"
                                                    value={item.rejected_quantity}
                                                    onChange={(e) => updateItem(index, 'rejected_quantity', e.target.value)}
                                                    placeholder="0"
                                                    className="font-mono text-right"
                                                />
                                            </FormField>
                                            <FormField label="Accepted Qty">
                                                <Input
                                                    value={accepted >= 0 ? accepted.toFixed(4) : '—'}
                                                    readOnly
                                                    className={`cursor-default font-mono text-right ${accepted < 0 ? 'text-red-600' : 'bg-muted/60'}`}
                                                />
                                            </FormField>
                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length === 1 || (isPurchaseOrderReceive && !!item.purchase_order_item_id)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                                            <FormField label="Unit Price" error={(errors as Record<string, string>)[`items.${index}.unit_price`]}>
                                                <Input
                                                    type="number" min="0" step="0.0001"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                    placeholder="0.00"
                                                    className="font-mono text-right"
                                                />
                                            </FormField>
                                            <FormField label="Batch No" error={(errors as Record<string, string>)[`items.${index}.batch_no`]}>
                                                <Input
                                                    value={item.batch_no}
                                                    onChange={(e) => updateItem(index, 'batch_no', e.target.value)}
                                                    placeholder="Optional"
                                                />
                                            </FormField>
                                            <FormField label="Mfg Date" error={(errors as Record<string, string>)[`items.${index}.manufactured_date`]}>
                                                <Input type="date" value={item.manufactured_date} onChange={(e) => updateItem(index, 'manufactured_date', e.target.value)} />
                                            </FormField>
                                            <FormField label="Expiry Date" error={(errors as Record<string, string>)[`items.${index}.expiry_date`]}>
                                                <Input type="date" value={item.expiry_date} onChange={(e) => updateItem(index, 'expiry_date', e.target.value)} />
                                            </FormField>
                                        </div>
                                        <div className="mt-3">
                                            <FormField label="Remarks" error={(errors as Record<string, string>)[`items.${index}.remarks`]}>
                                                <Input value={item.remarks} onChange={(e) => updateItem(index, 'remarks', e.target.value)} placeholder="Optional remarks…" />
                                            </FormField>
                                        </div>
                                    </div>
                                );
                            })}

                            {!isPurchaseOrderReceive && (
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                    Add Item
                                </button>
                            )}
                        </div>
                    </FormSection>

                    <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                        <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                        <Link href={receivesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Discard Draft
                        </Link>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                            {processing ? 'Saving…' : 'Create Receive'}
                        </button>
                    </div>
            </form>
        </>
    );
}
