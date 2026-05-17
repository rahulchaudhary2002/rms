import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { QuickCreateIngredientModal, QuickCreateSupplierModal, QuickCreateWarehouseModal } from '@/components/quick-create-modals';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import {
    index as ordersIndex,
    show as ordersShow,
    update as ordersUpdate,
} from '@/routes/purchase-orders';
import type { Ingredient, PurchaseOrder, Supplier, Unit, Warehouse } from '@/types';

type Props = {
    order:       PurchaseOrder;
    suppliers:   Pick<Supplier,    'id' | 'name'>[];
    warehouses:  Pick<Warehouse,   'id' | 'name'>[];
    ingredients: (Pick<Ingredient, 'id' | 'name' | 'code'> & { base_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> | null; default_purchase_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> | null })[];
    units:       Pick<Unit,        'id' | 'name' | 'short_name'>[];
};

type ItemRow = {
    ingredient_id:   string;
    unit_id:         string;
    quantity:        string;
    unit_price:      string;
    discount_amount: string;
    tax_amount:      string;
    notes:           string;
};

function emptyItem(): ItemRow {
    return { ingredient_id: '', unit_id: '', quantity: '', unit_price: '', discount_amount: '0', tax_amount: '0', notes: '' };
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

export default function PurchaseOrdersEdit({ order, suppliers, warehouses, ingredients, units }: Props) {
    const { can } = useCan();
    const [modal, setModal] = useState<'supplier' | 'warehouse' | 'ingredient' | null>(null);
    const initialItems: ItemRow[] = (order.items ?? []).map((it) => ({
        ingredient_id:   String(it.ingredient_id),
        unit_id:         String(it.unit_id),
        quantity:        String(it.quantity),
        unit_price:      String(it.unit_price),
        discount_amount: String(it.discount_amount),
        tax_amount:      String(it.tax_amount),
        notes:           it.notes ?? '',
    }));

    const [items, setItems] = useState<ItemRow[]>(initialItems.length ? initialItems : [emptyItem()]);

    const { data, setData, put, processing, errors } = useForm({
        supplier_id:            String(order.supplier_id),
        warehouse_id:           String(order.warehouse_id),
        order_date:             order.order_date,
        expected_delivery_date: order.expected_delivery_date ?? '',
        discount_amount:        String(order.discount_amount),
        tax_amount:             String(order.tax_amount),
        shipping_amount:        String(order.shipping_amount),
        notes:                  order.notes ?? '',
        items:                  items,
    });

    function updateItem(index: number, field: keyof ItemRow, value: string) {
        const next = items.map((row, i) => {
            if (i !== index) return row;
            const updated = { ...row, [field]: value };
            if (field === 'ingredient_id') {
                const ing = ingredients.find((ig) => String(ig.id) === value);
                updated.unit_id = ing?.default_purchase_unit
                    ? String(ing.default_purchase_unit.id)
                    : ing?.base_unit ? String(ing.base_unit.id) : '';
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
    const discount   = parseFloat(data.discount_amount)  || 0;
    const tax        = parseFloat(data.tax_amount)        || 0;
    const shipping   = parseFloat(data.shipping_amount)   || 0;
    const grandTotal = subtotal - discount + tax + shipping;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(ordersUpdate.url(order), { preserveScroll: true });
    }

    const ingredientMap = Object.fromEntries(ingredients.map((i) => [String(i.id), i]));

    return (
        <>
            <Head title={`Edit ${order.purchase_order_no}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Dashboard', href: dashboard.url() },
                    { label: 'Purchase Orders', href: ordersIndex.url() },
                    { label: order.purchase_order_no, href: ordersShow.url(order) },
                    { label: 'Edit' },
                ]}
                title={`Edit ${order.purchase_order_no}`}
                description="Update supplier, schedule, line items, and order-level totals."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                    <FormSection title="Order Details" description="Adjust supplier, warehouse, dates, and order notes.">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <FormField label="Warehouse" required error={errors.warehouse_id}>
                                <SearchableSelect
                                    value={data.warehouse_id}
                                    onChange={(e) => setData('warehouse_id', e.target.value)}
                                    onAddNew={can('warehouses-create') ? () => setModal('warehouse') : undefined}
                                    addNewLabel="Add Warehouse"
                                >
                                    <option value="">Select warehouse…</option>
                                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Order Date" required error={errors.order_date}>
                                <Input type="date" value={data.order_date} onChange={(e) => setData('order_date', e.target.value)} />
                            </FormField>
                            <FormField label="Expected Delivery Date" error={errors.expected_delivery_date}>
                                <Input type="date" value={data.expected_delivery_date} onChange={(e) => setData('expected_delivery_date', e.target.value)} />
                            </FormField>
                            <FormField label="Notes" error={errors.notes} className="sm:col-span-2">
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

                    <FormSection title="Order Items" description="Modify ingredients, quantities, pricing, and totals.">
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
                                                    {ing?.default_purchase_unit && ing.default_purchase_unit.id !== ing.base_unit?.id && (
                                                        <option value={ing.default_purchase_unit.id}>{ing.default_purchase_unit.name}</option>
                                                    )}
                                                    {!ing && units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
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
                                                <Input
                                                    value={fmt(total)}
                                                    readOnly
                                                    className="cursor-default bg-muted/60 font-mono text-right"
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
                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                                            <FormField label="Notes" error={(errors as Record<string, string>)[`items.${index}.notes`]}>
                                                <Input
                                                    value={item.notes}
                                                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                    placeholder="Optional…"
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
                                    <span className="text-muted-foreground">Order Discount</span>
                                    <Input
                                        type="number" min="0" step="0.01"
                                        value={data.discount_amount}
                                        onChange={(e) => setData('discount_amount', e.target.value)}
                                        className="w-28 font-mono text-right"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">Order Tax</span>
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
                        <Link href={ordersShow.url(order)} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Cancel
                        </Link>
                        <button type="submit" disabled={processing} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
            </form>
            <QuickCreateSupplierModal open={modal === 'supplier'} onClose={() => setModal(null)} />
            <QuickCreateWarehouseModal open={modal === 'warehouse'} onClose={() => setModal(null)} />
            <QuickCreateIngredientModal open={modal === 'ingredient'} onClose={() => setModal(null)} units={units} />
        </>
    );
}
