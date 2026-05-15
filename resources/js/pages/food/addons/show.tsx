import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as addonsIndex } from '@/routes/addons';
import type { Addon, AddonGroup, AddonRecipe, Ingredient } from '@/types';

type Unit = { id: number; name: string; short_name: string };

type Props = {
    addon: Addon & { group?: Pick<AddonGroup, 'id' | 'name' | 'is_required' | 'min_select' | 'max_select' | 'is_active' | 'sort_order'> };
    ingredients: Pick<Ingredient, 'id' | 'name'>[];
    units: Unit[];
};

type Tab = 'overview' | 'recipe';

const addonEditUrl = (id: number) => `/addons/${id}/edit`;
const groupShowUrl = (id: number) => `/addon-groups/${id}`;

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

function EmptyRow({ cols, label }: { cols: number; label: string }) {
    return (
        <tr>
            <td colSpan={cols} className="px-6 py-10 text-center text-sm text-muted-foreground">{label}</td>
        </tr>
    );
}

function RecipeTab({ addon, ingredients, units }: Props) {
    const [modal, setModal] = useState(false);
    const form = useForm({ ingredient_id: '', unit_id: '', quantity: '', wastage_quantity: '0', is_active: true });
    const recipes = addon.recipes ?? [];

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/addons/${addon.id}/recipes`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setModal(false);
            },
        });
    }

    return (
        <>
            <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="font-bold text-foreground">Recipe Lines</h3>
                    <button type="button" onClick={() => {
                        form.reset();
                        setModal(true);
                    }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Line
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900">
                                <th className="border-b border-border/10 px-6 py-3">Ingredient</th>
                                <th className="border-b border-border/10 px-6 py-3">Quantity</th>
                                <th className="border-b border-border/10 px-6 py-3">Wastage</th>
                                <th className="border-b border-border/10 px-6 py-3">Unit</th>
                                <th className="border-b border-border/10 px-6 py-3">Status</th>
                                <th className="border-b border-border/10 px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {recipes.length === 0 && <EmptyRow cols={6} label="No recipe lines yet. Add ingredients to define this add-on recipe." />}
                            {recipes.map((recipe: AddonRecipe) => (
                                <tr key={recipe.id} className="hover:bg-muted/50">
                                    <td className="px-6 py-3 font-semibold text-foreground">{recipe.ingredient?.name ?? '-'}</td>
                                    <td className="px-6 py-3 font-mono text-sm">{recipe.quantity}</td>
                                    <td className="px-6 py-3 font-mono text-sm text-muted-foreground">{recipe.wastage_quantity}</td>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">{recipe.unit?.short_name ?? '-'}</td>
                                    <td className="px-6 py-3"><StatusBadge active={recipe.is_active} /></td>
                                    <td className="px-6 py-3 text-right">
                                        <button type="button" onClick={() => {
                                            if (confirm('Remove this recipe line?')) {
                                                router.delete(`/addons/${addon.id}/recipes/${recipe.id}`, { preserveScroll: true });
                                            }
                                        }}
                                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={modal} onOpenChange={(open) => {
                if (!open) {
                    setModal(false);
                }
            }}>
                <DialogContent className="max-w-lg bg-card">
                    <DialogHeader><DialogTitle>Add Recipe Line</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <FormField label="Ingredient" error={form.errors.ingredient_id}>
                            <SearchableSelect value={form.data.ingredient_id} onChange={(e) => form.setData('ingredient_id', e.target.value)}>
                                <option value="">Select ingredient...</option>
                                {ingredients.map((ingredient) => <option key={ingredient.id} value={String(ingredient.id)}>{ingredient.name}</option>)}
                            </SearchableSelect>
                        </FormField>
                        <FormField label="Unit" error={form.errors.unit_id}>
                            <SearchableSelect value={form.data.unit_id} onChange={(e) => form.setData('unit_id', e.target.value)}>
                                <option value="">Select unit...</option>
                                {units.map((unit) => <option key={unit.id} value={String(unit.id)}>{unit.name} ({unit.short_name})</option>)}
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
                        <FormField label="Status" error={form.errors.is_active}>
                            <SearchableSelect value={form.data.is_active ? 'true' : 'false'} onChange={(e) => form.setData('is_active', e.target.value === 'true')}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>
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

export default function AddonShow({ addon, ingredients, units }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const recipes = addon.recipes ?? [];
    const tabList: { id: Tab; label: string; icon: string; count?: number }[] = [
        { id: 'overview', label: 'Overview', icon: 'extension' },
        { id: 'recipe', label: 'Recipe', icon: 'receipt_long', count: recipes.length },
    ];

    return (
        <>
            <Head title={addon.name} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Add-ons', href: addonsIndex.url() },
                    { label: addon.name },
                ]}
                title={addon.name}
                description={addon.group?.name ?? 'Add-on'}
                actions={
                    <Link href={addonEditUrl(addon.id)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit Add-on
                    </Link>
                }
            />

            <div className="mb-6 border-b border-border">
                <nav className="-mb-px flex gap-1 overflow-x-auto">
                    {tabList.map((tab) => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                            )}>
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                            {tab.count != null && tab.count > 0 && <span className="ml-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{tab.count}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[32px]">extension</span>
                        </div>
                        <h2 className="text-lg font-bold text-foreground">{addon.name}</h2>
                        {addon.group && (
                            <Link href={groupShowUrl(addon.group.id)} className="mt-1 inline-block text-sm font-medium text-primary hover:underline">
                                {addon.group.name}
                            </Link>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <StatusBadge active={addon.is_active} />
                            <span className={cn(
                                'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                                addon.is_recipe_enabled
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                            )}>
                                {addon.is_recipe_enabled ? 'Recipe enabled' : 'No recipe'}
                            </span>
                        </div>
                        <div className="mt-6">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">Rs. {Number(addon.price).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Add-on Details</h3>
                        <dl className="space-y-3.5">
                            {[
                                { label: 'Group', value: addon.group?.name ?? '-' },
                                { label: 'Price', value: `Rs. ${Number(addon.price).toFixed(2)}` },
                                { label: 'Sort order', value: addon.sort_order },
                                { label: 'Recipe enabled', value: addon.is_recipe_enabled ? 'Yes' : 'No' },
                                { label: 'Recipe lines', value: recipes.length },
                            ].map((item, i, arr) => (
                                <div key={item.label} className={cn('flex justify-between py-1', i < arr.length - 1 && 'border-b border-border/50')}>
                                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                                    <dd className="text-sm font-semibold">{String(item.value)}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}

            {activeTab === 'recipe' && <RecipeTab addon={addon} ingredients={ingredients} units={units} />}
        </>
    );
}
