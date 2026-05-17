import { Head, Link, useForm } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { dashboard } from '@/routes';
import {
    index as stockOutsIndex,
    edit as stockOutsEdit,
    approve as stockOutsApprove,
    cancel as stockOutsCancel,
    destroy as stockOutsDestroy,
} from '@/routes/ingredient-stock-outs';
import { cn } from '@/lib/utils';
import type { IngredientStockOut, StockOutPurpose, StockOutStatus } from '@/types';

const STATUS_LABELS: Record<StockOutStatus, string> = {
    draft:     'Draft',
    approved:  'Approved',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<StockOutStatus, string> = {
    draft:     'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    approved:  'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

const PURPOSE_LABELS: Record<StockOutPurpose, string> = {
    production_use: 'Production Use',
    kitchen_use:    'Kitchen Use',
    sample:         'Sample',
    distribution:   'Distribution',
    other:          'Other',
};

type Props = {
    stockOut: IngredientStockOut;
};

export default function IngredientStockOutsShow({ stockOut }: Props) {
    const { confirm, dialog } = useConfirm();
    const { post, processing, errors } = useForm({});

    function handleAction(action: 'approve' | 'cancel' | 'destroy') {
        const messages = {
            approve: 'Approve this stock out? Stock will be deducted immediately.',
            cancel:  'Cancel this stock out record?',
            destroy: 'Delete this stock out record permanently? This cannot be undone.',
        };
        const urls = {
            approve: stockOutsApprove.url(stockOut.id),
            cancel:  stockOutsCancel.url(stockOut.id),
            destroy: stockOutsDestroy.url(stockOut.id),
        };
        confirm(messages[action], () => {
            if (action === 'destroy') {
                post(urls[action], { method: 'delete' } as never);
            } else {
                post(urls[action]);
            }
        }, {
            title:        action.charAt(0).toUpperCase() + action.slice(1),
            confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
            variant:      action === 'cancel' || action === 'destroy' ? 'danger' : 'default',
        });
    }

    const items = stockOut.items ?? [];
    const totalCost = items.reduce((sum, i) => sum + parseFloat(i.total_cost), 0);

    return (
        <>
            <Head title={`Stock Out ${stockOut.stock_out_no}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Stock Outs', href: stockOutsIndex.url() },
                    { label: stockOut.stock_out_no },
                ]}
                title={stockOut.stock_out_no}
                description={`${stockOut.warehouse?.name} · ${PURPOSE_LABELS[stockOut.purpose]}`}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1', STATUS_COLORS[stockOut.status])}>
                            {STATUS_LABELS[stockOut.status]}
                        </span>

                        {stockOut.status === 'draft' && (
                            <>
                                <Can permission="ingredient-stock-outs-update">
                                    <Link
                                        href={stockOutsEdit.url(stockOut.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Edit
                                    </Link>
                                </Can>
                                <Can permission="ingredient-stock-outs-cancel">
                                    <button
                                        onClick={() => handleAction('cancel')}
                                        disabled={processing}
                                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-outs-delete">
                                    <button
                                        onClick={() => handleAction('destroy')}
                                        disabled={processing}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-60"
                                    >
                                        Delete
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-outs-approve">
                                    <>
                                        {errors.approve && (
                                            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{errors.approve}</p>
                                        )}
                                        <button
                                            onClick={() => handleAction('approve')}
                                            disabled={processing}
                                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            Approve &amp; Deduct Stock
                                        </button>
                                    </>
                                </Can>
                            </>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Items table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-border/20 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex items-center justify-between border-b border-border/10 px-6 py-4 dark:border-stone-800">
                            <h2 className="text-sm font-bold text-foreground dark:text-stone-100">Stock Out Items</h2>
                            {items.length > 0 && (
                                <span className="text-xs text-muted-foreground dark:text-stone-400">
                                    Total cost:{' '}
                                    <span className="font-bold text-foreground dark:text-stone-100">{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px] text-sm">
                                <thead>
                                    <tr className="border-b border-border/10 bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:border-stone-800 dark:bg-stone-950/50">
                                        <th className="px-6 py-3 text-left">Ingredient</th>
                                        <th className="px-6 py-3 text-right">Quantity</th>
                                        <th className="px-6 py-3 text-right">Unit Cost</th>
                                        <th className="px-6 py-3 text-right">Total Cost</th>
                                        <th className="px-6 py-3 text-left">Batch</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10 dark:divide-stone-800">
                                    {items.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">No items.</td></tr>
                                    )}
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/50 dark:hover:bg-stone-800/30">
                                            <td className="px-6 py-3">
                                                <div className="font-medium text-foreground dark:text-stone-200">{item.ingredient?.name}</div>
                                                <div className="text-xs text-muted-foreground dark:text-stone-500">{item.ingredient?.base_unit?.name}</div>
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono text-sm">{parseFloat(item.quantity).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-mono text-sm text-muted-foreground dark:text-stone-400">
                                                {parseFloat(item.unit_cost) > 0 ? parseFloat(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 4 }) : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono text-sm">
                                                {parseFloat(item.total_cost) > 0 ? parseFloat(item.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-xs text-muted-foreground dark:text-stone-400">{item.batch?.batch_no ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {stockOut.remarks && (
                        <div className="rounded-xl border border-border/20 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                            <h2 className="mb-2 text-sm font-bold text-foreground dark:text-stone-100">Remarks</h2>
                            <p className="text-sm text-muted-foreground dark:text-stone-400">{stockOut.remarks}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-border/20 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">Stock Out Info</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Stock Out No</dt>
                                <dd className="mt-0.5 font-mono font-bold text-foreground dark:text-stone-100">{stockOut.stock_out_no}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Date</dt>
                                <dd className="mt-0.5 text-foreground dark:text-stone-200">{new Date(stockOut.stock_out_date).toLocaleDateString()}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Warehouse</dt>
                                <dd className="mt-0.5 font-medium text-foreground dark:text-stone-200">{stockOut.warehouse?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Purpose</dt>
                                <dd className="mt-0.5 text-foreground dark:text-stone-200">{PURPOSE_LABELS[stockOut.purpose]}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-xl border border-border/20 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">Activity</h2>
                        <dl className="space-y-3 text-sm">
                            {stockOut.createdBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Created By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">{stockOut.createdBy.name}</dd>
                                </div>
                            )}
                            {stockOut.approvedBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Approved By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">
                                        {stockOut.approvedBy.name}
                                        {stockOut.approved_at && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                · {new Date(stockOut.approved_at).toLocaleDateString()}
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
