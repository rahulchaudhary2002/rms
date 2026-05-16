import { Head, Link, router } from '@inertiajs/react';
import { Filter } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { ActionDropdown } from '@/components/action-dropdown';
import { Can } from '@/components/can';
import { PageHeader } from '@/components/page-header';
import { TableCard, TableSearchInput } from '@/components/table-card';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { tablePerPageOptions } from '@/hooks/use-client-pagination';
import { useDebouncedInertiaSearch } from '@/hooks/use-debounced-inertia-search';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create as variantsCreate, destroy as variantsDestroy, edit as variantsEdit, index as variantsIndex, toggleStatus as variantsToggleStatus } from '@/routes/variants';
import type { FoodVariant } from '@/types';

type PaginatedVariants = {
    data: FoodVariant[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    variants: PaginatedVariants;
    filters: { search?: string; is_active?: string; per_page?: string };
};

const foodShowUrl = (id: number) => `/foods/${id}`;

function cleanPaginationLabel(label: string): string {
    return label.replaceAll('&laquo;', '').replaceAll('&raquo;', '').replaceAll('Previous', '').replaceAll('Next', '').trim();
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
            active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
        )}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

export default function FoodVariantsIndex({ variants, filters }: Props) {
    const { confirm, dialog } = useConfirm();
    const [form, setForm] = useState({
        search: filters.search ?? '',
        is_active: filters.is_active ?? '',
        per_page: filters.per_page ?? '10',
    });
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const filterPopoverRef = useRef<HTMLDetailsElement | null>(null);

    const pagination = useMemo(
        () => ({
            previous: variants.links.find((l) => l.label.includes('Previous')) ?? null,
            next: variants.links.find((l) => l.label.includes('Next')) ?? null,
            pages: variants.links.filter((l) => /^\d+$/.test(cleanPaginationLabel(l.label))),
        }),
        [variants.links],
    );

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            const element = event.target instanceof Element ? event.target : null;

            if (element?.closest('[data-searchable-select-root]') || element?.closest('[data-searchable-select-listbox]')) {
                return;
            }

            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                filterPopoverRef.current.removeAttribute('open');
            }
        };
        document.addEventListener('mousedown', handlePointerDown);

        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    useDebouncedInertiaSearch({
        value: form.search,
        onSearch: (value, { onCancelToken }) => {
            router.get(variantsIndex.url(), { ...form, search: value, page: '1' }, { preserveState: true, preserveScroll: true, replace: true, onCancelToken });
        },
    });

    const applyFilters = () => {
        filterPopoverRef.current?.removeAttribute('open');
        router.get(variantsIndex.url(), form, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        const reset = { search: '', is_active: '', per_page: '10' };
        setForm(reset);
        filterPopoverRef.current?.removeAttribute('open');
        router.get(variantsIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updatePerPage = (nextValue: string) => {
        setForm((cur) => ({ ...cur, per_page: nextValue }));
        router.get(variantsIndex.url(), { ...form, per_page: nextValue, page: '1' }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <>
            <Head title="Food Variants" />
            <PageHeader
                breadcrumbs={[{ label: 'Home', href: dashboard.url() }, { label: 'Food & Menu' }, { label: 'Food Variants' }]}
                title="Food Variants"
                description="Manage all food variants from one place."
                actions={
                    <Can permission="foods-update">
                        <Link href={variantsCreate.url()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Variant
                        </Link>
                    </Can>
                }
            />

            <TableCard
                className="overflow-visible"
                title="Food Variants"
                description="Variant price, SKU, default, and active settings."
                toolbar={
                    <>
                        <TableSearchInput
                            value={form.search}
                            onChange={(value) => setForm((cur) => ({ ...cur, search: value }))}
                            placeholder="Search variant, SKU, food..."
                            className="w-full lg:w-auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyFilters();
                                }
                            }}
                        />
                        <details ref={filterPopoverRef} className="relative">
                            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border/30 bg-white px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent">
                                <Filter className="h-4 w-4" />
                                Filter
                            </summary>
                            <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border/20 bg-white p-5 shadow-2xl dark:border-border dark:bg-card">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground">Table Filters</h4>
                                    <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline" onClick={clearFilters}>Clear All</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Status</label>
                                        <SearchableSelect value={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}>
                                            <option value="">All Status</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </SearchableSelect>
                                    </div>
                                    <Button type="button" className="w-full rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary" onClick={applyFilters}>Apply Filters</Button>
                                </div>
                            </div>
                        </details>
                    </>
                }
                footer={
                    <>
                        <div className="flex flex-wrap items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground">Showing <span className="font-bold text-foreground">{variants.from ?? 0} - {variants.to ?? 0}</span> of <span className="font-bold text-foreground">{variants.total}</span> results</p>
                            <div className="hidden h-4 w-px bg-muted-foreground/30 lg:block" />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Items per page</span>
                                <select value={form.per_page} onChange={(e) => updatePerPage(e.target.value)} className="h-9 rounded-md border border-border/30 bg-white px-3 text-[11px] font-bold text-foreground shadow-sm outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100">
                                    {tablePerPageOptions.map((o) => <option key={o} value={o}>{o === 'all' ? 'All' : o}</option>)}
                                </select>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2" aria-label="Pagination">
                            <Link href={pagination.previous?.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors', pagination.previous?.url ? 'text-muted-foreground hover:bg-accent' : 'pointer-events-none text-muted-foreground/40')}>
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </Link>
                            <div className="flex items-center gap-1">
                                {pagination.pages.map((link) => (
                                    <Link key={`${link.label}-${link.url}`} href={link.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors', link.active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-accent', !link.url && 'pointer-events-none opacity-40')}>
                                        {cleanPaginationLabel(link.label)}
                                    </Link>
                                ))}
                            </div>
                            <Link href={pagination.next?.url ?? '#'} preserveScroll className={cn('flex h-8 w-8 items-center justify-center rounded border border-border/20 transition-colors', pagination.next?.url ? 'text-foreground hover:bg-accent' : 'pointer-events-none text-muted-foreground/40')}>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </Link>
                        </nav>
                    </>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left">
                        <thead>
                            <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900">
                                <th className="border-b border-border/10 px-6 py-4">Variant</th>
                                <th className="border-b border-border/10 px-6 py-4">Food</th>
                                <th className="border-b border-border/10 px-6 py-4">SKU</th>
                                <th className="border-b border-border/10 px-6 py-4">Price</th>
                                <th className="border-b border-border/10 px-6 py-4">Default</th>
                                <th className="border-b border-border/10 px-6 py-4">Status</th>
                                <th className="border-b border-border/10 px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted dark:divide-stone-800">
                            {variants.data.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">No food variants found.</td></tr>
                            )}
                            {variants.data.map((variant) => (
                                <tr key={variant.id} className="transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                    <td className="px-6 py-4 font-bold text-foreground">{variant.name}</td>
                                    <td className="px-6 py-4">
                                        {variant.food ? (
                                            <Link href={foodShowUrl(variant.food.id)} className="text-sm font-medium text-primary hover:underline">{variant.food.name}</Link>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{variant.sku || '-'}</td>
                                    <td className="px-6 py-4 font-mono text-sm">Rs. {Number(variant.price ?? 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{variant.is_default ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4"><StatusBadge active={variant.is_active} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            isOpen={openActionId === variant.id}
                                            itemId={variant.id}
                                            itemLabel={variant.name}
                                            onToggle={(id) => setOpenActionId((cur) => id === null ? null : cur === id ? null : (id as number))}
                                            actions={[
                                                { id: `edit-${variant.id}`, label: 'Edit variant', icon: 'edit', href: variantsEdit.url(variant.id) },
                                                {
                                                    id: `toggle-${variant.id}`,
                                                    label: variant.is_active ? 'Deactivate' : 'Activate',
                                                    icon: variant.is_active ? 'toggle_off' : 'toggle_on',
                                                    onClick: () => router.patch(variantsToggleStatus.url(variant.id), {}, { preserveScroll: true }),
                                                },
                                                {
                                                    id: `delete-${variant.id}`,
                                                    label: 'Delete variant',
                                                    icon: 'delete',
                                                    variant: 'danger' as const,
                                                    onClick: () => confirm('Delete this food variant?', () => router.delete(variantsDestroy.url(variant.id)), { title: 'Delete Variant', confirmLabel: 'Delete', variant: 'danger' }),
                                                },
                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </TableCard>
            {dialog}
        </>
    );
}
