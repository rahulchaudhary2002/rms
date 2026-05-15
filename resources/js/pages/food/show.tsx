import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DropzoneUploader } from '@/components/ui/dropzone-uploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { sync as addonGroupsSync } from '@/routes/food-addon-groups';
import { store as comboItemsStore, destroy as comboItemsDestroy } from '@/routes/food-combo-items';
import { store as imagesStore, setPrimary as imagesSetPrimary, destroy as imagesDestroy } from '@/routes/food-images';
import { upsert as outletPricesUpsert } from '@/routes/food-outlets';
import { upsert as recipesUpsert, destroy as recipesDestroy } from '@/routes/food-recipes';
import { upsert as schedulesUpsert, destroy as schedulesDestroy } from '@/routes/food-schedules';
import { upsert as variantOutletPricesUpsert } from '@/routes/food-variant-outlets';
import { store as variantsStore, update as variantsUpdate, destroy as variantsDestroy, toggleStatus as variantsToggleStatus } from '@/routes/food-variants';
import {
    index as foodsIndex,
    edit as foodsEdit,
} from '@/routes/foods';
import type { Food, FoodCategory, FoodVariant, FoodOutlet, AddonGroup, Ingredient, Outlet } from '@/types';

type Unit = { id: number; name: string; short_name: string };

type Props = {
    food: Food;
    categories: Pick<FoodCategory, 'id' | 'name'>[];
    scopeOutlets: Outlet[];
    ingredients: Pick<Ingredient, 'id' | 'name'>[];
    units: Unit[];
    allFoods: Pick<Food, 'id' | 'name' | 'item_type'>[];
    addonGroups: Pick<AddonGroup, 'id' | 'name'>[];
};

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

