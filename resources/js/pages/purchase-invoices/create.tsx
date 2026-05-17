import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { QuickCreateIngredientModal, QuickCreateSupplierModal } from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import {
    index as invoicesIndex,
    store as invoicesStore,
} from '@/routes/purchase-invoices';
import type { Ingredient, PurchaseOrder, PurchaseReceive, Supplier, Unit } from '@/types';

type Props = {
    suppliers:       Pick<Supplier,       'id' | 'name'>[];
    purchaseOrders:  Pick<PurchaseOrder,  'id' | 'purchase_order_no'>[];
    purchaseReceives: Pick<PurchaseReceive, 'id' | 'receive_no'>[];
    ingredients:     (Pick<Ingredient,    'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> | null })[];
    units:           Pick<Unit,           'id' | 'name' | 'short_name'>[];
};

type ItemRow = {
    ingredient_id:   string;
    unit_id:         string;
    quantity:        string;
    unit_price:      string;
    discount_amount: string;
    tax_amount:      string;
};

function emptyItem(): ItemRow {
    return { ingredient_id: '', unit_id: '', quantity: '', unit_price: '', discount_amount: '0', tax_amount: '0' };
}

function lineTotal(item: ItemRow): number {
    const qty      = parseFloat(item.quantity)        || 0;
    const price    = parseFloat(item.unit_price)      || 0;
    const discount = parseFloat(item.discount_amount) || 0;
    const tax      = parseFloat(item.tax_amount)      || 0;
    return qty * price - discount + tax;
}

function fmt(n: number): string {
    return n.toFixed(2);
}

export default function PurchaseInvoicesCreate({ suppliers, purchaseOrders, purchaseReceives, ingredients, units }: Props) {
    const { can } = useCan();
    const [modal, setModal] = useState<'supplier' | 'ingredient' | null>(null);
    const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

    const { data, setData, post, processing, errors } = useForm({
        supplier_id:          '',
        purchase_order_id:    '',
        purchase_receive_id:  '',
        invoice_date:         new Date().toISOString().slice(0, 10),
        due_date:             '',
        supplier_invoice_no:  '',
        discount_amount:      '0',
        tax_amount:           '0',
        shipping_amount:      '0',
        notes:                '',
        items:                items,
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

    const subtotal   = items.reduce((sum, item) => sum + lineTotal(item), 0);
    const discount   = parseFloat(data.discount_amount) || 0;
    const tax        = parseFloat(data.tax_amount)       || 0;
    const shipping   = parseFloat(data.shipping_amount)  || 0;
    const grandTotal = subtotal - discount + tax + shipping;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(invoicesStore.url());
    }

    const ingredientMap = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));

    return (
        <>
            <Head title="New Purchase Invoice" />
            <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Purchase Invoices', href: invoicesIndex.url() },
                        { label: 'New Invoice' },
                    ]}
                    title="New Purchase Invoice"
                    description="Record a supplier invoice for purchase orders."
                />

                <form onSubmit={submit} className="space-y-8 pb-6">
                    <FormSection title="Invoice Details" description="Enter supplier invoice details and dates.">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <FormField label="Supplier" required error={errors.supplier_id}>
                                <SearchableSelect
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    onAddNew={can('suppliers-create') ? () => setModal('supplier') : undefined}
                                    addNewLabel="Add Supplier"
                                >
                                    <option value="">Select supplier…</option>
                                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Supplier Invoice No" error={errors.supplier_invoice_no}>
                                <Input value={data.supplier_invoice_no} onChange={(e) => setData('supplier_invoice_no', e.target.value)} placeholder="Supplier's invoice reference" />
                            </FormField>
                            <FormField label="Invoice Date" required error={errors.invoice_date}>
                                <Input type="date" value={data.invoice_date} onChange={(e) => setData('invoice_date', e.target.value)} />
                            </FormField>
                            <FormField label="Due Date" error={errors.due_date}>
                                <Input type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                            </FormField>
                            <FormField label="Purchase Order (optional)" error={errors.purchase_order_id}>
                                <SearchableSelect
                                    value={data.purchase_order_id}
                                    onChange={(e) => setData('purchase_order_id', e.target.value)}
                                >
                                    <option value="">None</option>
                                    {purchaseOrders.map((o) => <option key={o.id} value={o.id}>{o.purchase_order_no}</option>)}
                                </SearchableSelect>
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

                    <FormSection title="Invoice Items" description="Add invoiced items with quantities and amounts.">
                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const ing   = item.ingredient_id ? ingredientMap[item.ingredient_id] : null;
                                const total = lineTotal(item);
                                return (
                                    <div key={index} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
                                            <FormField label="Ingredient" error={(errors as Record<string, string>)[`items.${index}.ingredient_id`]}>
                                                <SearchableSelect
                                                    value={item.ingredient_id}
                                                    onChange={(e) => updateItem(index, 'ingredient_id', e.target.value)}
                                                    onAddNew={can('ingredients-create') ? () => setModal('ingredient') : undefined}
                                                    addNewLabel="Add Ingredient"
                                                >
                                                    <option value="">Select ingredient…</option>
                                                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}{i.code ? ` (${i.code})` : ''}</option>)}
                                                </SearchableSelect>
                                            </FormField>
                                            <FormField label="Unit" error={(errors as Record<string, string>)[`items.${index}.unit_id`]}>
                                                <SearchableSelect
                                                    value={item.unit_id}
                                                    onChange={(e) => updateItem(index, 'unit_id', e.target.value)}
                                                >
                                                    <option value="">Unit…</option>
                                                    {ing?.base_unit && <option value={ing.base_unit.id}>{ing.base_unit.name}</option>}
                                                </SearchableSelect>
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
                                            <FormField label="Line Total">
                                                <Input value={fmt(total)} readOnly className="cursor-default bg-muted/60 font-mono text-right" />
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
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <FormField label="Discount" error={(errors as Record<string, string>)[`items.${index}.discount_amount`]}>
                                                <Input
                                                    type="number" min="0" step="0.01"
                                                    value={item.discount_amount}
                                                    onChange={(e) => updateItem(index, 'discount_amount', e.target.value)}
                                                    placeholder="0.00"
                                                    className="font-mono text-right"
                                                />
                                            </FormField>
                                            <FormField label="Tax" error={(errors as Record<string, string>)[`items.${index}.tax_amount`]}>
                                                <Input
                                                    type="number" min="0" step="0.01"
                                                    value={item.tax_amount}
                                                    onChange={(e) => updateItem(index, 'tax_amount', e.target.value)}
                                                    placeholder="0.00"
                                                    className="font-mono text-right"
                                                />
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
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div className="w-full max-w-xs space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono font-medium">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">Discount</span>
                                    <Input
                                        type="number" min="0" step="0.01"
                                        value={data.discount_amount}
                                        onChange={(e) => setData('discount_amount', e.target.value)}
                                        className="w-28 font-mono text-right"
                                    />
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
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <Input
                                        type="number" min="0" step="0.01"
                                        value={data.shipping_amount}
                                        onChange={(e) => setData('shipping_amount', e.target.value)}
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
                        <Link href={invoicesIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Discard Draft
                        </Link>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                            {processing ? 'Saving…' : 'Create Invoice'}
                        </button>
                    </div>
            </form>
            <QuickCreateSupplierModal open={modal === 'supplier'} onClose={() => setModal(null)} />
            <QuickCreateIngredientModal open={modal === 'ingredient'} onClose={() => setModal(null)} units={units} />
        </>
    );
}
