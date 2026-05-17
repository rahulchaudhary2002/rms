import { Head, Link, useForm } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { dashboard } from '@/routes';
import {
    index as countsIndex,
    edit as countsEdit,
    startCounting as countsStartCounting,
    complete as countsComplete,
    generateAdjustment as countsGenerateAdjustment,
    markAdjusted as countsMarkAdjusted,
    cancel as countsCancel,
    destroy as countsDestroy,
} from '@/routes/ingredient-stock-counts';
import { cn } from '@/lib/utils';
import type { IngredientStockCount, StockCountStatus } from '@/types';

const STATUS_LABELS: Record<StockCountStatus, string> = {
    draft:     'Draft',
    counting:  'Counting',
    completed: 'Completed',
    adjusted:  'Adjusted',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<StockCountStatus, string> = {
    draft:     'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    counting:  'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
    completed: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
    adjusted:  'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

type Props = {
    count: IngredientStockCount;
};

export default function IngredientStockCountsShow({ count }: Props) {
    const { confirm, dialog } = useConfirm();
    const { post, processing } = useForm({});

    function handleAction(action: 'startCounting' | 'complete' | 'generateAdjustment' | 'markAdjusted' | 'cancel' | 'destroy') {
        const messages: Record<typeof action, string> = {
            startCounting:      'Start counting? The count will move to counting phase and items can no longer be added or removed.',
            complete:           'Mark this count as completed? Make sure all quantities have been entered.',
            generateAdjustment: 'Generate a stock adjustment from this count? A draft adjustment will be created for all items with differences.',
            markAdjusted:       'Mark this count as adjusted? Do this after the generated adjustment has been approved.',
            cancel:             'Cancel this stock count?',
            destroy:            'Delete this stock count permanently? This cannot be undone.',
        };
        const urls: Record<typeof action, string> = {
            startCounting:      countsStartCounting.url(count.id),
            complete:           countsComplete.url(count.id),
            generateAdjustment: countsGenerateAdjustment.url(count.id),
            markAdjusted:       countsMarkAdjusted.url(count.id),
            cancel:             countsCancel.url(count.id),
            destroy:            countsDestroy.url(count.id),
        };
        const titles: Record<typeof action, string> = {
            startCounting:      'Start Counting',
            complete:           'Complete Count',
            generateAdjustment: 'Generate Adjustment',
            markAdjusted:       'Mark as Adjusted',
            cancel:             'Cancel',
            destroy:            'Delete',
        };
        confirm(messages[action], () => {
            if (action === 'destroy') {
                post(urls[action], { method: 'delete' } as never);
            } else {
                post(urls[action]);
            }
        }, {
            title:        titles[action],
            confirmLabel: titles[action],
            variant:      action === 'cancel' || action === 'destroy' ? 'danger' : 'default',
        });
    }

    const items = count.items ?? [];

    const totalDiff = items.reduce((sum, i) => sum + parseFloat(i.difference_quantity), 0);

    return (
        <>
            <Head title={`Count ${count.count_no}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Stock Counts', href: countsIndex.url() },
                    { label: count.count_no },
                ]}
                title={count.count_no}
                description={count.warehouse?.name ?? ''}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1', STATUS_COLORS[count.status])}>
                            {STATUS_LABELS[count.status]}
                        </span>

                        {count.status === 'draft' && (
                            <>
                                <Can permission="ingredient-stock-counts-update">
                                    <Link
                                        href={countsEdit.url(count.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Edit
                                    </Link>
                                </Can>
                                <Can permission="ingredient-stock-counts-start">
                                    <button
                                        onClick={() => handleAction('startCounting')}
                                        disabled={processing}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        Start Counting
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-counts-cancel">
                                    <button
                                        onClick={() => handleAction('cancel')}
                                        disabled={processing}
                                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-counts-delete">
                                    <button
                                        onClick={() => handleAction('destroy')}
                                        disabled={processing}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-60"
                                    >
                                        Delete
                                    </button>
                                </Can>
                            </>
                        )}

                        {count.status === 'counting' && (
                            <>
                                <Can permission="ingredient-stock-counts-update">
                                    <Link
                                        href={countsEdit.url(count.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Enter Counts
                                    </Link>
                                </Can>
                                <Can permission="ingredient-stock-counts-cancel">
                                    <button
                                        onClick={() => handleAction('cancel')}
                                        disabled={processing}
                                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                </Can>
                            </>
                        )}

                        {count.status === 'counting' && (
                            <Can permission="ingredient-stock-counts-complete">
                                <button
                                    onClick={() => handleAction('complete')}
                                    disabled={processing}
                                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-700 disabled:opacity-60"
                                >
                                    Complete Count
                                </button>
                            </Can>
                        )}

                        {count.status === 'completed' && (
                            <>
                                <Can permission="ingredient-stock-counts-generate-adjustment">
                                    <button
                                        onClick={() => handleAction('generateAdjustment')}
                                        disabled={processing}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                                    >
                                        Generate Adjustment
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-counts-update">
                                    <button
                                        onClick={() => handleAction('markAdjusted')}
                                        disabled={processing}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        Mark as Adjusted
                                    </button>
                                </Can>
                            </>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Items table */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-xl border border-border/20 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center justify-between border-b border-border/10 px-6 py-4 dark:border-stone-800">
                            <h2 className="text-sm font-bold text-foreground dark:text-stone-100">Count Items</h2>
                            {items.length > 0 && (
                                <span className={cn(
                                    'text-xs font-bold',
                                    totalDiff > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                    totalDiff < 0 ? 'text-red-600 dark:text-red-400' :
                                    'text-muted-foreground',
                                )}>
                                    Net difference:{' '}
                                    {totalDiff > 0 ? '+' : ''}
                                    {totalDiff.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-sm">
                                <thead>
                                    <tr className="border-b border-border/10 bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:border-stone-800 dark:bg-stone-950/50">
                                        <th className="px-6 py-3 text-left">Ingredient</th>
                                        <th className="px-6 py-3 text-right">System Qty</th>
                                        <th className="px-6 py-3 text-right">Counted Qty</th>
                                        <th className="px-6 py-3 text-right">Difference</th>
                                        <th className="px-6 py-3 text-left">Batch</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10 dark:divide-stone-800">
                                    {items.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">No items.</td></tr>
                                    )}
                                    {items.map((item) => {
                                        const diff = parseFloat(item.difference_quantity);
                                        return (
                                            <tr key={item.id} className="hover:bg-muted/50 dark:hover:bg-stone-800/30">
                                                <td className="px-6 py-3">
                                                    <div className="font-medium text-foreground dark:text-stone-200">{item.ingredient?.name}</div>
                                                    <div className="text-xs text-muted-foreground dark:text-stone-500">{item.ingredient?.base_unit?.name}</div>
                                                    {item.remarks && <div className="mt-0.5 text-xs italic text-muted-foreground dark:text-stone-500">{item.remarks}</div>}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono">{parseFloat(item.system_quantity).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-right font-mono">{parseFloat(item.counted_quantity).toLocaleString()}</td>
                                                <td className={cn(
                                                    'px-6 py-3 text-right font-mono font-bold',
                                                    diff > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                                    diff < 0 ? 'text-red-600 dark:text-red-400' :
                                                    'text-muted-foreground',
                                                )}>
                                                    {diff > 0 ? '+' : ''}{diff.toFixed(4)}
                                                </td>
                                                <td className="px-6 py-3 text-xs text-muted-foreground dark:text-stone-400">{item.batch?.batch_no ?? '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {count.remarks && (
                        <div className="rounded-xl border border-border/20 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                            <h2 className="mb-2 text-sm font-bold text-foreground dark:text-stone-100">Remarks</h2>
                            <p className="text-sm text-muted-foreground dark:text-stone-400">{count.remarks}</p>
                        </div>
                    )}

                    {count.status === 'completed' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/40 dark:bg-amber-900/10">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined mt-0.5 text-[20px] text-amber-600 dark:text-amber-400">info</span>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Next Steps</p>
                                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                                        Click <strong>Generate Adjustment</strong> to create a draft stock adjustment from the differences found in this count.
                                        After the adjustment is approved, click <strong>Mark as Adjusted</strong> to close this count.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-border/20 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">Count Info</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Count No</dt>
                                <dd className="mt-0.5 font-mono font-bold text-foreground dark:text-stone-100">{count.count_no}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Date</dt>
                                <dd className="mt-0.5 text-foreground dark:text-stone-200">{new Date(count.count_date).toLocaleDateString()}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Warehouse</dt>
                                <dd className="mt-0.5 font-medium text-foreground dark:text-stone-200">{count.warehouse?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Items</dt>
                                <dd className="mt-0.5 font-bold text-foreground dark:text-stone-100">{items.length}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-xl border border-border/20 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">Activity</h2>
                        <dl className="space-y-3 text-sm">
                            {count.createdBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Created By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">{count.createdBy.name}</dd>
                                </div>
                            )}
                            {count.completedBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Completed By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">
                                        {count.completedBy.name}
                                        {count.completed_at && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                · {new Date(count.completed_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>

            {dialog}
        </>
    );
}