type Tab = 'overview' | 'outlets' | 'variants' | 'addons' | 'recipes' | 'schedule' | 'images' | 'combo';

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
            active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
        )}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function FoodTypeBadge({ type }: { type: string | null }) {
    if (!type) return <span className="text-sm text-muted-foreground">-</span>;
    const map: Record<string, { label: string; cls: string }> = {
        veg:     { label: 'Veg',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
        non_veg: { label: 'Non-Veg', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        egg:     { label: 'Egg',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        vegan:   { label: 'Vegan',   cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    };
    const m = map[type] ?? { label: type, cls: 'bg-muted text-muted-foreground' };
    return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase', m.cls)}>{m.label}</span>;
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
    return (
        <tr>
            <td colSpan={cols} className="px-6 py-10 text-center text-sm text-muted-foreground dark:text-stone-400">
                {label}
            </td>
        </tr>
    );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-bold text-foreground">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
            <span className="material-symbols-outlined text-[16px]">add</span>
            {label}
        </button>
    );
}

function PageTable({ minWidth, head, children }: { minWidth?: string; head: string[]; children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto">
            <table className={cn('w-full text-left', minWidth ?? 'min-w-[540px]')}>
                <thead>
                    <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                        {head.map((h, i) => <th key={i} className="border-b border-border/10 px-6 py-3">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-muted dark:divide-stone-800">{children}</tbody>
            </table>
        </div>
    );
}

// ── Overview tab ───────────────────────────────────────────────────────────────

function OverviewTab({ food }: { food: Food }) {
    const itemTypeIcon: Record<string, string> = { food: 'restaurant', beverage: 'local_cafe', combo: 'fastfood' };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[32px]">{itemTypeIcon[food.item_type] ?? 'restaurant'}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{food.name}</h2>
                {food.sku && <p className="mt-0.5 font-mono text-xs text-muted-foreground">SKU: {food.sku}</p>}
                <p className="mt-1 text-sm text-muted-foreground">{food.category?.name ?? 'Uncategorised'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge active={food.is_active} />
                    <FoodTypeBadge type={food.food_type} />
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {food.item_type}
                    </span>
                    {food.is_featured && (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Featured
                        </span>
                    )}
                </div>
                <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Base Price</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">Rs. {food.base_price}</p>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Item Details</h3>
                <dl className="space-y-3.5">
                    {[
                        { label: 'Category',        value: food.category?.name ?? '-' },
                        { label: 'Preparation Time', value: food.preparation_time ? `${food.preparation_time} min` : '-' },
                        { label: 'Sort Order',       value: food.sort_order },
                        { label: 'Variants',         value: food.variants_count ?? (food.variants?.length ?? 0) },
                        { label: 'Images',           value: food.images_count ?? (food.images?.length ?? 0) },
                        { label: 'Taxable',          value: food.is_taxable ? 'Yes' : 'No' },
                        { label: 'Discountable',     value: food.is_discountable ? 'Yes' : 'No' },
                        { label: 'Has Variants',     value: food.has_variants ? 'Yes' : 'No' },
                        { label: 'Has Add-ons',      value: food.has_addons ? 'Yes' : 'No' },
                        { label: 'Recipe Enabled',   value: food.is_recipe_enabled ? 'Yes' : 'No' },
                    ].map((item, i, arr) => (
                        <div key={item.label} className={cn('flex justify-between py-1', i < arr.length - 1 && 'border-b border-border/50')}>
                            <dt className="text-sm text-muted-foreground">{item.label}</dt>
                            <dd className="text-sm font-semibold">{String(item.value)}</dd>
                        </div>
                    ))}
                </dl>
                {food.short_description && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        {food.short_description}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Outlet Prices tab ──────────────────────────────────────────────────────────

function OutletPricesTab({ food, scopeOutlets }: { food: Food; scopeOutlets: Outlet[] }) {
    const [editTarget, setEditTarget] = useState<FoodOutlet | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    const form = useForm({ outlet_id: '', price: '', is_available: true, is_active: true });

    const configuredPrices = food.outlets ?? [];
    const outletMap = Object.fromEntries(scopeOutlets.map((o) => [o.id, o]));
    const configuredByOutlet = new Map(configuredPrices.map((price) => [price.outlet_id, price]));

    function openAdd(outletId = '') {
        form.setData({ outlet_id: outletId, price: '', is_available: true, is_active: true });
        setAddOpen(true);
    }

    function openEdit(op: FoodOutlet) {
        form.setData({
            outlet_id: String(op.outlet_id),
            price: op.price ?? '',
            is_available: op.is_available,
            is_active: op.is_active,
        });
        setEditTarget(op);
    }

    function closeModal() {
        setAddOpen(false);
        setEditTarget(null);
        form.reset();
    }

    function save(e: React.FormEvent) {
        e.preventDefault();
        form.post(outletPricesUpsert.url(food.id), {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    }

    const isModalOpen = addOpen || editTarget !== null;
    const isEditing = editTarget !== null;

    return (
        <>
            <SectionCard
                title={`Outlet Prices - base Rs. ${food.base_price}`}
                action={
                    scopeOutlets.some((outlet) => !configuredByOutlet.has(outlet.id))
                        ? <AddBtn label="Add Outlet Price" onClick={() => openAdd()} />
                        : undefined
                }
            >
                <PageTable head={['Outlet', 'Override Price', 'Available', 'Active', '']}>
                    {scopeOutlets.length === 0 ? (
                        <EmptyRow
                            cols={5}
                            label="No outlets configured for your scope."
                        />
                    ) : scopeOutlets.map((outlet) => {
                        const op = configuredByOutlet.get(outlet.id);

                        return (
                            <tr key={outlet.id} className="hover:bg-muted/50">
                                <td className="px-6 py-3 font-semibold text-foreground">
                                    {outlet.name}
                                </td>
                                <td className="px-6 py-3 font-mono text-sm">
                                    {op?.price
                                        ? `Rs. ${op.price}`
                                        : <span className="italic text-muted-foreground">Base (Rs. {food.base_price})</span>}
                                </td>
                                <td className="px-6 py-3">
                                    {op ? (
                                        <span className={cn(
                                            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                            op.is_available
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                        )}>
                                            {op.is_available ? 'Yes' : 'No'}
                                        </span>
                                    ) : (
                                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
                                            Not configured
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-3">
                                    {op ? <StatusBadge active={op.is_active} /> : <span className="text-sm text-muted-foreground">-</span>}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button
                                        type="button"
                                        title={op ? 'Edit' : 'Configure'}
                                        onClick={() => op ? openEdit(op) : openAdd(String(outlet.id))}
                                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{op ? 'edit' : 'add'}</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </PageTable>
            </SectionCard>

            <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Outlet Price' : 'Add Outlet Price'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={save} className="space-y-4">
                        {isEditing ? (
                            <div>
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Outlet</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {editTarget?.outlet?.name ?? outletMap[editTarget?.outlet_id ?? 0]?.name ?? `Outlet #${editTarget?.outlet_id}`}
                                </p>
                                <input type="hidden" value={form.data.outlet_id} />
                            </div>
                        ) : (
                            <FormField label="Outlet" error={form.errors.outlet_id}>
                                <SearchableSelect
                                    value={form.data.outlet_id}
                                    onChange={(e) => form.setData('outlet_id', e.target.value)}
                                >
                                    <option value="">Select outlet…</option>
                                    {scopeOutlets.filter((outlet) => !configuredByOutlet.has(outlet.id)).map((o) => (
                                        <option key={o.id} value={String(o.id)}>{o.name}</option>
                                    ))}
                                </SearchableSelect>
                            </FormField>
                        )}

                        <FormField label="Override Price (Rs.) - leave blank to use base price" error={form.errors.price}>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.data.price}
                                onChange={(e) => form.setData('price', e.target.value)}
                                placeholder={`Base: Rs. ${food.base_price}`}
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Available at Outlet" error={form.errors.is_available}>
                                <SearchableSelect
                                    value={form.data.is_available ? 'true' : 'false'}
                                    onChange={(e) => form.setData('is_available', e.target.value === 'true')}
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </SearchableSelect>
                            </FormField>

                            <FormField label="Active" error={form.errors.is_active}>
                                <SearchableSelect
                                    value={form.data.is_active ? 'true' : 'false'}
                                    onChange={(e) => form.setData('is_active', e.target.value === 'true')}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </SearchableSelect>
                            </FormField>
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                            >
                                {isEditing ? 'Save Changes' : 'Add Price'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Variants tab ───────────────────────────────────────────────────────────────

function VariantsTab({ food, scopeOutlets }: { food: Food; scopeOutlets: Outlet[] }) {
    const [modal, setModal] = useState<'add' | { type: 'edit'; variant: FoodVariant } | null>(null);
    const [expandedOutletId, setExpandedOutletId] = useState<number | null>(null);
    const [savingVarOutlet, setSavingVarOutlet] = useState<string | null>(null);
    const addForm = useForm({ name: '', sku: '', price: '0.00', is_default: false, is_active: true, sort_order: '0' });
    const editForm = useForm({ name: '', sku: '', price: '0.00', is_default: false, is_active: true, sort_order: '0' });
    const [variantOutletPrices, setVariantOutletPrices] = useState<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        (food.variants ?? []).forEach((v) => {
            (v.outlet_settings ?? []).forEach((os) => { map[`${v.id}-${os.outlet_id}`] = os.price ?? ''; });
        });
        return map;
    });

    function openEdit(v: FoodVariant) {
        editForm.setData({ name: v.name, sku: v.sku ?? '', price: v.price, is_default: v.is_default, is_active: v.is_active, sort_order: String(v.sort_order) });
        setModal({ type: 'edit', variant: v });
    }

    function saveVariantOutletPrice(variantId: number, outletId: number) {
        const key = `${variantId}-${outletId}`;
        setSavingVarOutlet(key);
        router.post(variantOutletPricesUpsert.url({ food: food.id, food_variant: variantId }), {
            outlet_id: outletId, price: variantOutletPrices[key] || null, is_available: true, is_active: true,
        }, { preserveState: true, preserveScroll: true, onFinish: () => setSavingVarOutlet(null) });
    }

    const variants = food.variants ?? [];

    return (
        <>
            <SectionCard title="Variants" action={<AddBtn label="Add Variant" onClick={() => { addForm.reset(); setModal('add'); }} />}>
                <PageTable head={['Name', 'SKU', 'Price (Rs.)', 'Sort', 'Default', 'Status', '']}>
                    {variants.length === 0
                        ? <EmptyRow cols={7} label="No variants yet. Add one to get started." />
                        : variants.map((v) => (
                            <tr key={v.id} className="hover:bg-muted/50">
                                <td className="px-6 py-3 font-semibold text-foreground">{v.name}</td>
                                <td className="px-6 py-3 font-mono text-sm text-muted-foreground">{v.sku ?? '-'}</td>
                                <td className="px-6 py-3 font-mono text-sm">Rs. {v.price}</td>
                                <td className="px-6 py-3 text-sm text-muted-foreground">{v.sort_order}</td>
                                <td className="px-6 py-3">
                                    {v.is_default
                                        ? <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Default</span>
                                        : <span className="text-sm text-muted-foreground">-</span>}
                                </td>
                                <td className="px-6 py-3"><StatusBadge active={v.is_active} /></td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button type="button" onClick={() => openEdit(v)} title="Edit"
                                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button type="button" onClick={() => router.patch(variantsToggleStatus.url({ food: food.id, food_variant: v.id }), {}, { preserveScroll: true })}
                                            title={v.is_active ? 'Deactivate' : 'Activate'}
                                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                            <span className="material-symbols-outlined text-[18px]">{v.is_active ? 'toggle_off' : 'toggle_on'}</span>
                                        </button>
                                        <button type="button" onClick={() => { if (confirm('Delete this variant?')) router.delete(variantsDestroy.url({ food: food.id, food_variant: v.id })); }}
                                            title="Delete" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                </PageTable>
            </SectionCard>

            {scopeOutlets.length > 0 && variants.length > 0 && (
                <div className="mt-6 rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-6 py-4">
                        <h3 className="font-bold text-foreground">Variant Outlet Prices</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Override prices per outlet for each variant.</p>
                    </div>
                    <div className="divide-y divide-border">
                        {scopeOutlets.map((outlet) => (
                            <div key={outlet.id}>
                                <button type="button"
                                    className="flex w-full items-center justify-between px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-muted/50"
                                    onClick={() => setExpandedOutletId(expandedOutletId === outlet.id ? null : outlet.id)}>
                                    <span>{outlet.name}</span>
                                    <span className="material-symbols-outlined text-[18px] text-muted-foreground">
                                        {expandedOutletId === outlet.id ? 'expand_less' : 'expand_more'}
                                    </span>
                                </button>
                                {expandedOutletId === outlet.id && (
                                    <div className="overflow-visible border-t border-border/50 bg-muted/20">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-muted/40 text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                                                    <th className="border-b border-border/10 px-6 py-2.5">Variant</th>
                                                    <th className="border-b border-border/10 px-6 py-2.5">Base Price</th>
                                                    <th className="border-b border-border/10 px-6 py-2.5">Outlet Override (Rs.)</th>
                                                    <th className="border-b border-border/10 px-6 py-2.5" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {variants.map((v) => {
                                                    const key = `${v.id}-${outlet.id}`;
                                                    return (
                                                        <tr key={v.id} className="hover:bg-muted/30">
                                                            <td className="px-6 py-2.5 font-medium">{v.name}</td>
                                                            <td className="px-6 py-2.5 font-mono text-muted-foreground">Rs. {v.price}</td>
                                                            <td className="w-52 px-6 py-2.5">
                                                                <Input type="number" min="0" step="0.01" value={variantOutletPrices[key] ?? ''}
                                                                    placeholder="Leave blank for base price"
                                                                    onChange={(e) => setVariantOutletPrices((prev) => ({ ...prev, [key]: e.target.value }))} />
                                                            </td>
                                                            <td className="px-6 py-2.5 text-right">
                                                                <button type="button" disabled={savingVarOutlet === key}
                                                                    onClick={() => saveVariantOutletPrice(v.id, outlet.id)}
                                                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
                                                                    {savingVarOutlet === key ? 'Saving…' : 'Save'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={modal === 'add'} onOpenChange={(o) => { if (!o) setModal(null); }}>
                <DialogContent className="max-w-lg bg-card">
                    <DialogHeader><DialogTitle>Add Variant</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); addForm.post(variantsStore.url(food.id), { onSuccess: () => { addForm.reset(); setModal(null); } }); }} className="space-y-4">
                        <FormField label="Name" error={addForm.errors.name}>
                            <Input value={addForm.data.name} onChange={(e) => addForm.setData('name', e.target.value)} placeholder="e.g. Large" autoFocus />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="SKU (optional)" error={addForm.errors.sku}>
                                <Input value={addForm.data.sku} onChange={(e) => addForm.setData('sku', e.target.value)} placeholder="Optional" />
                            </FormField>
                            <FormField label="Price (Rs.)" error={addForm.errors.price}>
                                <Input type="number" min="0" step="0.01" value={addForm.data.price} onChange={(e) => addForm.setData('price', e.target.value)} />
                            </FormField>
                            <FormField label="Sort Order" error={addForm.errors.sort_order}>
                                <Input type="number" min="0" value={addForm.data.sort_order} onChange={(e) => addForm.setData('sort_order', e.target.value)} />
                            </FormField>
                            <FormField label="Default Variant" error={addForm.errors.is_default}>
                                <SearchableSelect value={addForm.data.is_default ? 'true' : 'false'} onChange={(e) => addForm.setData('is_default', e.target.value === 'true')}>
                                    <option value="false">No</option><option value="true">Yes</option>
                                </SearchableSelect>
                            </FormField>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Cancel</button>
                            <button type="submit" disabled={addForm.processing} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">Add Variant</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modal !== null && modal !== 'add'} onOpenChange={(o) => { if (!o) setModal(null); }}>
                <DialogContent className="max-w-lg bg-card">
                    <DialogHeader><DialogTitle>Edit Variant</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!modal || modal === 'add') return;
                        editForm.put(variantsUpdate.url({ food: food.id, food_variant: modal.variant.id }), { onSuccess: () => setModal(null) });
                    }} className="space-y-4">
                        <FormField label="Name" error={editForm.errors.name}>
                            <Input value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} autoFocus />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="SKU (optional)" error={editForm.errors.sku}>
                                <Input value={editForm.data.sku} onChange={(e) => editForm.setData('sku', e.target.value)} placeholder="Optional" />
                            </FormField>
                            <FormField label="Price (Rs.)" error={editForm.errors.price}>
                                <Input type="number" min="0" step="0.01" value={editForm.data.price} onChange={(e) => editForm.setData('price', e.target.value)} />
                            </FormField>
                            <FormField label="Sort Order" error={editForm.errors.sort_order}>
                                <Input type="number" min="0" value={editForm.data.sort_order} onChange={(e) => editForm.setData('sort_order', e.target.value)} />
                            </FormField>
                            <FormField label="Default Variant" error={editForm.errors.is_default}>
                                <SearchableSelect value={editForm.data.is_default ? 'true' : 'false'} onChange={(e) => editForm.setData('is_default', e.target.value === 'true')}>
                                    <option value="false">No</option><option value="true">Yes</option>
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Status" error={editForm.errors.is_active}>
                                <SearchableSelect value={editForm.data.is_active ? 'true' : 'false'} onChange={(e) => editForm.setData('is_active', e.target.value === 'true')}>
                                    <option value="true">Active</option><option value="false">Inactive</option>
                                </SearchableSelect>
                            </FormField>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Cancel</button>
                            <button type="submit" disabled={editForm.processing} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">Save Changes</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Add-on Groups tab ──────────────────────────────────────────────────────────

function AddonGroupsTab({ food, addonGroups }: { food: Food; addonGroups: Pick<AddonGroup, 'id' | 'name'>[] }) {
    const attachedIds = new Set((food.addon_groups ?? []).map((g) => g.id));
    const [selected, setSelected] = useState<Set<number>>(new Set(attachedIds));
    const [processing, setProcessing] = useState<number | null>(null);
    const attachedMap = new Map((food.addon_groups ?? []).map((g) => [g.id, g]));

    function toggleGroup(groupId: number) {
        const previous = new Set(selected);
        const next = new Set(selected);

        if (next.has(groupId)) {
            next.delete(groupId);
        } else {
            next.add(groupId);
        }

        setSelected(next);
        setProcessing(groupId);

        router.post(addonGroupsSync.url(food.id), { addon_group_ids: Array.from(next) }, {
            preserveState: true,
            preserveScroll: true,
            onError: () => setSelected(previous),
            onFinish: () => setProcessing(null),
        });
    }

    return (
        <div className="space-y-6">
            <SectionCard title="Assign Add-on Groups">
                <div>
                    {addonGroups.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No add-on groups found. Create some first.</p>
                    ) : (
                        <>
                            <div className="border-b border-border/50 px-6 py-4 text-sm text-muted-foreground">
                                {selected.size} of {addonGroups.length} group{addonGroups.length !== 1 ? 's' : ''} selected
                            </div>
                            <div className="divide-y divide-border/10 dark:divide-border">
                                {addonGroups.map((group) => (
                                    <label
                                        key={group.id}
                                        className={cn(
                                            'flex cursor-pointer items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50 dark:hover:bg-accent',
                                            processing === group.id && 'pointer-events-none opacity-60',
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground">{group.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {selected.has(group.id) ? 'Assigned to this food' : 'Not assigned'}
                                                {attachedMap.get(group.id)?.addons?.length != null && ` · ${attachedMap.get(group.id)?.addons?.length ?? 0} add-ons`}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={processing === group.id}
                                            onClick={() => toggleGroup(group.id)}
                                            className={cn(
                                                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50',
                                                selected.has(group.id) ? 'bg-primary' : 'bg-muted-foreground/30',
                                            )}
                                            role="switch"
                                            aria-checked={selected.has(group.id)}
                                        >
                                            <span
                                                className={cn(
                                                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                                                    selected.has(group.id) ? 'translate-x-5' : 'translate-x-0.5',
                                                )}
                                            />
                                        </button>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </SectionCard>

            {(food.addon_groups ?? []).length > 0 && (
                <SectionCard title="Attached Groups">
                    <PageTable head={['Name', 'Required', 'Min / Max', 'Add-ons']}>
                        {(food.addon_groups ?? []).map((g) => (
                            <tr key={g.id} className="hover:bg-muted/50">
                                <td className="px-6 py-3 font-semibold text-foreground">{g.name}</td>
                                <td className="px-6 py-3">
                                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                        g.is_required ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400')}>
                                        {g.is_required ? 'Required' : 'Optional'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-muted-foreground">{g.min_select} / {g.max_select ?? '∞'}</td>
                                <td className="px-6 py-3 text-sm text-muted-foreground">{(g.addons ?? []).length}</td>
                            </tr>
                        ))}
                    </PageTable>
                </SectionCard>
            )}
        </div>
    );
}

// ── Recipes tab ────────────────────────────────────────────────────────────────

function RecipesTab({ food, ingredients, units }: { food: Food; ingredients: Pick<Ingredient, 'id' | 'name'>[]; units: Unit[] }) {
    const [modal, setModal] = useState(false);
    const form = useForm({ ingredient_id: '', unit_id: '', quantity: '', wastage_quantity: '0', food_variant_id: '' });
    const recipes = food.all_recipes ?? [];

    return (
        <>
            <SectionCard title="Recipe Lines" action={<AddBtn label="Add Line" onClick={() => { form.reset(); setModal(true); }} />}>
                <PageTable head={['Variant', 'Ingredient', 'Quantity', 'Wastage', 'Unit', '']}>
                    {recipes.length === 0
                        ? <EmptyRow cols={6} label="No recipe lines yet. Add ingredients to define this item's recipe." />
                        : recipes.map((r) => (
                            <tr key={r.id} className="hover:bg-muted/50">
                                <td className="px-6 py-3 text-sm text-muted-foreground">{r.variant?.name ?? <span className="italic">Base</span>}</td>
                                <td className="px-6 py-3 font-semibold text-foreground">{r.ingredient?.name ?? '-'}</td>
                                <td className="px-6 py-3 font-mono text-sm">{r.quantity}</td>
                                <td className="px-6 py-3 font-mono text-sm text-muted-foreground">{r.wastage_quantity}</td>
                                <td className="px-6 py-3 text-sm text-muted-foreground">{r.unit?.short_name ?? '-'}</td>
                                <td className="px-6 py-3 text-right">
                                    <button type="button" onClick={() => { if (confirm('Remove this recipe line?')) router.delete(recipesDestroy.url({ food: food.id, food_recipe: r.id }), { preserveScroll: true }); }}
                                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                </PageTable>
            </SectionCard>

            <Dialog open={modal} onOpenChange={(o) => { if (!o) setModal(false); }}>
                <DialogContent className="max-w-lg bg-card">
                    <DialogHeader><DialogTitle>Add Recipe Line</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); form.post(recipesUpsert.url(food.id), { onSuccess: () => { form.reset(); setModal(false); } }); }} className="space-y-4">
                        <FormField label="Variant (optional)" error={form.errors.food_variant_id}>
                            <SearchableSelect value={form.data.food_variant_id} onChange={(e) => form.setData('food_variant_id', e.target.value)}>
                                <option value="">Base recipe (all variants)</option>
                                {(food.variants ?? []).map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                            </SearchableSelect>
                        </FormField>
                        <FormField label="Ingredient" error={form.errors.ingredient_id}>
                            <SearchableSelect value={form.data.ingredient_id} onChange={(e) => form.setData('ingredient_id', e.target.value)}>
                                <option value="">Select ingredient…</option>
                                {ingredients.map((i) => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
                            </SearchableSelect>
                        </FormField>
                        <FormField label="Unit" error={form.errors.unit_id}>
                            <SearchableSelect value={form.data.unit_id} onChange={(e) => form.setData('unit_id', e.target.value)}>
                                <option value="">Select unit…</option>
                                {units.map((u) => <option key={u.id} value={String(u.id)}>{u.name} ({u.short_name})</option>)}
                            </SearchableSelect>
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Quantity" error={form.errors.quantity}>
                                <Input type="number" min="0" step="0.001" value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} placeholder="0.000" />
                            </FormField>
                            <FormField label="Wastage Quantity" error={form.errors.wastage_quantity}>
                                <Input type="number" min="0" step="0.001" value={form.data.wastage_quantity} onChange={(e) => form.setData('wastage_quantity', e.target.value)} placeholder="0.000" />
                            </FormField>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setModal(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Cancel</button>
                            <button type="submit" disabled={form.processing} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">Add Line</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Schedule tab ───────────────────────────────────────────────────────────────

function ScheduleTab({ food, scopeOutlets }: { food: Food; scopeOutlets: Outlet[] }) {
    const [modal, setModal] = useState(false);
    const schedules = food.availability_schedules ?? [];
    const form = useForm({ outlet_id: '', day_of_week: 'monday' as typeof DAYS[number], start_time: '', end_time: '', is_available: true });

    return (
        <>
            <SectionCard title="Availability Schedules" action={<AddBtn label="Add Schedule" onClick={() => { form.reset(); setModal(true); }} />}>
                <PageTable head={['Outlet', 'Day', 'Start', 'End', 'Available', '']}>
                    {schedules.length === 0
                        ? <EmptyRow cols={6} label="No schedules - item is always available at all outlets." />
                        : schedules.map((s) => (
                            <tr key={s.id} className="hover:bg-muted/50">
                                <td className="px-6 py-3 text-sm text-muted-foreground">{s.outlet?.name ?? <span className="italic">All outlets</span>}</td>
                                <td className="px-6 py-3 font-semibold capitalize text-foreground">{s.day_of_week}</td>
                                <td className="px-6 py-3 font-mono text-sm">{s.start_time ?? '-'}</td>
                                <td className="px-6 py-3 font-mono text-sm">{s.end_time ?? '-'}</td>
                                <td className="px-6 py-3">
                                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                        s.is_available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400')}>
                                        {s.is_available ? 'Available' : 'Unavailable'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button type="button" onClick={() => { if (confirm('Remove this schedule?')) router.delete(schedulesDestroy.url({ food: food.id, schedule: s.id }), { preserveScroll: true }); }}
                                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                </PageTable>
            </SectionCard>

            <Dialog open={modal} onOpenChange={(o) => { if (!o) setModal(false); }}>
                <DialogContent className="max-w-lg bg-card">
                    <DialogHeader><DialogTitle>Add Availability Schedule</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); form.post(schedulesUpsert.url(food.id), { onSuccess: () => { form.reset(); setModal(false); } }); }} className="space-y-4">
                        <FormField label="Outlet (optional)" error={form.errors.outlet_id}>
                            <SearchableSelect value={form.data.outlet_id} onChange={(e) => form.setData('outlet_id', e.target.value)}>
                                <option value="">All outlets</option>
                                {scopeOutlets.map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                            </SearchableSelect>
                        </FormField>
                        <FormField label="Day of Week" error={form.errors.day_of_week}>
                            <SearchableSelect value={form.data.day_of_week} onChange={(e) => form.setData('day_of_week', e.target.value as typeof DAYS[number])}>
                                {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                            </SearchableSelect>
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Start Time" error={form.errors.start_time}>
                                <Input type="time" value={form.data.start_time} onChange={(e) => form.setData('start_time', e.target.value)} />
                            </FormField>
                            <FormField label="End Time" error={form.errors.end_time}>
                                <Input type="time" value={form.data.end_time} onChange={(e) => form.setData('end_time', e.target.value)} />
                            </FormField>
                        </div>
                        <FormField label="Available During This Time?" error={form.errors.is_available}>
                            <SearchableSelect value={form.data.is_available ? 'true' : 'false'} onChange={(e) => form.setData('is_available', e.target.value === 'true')}>
                                <option value="true">Yes - available</option>
                                <option value="false">No - unavailable</option>
                            </SearchableSelect>
                        </FormField>
                        <DialogFooter>
                            <button type="button" onClick={() => setModal(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Cancel</button>
                            <button type="submit" disabled={form.processing} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">Add Schedule</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Images tab ─────────────────────────────────────────────────────────────────

function ImagesTab({ food }: { food: Food }) {
    const images = food.images ?? [];
    const [uploading, setUploading] = useState(false);

    const imageUrl = (image: { image: string; url?: string }) => {
        if (image.url) {
            return image.url;
        }

        if (image.image.startsWith('http') || image.image.startsWith('/')) {
            return image.image;
        }

        return `/media/${image.image}`;
    };

    const handleFiles = (files: File[]) => {
        if (!files.length) return;
        setUploading(true);
        const uploadNext = (i: number) => {
            if (i >= files.length) { setUploading(false); return; }
            const fd = new FormData();
            fd.append('image', files[i]);
            router.post(imagesStore.url(food.id), fd as any, { forceFormData: true, preserveScroll: true, onFinish: () => uploadNext(i + 1) });
        };
        uploadNext(0);
    };

    return (
        <div className="space-y-6">
            <SectionCard title="Upload Images" action={uploading ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Uploading…
                </span>
            ) : undefined}>
                <div className="px-6 py-5">
                    <DropzoneUploader uploading={uploading} onFiles={handleFiles} accept="image/*" multiple />
                </div>
            </SectionCard>

            {images.length > 0 && (
                <SectionCard title={`Images (${images.length})`}>
                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {images.map((img) => (
                            <div key={img.id} className={cn('overflow-hidden rounded-lg border bg-card shadow-sm', img.is_primary ? 'border-primary' : 'border-border')}>
                                <div className="relative aspect-[4/3] bg-muted">
                                    <img src={imageUrl(img)} alt={food.name} className="h-full w-full object-cover" />
                                    {img.is_primary && (
                                        <div className="absolute top-3 left-3">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm">
                                                <span className="material-symbols-outlined text-[14px]">star</span>
                                                Primary
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                                    <button
                                        type="button"
                                        disabled={img.is_primary}
                                        onClick={() => router.patch(imagesSetPrimary.url({ food: food.id, image: img.id }), {}, { preserveScroll: true })}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors',
                                            img.is_primary
                                                ? 'cursor-default bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">star</span>
                                        {img.is_primary ? 'Default' : 'Set Default'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('Delete this image?')) {
                                                router.delete(imagesDestroy.url({ food: food.id, image: img.id }), { preserveScroll: true });
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {images.length === 0 && (
                <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground dark:text-stone-400">
                    No images yet. Use the uploader above to add images.
                </div>
            )}
        </div>
    );
}

// ── Combo Items tab ────────────────────────────────────────────────────────────

function ComboItemsTab({ food, allFoods }: { food: Food; allFoods: Pick<Food, 'id' | 'name' | 'item_type'>[] }) {
    const [modal, setModal] = useState(false);
    const items = food.combo_items ?? [];
    const comboVariants = food.variants ?? [];
    const form = useForm({ combo_food_variant_id: '', food_id: '', food_variant_id: '', quantity: '1' });
    const nonComboFoods = allFoods.filter((f) => f.id !== food.id);

    return (
        <>
            <SectionCard title="Combo Items" action={<AddBtn label="Add Item" onClick={() => { form.reset(); setModal(true); }} />}>
                <PageTable head={[...(comboVariants.length > 0 ? ['Combo Variant'] : []), 'Food Item', 'Food Variant', 'Qty', '']}>
                    {items.length === 0
                        ? <EmptyRow cols={comboVariants.length > 0 ? 5 : 4} label="No items in this combo yet." />
                        : items.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/50">
                                {comboVariants.length > 0 && (
                                    <td className="px-6 py-3 text-sm text-muted-foreground">{item.combo_food_variant?.name ?? <span className="italic">All variants</span>}</td>
                                )}
                                <td className="px-6 py-3 font-semibold text-foreground">{item.food?.name ?? '-'}</td>
                                <td className="px-6 py-3 text-sm text-muted-foreground">{item.food_variant?.name ?? <span className="italic">Any</span>}</td>
                                <td className="px-6 py-3 font-mono text-sm">{item.quantity}</td>
                                <td className="px-6 py-3 text-right">
                                    <button type="button" onClick={() => { if (confirm('Remove from combo?')) router.delete(comboItemsDestroy.url({ food: food.id, combo_item: item.id }), { preserveScroll: true }); }}
                                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                </PageTable>
            </SectionCard>

            <Dialog open={modal} onOpenChange={(o) => { if (!o) setModal(false); }}>
                <DialogContent className="max-w-lg bg-card">
                    <DialogHeader><DialogTitle>Add Item to Combo</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); form.post(comboItemsStore.url(food.id), { onSuccess: () => { form.reset(); setModal(false); } }); }} className="space-y-4">
                        {comboVariants.length > 0 && (
                            <FormField label="Combo Variant (optional)" error={form.errors.combo_food_variant_id}>
                                <SearchableSelect value={form.data.combo_food_variant_id} onChange={(e) => form.setData('combo_food_variant_id', e.target.value)}>
                                    <option value="">Applies to all variants</option>
                                    {comboVariants.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                        )}
                        <FormField label="Food Item" error={form.errors.food_id}>
                            <SearchableSelect value={form.data.food_id} onChange={(e) => form.setData('food_id', e.target.value)}>
                                <option value="">Select food…</option>
                                {nonComboFoods.map((f) => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
                            </SearchableSelect>
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Food Variant ID (optional)" error={form.errors.food_variant_id}>
                                <Input type="number" min="1" value={form.data.food_variant_id} onChange={(e) => form.setData('food_variant_id', e.target.value)} placeholder="Optional" />
                            </FormField>
                            <FormField label="Quantity" error={form.errors.quantity}>
                                <Input type="number" min="1" value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} />
                            </FormField>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setModal(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">Cancel</button>
                            <button type="submit" disabled={form.processing} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">Add Item</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FoodShow({ food, categories, scopeOutlets, ingredients, units, allFoods, addonGroups }: Props) {
    const isCombo = food.item_type === 'combo';
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const tabList: { id: Tab; label: string; icon: string; count?: number }[] = [
        { id: 'overview', label: 'Overview',     icon: 'restaurant_menu' },
        { id: 'outlets',  label: 'Outlet Prices', icon: 'storefront',    count: scopeOutlets.length },
        ...(food.has_variants    ? [{ id: 'variants' as Tab, label: 'Variants',      icon: 'layers',        count: food.variants?.length ?? food.variants_count }] : []),
        ...(food.has_addons      ? [{ id: 'addons'   as Tab, label: 'Add-on Groups', icon: 'add_circle',    count: food.addon_groups?.length }] : []),
        ...(food.is_recipe_enabled ? [{ id: 'recipes' as Tab, label: 'Recipes',      icon: 'receipt_long',  count: food.all_recipes?.length ?? food.recipes_count }] : []),
        { id: 'schedule', label: 'Schedule',     icon: 'schedule',      count: food.availability_schedules?.length },
        { id: 'images',   label: 'Images',       icon: 'photo_library', count: food.images?.length ?? food.images_count },
        ...(isCombo ? [{ id: 'combo' as Tab, label: 'Combo Items', icon: 'fastfood', count: food.combo_items?.length }] : []),
    ];

    return (
        <>
            <Head title={food.name} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Foods & Menu', href: foodsIndex.url() },
                    { label: food.name },
                ]}
                title={food.name}
                description={`${food.item_type} · Rs. ${food.base_price}`}
                actions={
                    <Link
                        href={foodsEdit.url(food.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border/30 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted dark:border-border dark:bg-card dark:hover:bg-accent"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit Food
                    </Link>
                }
            />

            <div className="mb-6 border-b border-border">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {tabList.map((tab) => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                            )}>
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                            {tab.count != null && tab.count > 0 && (
                                <span className="ml-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold dark:bg-stone-800">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'overview'  && <OverviewTab food={food} />}
            {activeTab === 'outlets'   && <OutletPricesTab food={food} scopeOutlets={scopeOutlets} />}
            {activeTab === 'variants'  && <VariantsTab food={food} scopeOutlets={scopeOutlets} />}
            {activeTab === 'addons'    && <AddonGroupsTab food={food} addonGroups={addonGroups} />}
            {activeTab === 'recipes'   && <RecipesTab food={food} ingredients={ingredients} units={units} />}
            {activeTab === 'schedule'  && <ScheduleTab food={food} scopeOutlets={scopeOutlets} />}
            {activeTab === 'images'    && <ImagesTab food={food} />}
            {activeTab === 'combo'     && <ComboItemsTab food={food} allFoods={allFoods} />}
        </>
    );
}
