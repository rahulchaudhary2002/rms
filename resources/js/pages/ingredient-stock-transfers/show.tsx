import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Can } from '@/components/can';
import { dashboard } from '@/routes';
import {
    index as transfersIndex,
    edit as transfersEdit,
    submit as transfersSubmit,
    approve as transfersApprove,
    dispatch as transfersDispatch,
    receive as transfersReceive,
    cancel as transfersCancel,
    destroy as transfersDestroy,
} from '@/routes/ingredient-stock-transfers';
import { cn } from '@/lib/utils';
import type { IngredientStockTransfer, IngredientStockTransferItem, TransferStatus } from '@/types';

const STATUS_LABELS: Record<TransferStatus, string> = {
    draft:              'Draft',
    requested:          'Requested',
    approved:           'Approved',
    dispatched:         'Dispatched',
    partially_received: 'Partially Received',
    received:           'Received',
    cancelled:          'Cancelled',
};

const STATUS_COLORS: Record<TransferStatus, string> = {
    draft:              'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    requested:          'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800',
    approved:           'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800',
    dispatched:         'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
    partially_received: 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-800',
    received:           'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled:          'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

type Props = {
    transfer: IngredientStockTransfer & {
        requestedBy?: { id: number; name: string } | null;
        approvedBy?: { id: number; name: string } | null;
        dispatchedBy?: { id: number; name: string } | null;
        receivedBy?: { id: number; name: string } | null;
    };
};

// ---- Dispatch panel -------------------------------------------------------

function DispatchPanel({ transfer }: { transfer: IngredientStockTransfer }) {
    const items = transfer.items ?? [];

    const { data, setData, post, processing, errors } = useForm({
        items: items.map((item) => ({
            id:                   item.id,
            ingredient_batch_id:  item.ingredient_batch_id ? String(item.ingredient_batch_id) : '',
            dispatched_quantity:  item.requested_quantity,
        })),
    });

    function updateItem(index: number, field: string, value: string) {
        const next = data.items.map((row, i) => i === index ? { ...row, [field]: value } : row);
        setData('items', next);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(transfersDispatch.url(transfer.id));
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                    <thead>
                        <tr className="border-b border-border/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:border-stone-700">
                            <th className="py-2 pr-4 text-left">Ingredient</th>
                            <th className="py-2 pr-4 text-right">Requested</th>
                            <th className="py-2 pr-4 text-right">Dispatch Qty</th>
                            <th className="py-2 text-left">Batch ID (optional)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10 dark:divide-stone-800">
                        {data.items.map((row, index) => {
                            const item = items[index]!;
                            return (
                                <tr key={row.id}>
                                    <td className="py-3 pr-4">
                                        <div className="font-medium text-foreground dark:text-stone-200">{item.ingredient?.name}</div>
                                        <div className="text-xs text-muted-foreground dark:text-stone-500">{item.ingredient?.base_unit?.short_name}</div>
                                    </td>
                                    <td className="py-3 pr-4 text-right font-mono text-sm text-muted-foreground dark:text-stone-400">
                                        {parseFloat(item.requested_quantity).toLocaleString()}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <Input
                                            type="number"
                                            min="0.0001"
                                            step="0.0001"
                                            value={row.dispatched_quantity}
                                            onChange={(e) => updateItem(index, 'dispatched_quantity', e.target.value)}
                                            className="w-32 text-right"
                                        />
                                        {(errors as Record<string, string>)[`items.${index}.dispatched_quantity`] && (
                                            <p className="mt-1 text-xs text-red-500">{(errors as Record<string, string>)[`items.${index}.dispatched_quantity`]}</p>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <Input
                                            type="number"
                                            value={row.ingredient_batch_id}
                                            onChange={(e) => updateItem(index, 'ingredient_batch_id', e.target.value)}
                                            placeholder="Batch ID"
                                            className="w-28"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Confirm Dispatch
                </button>
            </div>
        </form>
    );
}

// ---- Receive panel --------------------------------------------------------

function ReceivePanel({ transfer }: { transfer: IngredientStockTransfer }) {
    const items = (transfer.items ?? []).filter((i) => parseFloat(i.dispatched_quantity) > 0);

    const { data, setData, post, processing, errors } = useForm({
        items: items.map((item) => ({
            id:               item.id,
            received_quantity: item.dispatched_quantity,
            batch_no:         '',
            expiry_date:      '',
        })),
    });

    function updateItem(index: number, field: string, value: string) {
        const next = data.items.map((row, i) => i === index ? { ...row, [field]: value } : row);
        setData('items', next);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(transfersReceive.url(transfer.id));
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                    <thead>
                        <tr className="border-b border-border/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:border-stone-700">
                            <th className="py-2 pr-4 text-left">Ingredient</th>
                            <th className="py-2 pr-4 text-right">Dispatched</th>
                            <th className="py-2 pr-4 text-right">Receive Qty</th>
                            <th className="py-2 pr-4 text-left">Batch No</th>
                            <th className="py-2 text-left">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10 dark:divide-stone-800">
                        {data.items.map((row, index) => {
                            const item = items[index]!;
                            return (
                                <tr key={row.id}>
                                    <td className="py-3 pr-4">
                                        <div className="font-medium text-foreground dark:text-stone-200">{item.ingredient?.name}</div>
                                        <div className="text-xs text-muted-foreground dark:text-stone-500">{item.ingredient?.base_unit?.short_name}</div>
                                    </td>
                                    <td className="py-3 pr-4 text-right font-mono text-sm text-muted-foreground dark:text-stone-400">
                                        {parseFloat(item.dispatched_quantity).toLocaleString()}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={row.received_quantity}
                                            onChange={(e) => updateItem(index, 'received_quantity', e.target.value)}
                                            className="w-32 text-right"
                                        />
                                        {(errors as Record<string, string>)[`items.${index}.received_quantity`] && (
                                            <p className="mt-1 text-xs text-red-500">{(errors as Record<string, string>)[`items.${index}.received_quantity`]}</p>
                                        )}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <Input
                                            value={row.batch_no}
                                            onChange={(e) => updateItem(index, 'batch_no', e.target.value)}
                                            placeholder="e.g. BAT-001"
                                            className="w-28"
                                        />
                                    </td>
                                    <td className="py-3">
                                        <Input
                                            type="date"
                                            value={row.expiry_date}
                                            onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                                            className="w-36"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Confirm Receipt
                </button>
            </div>
        </form>
    );
}

// ---- Main page ------------------------------------------------------------

export default function IngredientStockTransfersShow({ transfer }: Props) {
    const { confirm, dialog } = useConfirm();
    const [activePanel, setActivePanel] = useState<'dispatch' | 'receive' | null>(null);

    const { post, processing } = useForm({});

    function handleAction(action: 'submit' | 'approve' | 'cancel' | 'destroy') {
        const messages = {
            submit:  'Submit this transfer for approval?',
            approve: 'Approve this transfer?',
            cancel:  'Cancel this transfer? This cannot be undone.',
            destroy: 'Delete this transfer permanently? This cannot be undone.',
        };
        const urls = {
            submit:  transfersSubmit.url(transfer.id),
            approve: transfersApprove.url(transfer.id),
            cancel:  transfersCancel.url(transfer.id),
            destroy: transfersDestroy.url(transfer.id),
        };
        confirm(messages[action], () => {
            if (action === 'destroy') {
                post(urls[action], { method: 'delete' } as never);
            } else {
                post(urls[action]);
            }
        }, { title: action.charAt(0).toUpperCase() + action.slice(1), confirmLabel: action.charAt(0).toUpperCase() + action.slice(1), variant: action === 'cancel' || action === 'destroy' ? 'danger' : 'default' });
    }

    const items = transfer.items ?? [];

    return (
        <>
            <Head title={`Transfer ${transfer.transfer_no}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Stock Transfers', href: transfersIndex.url() },
                    { label: transfer.transfer_no },
                ]}
                title={transfer.transfer_no}
                description={`${transfer.from_warehouse?.name} → ${transfer.to_warehouse?.name}`}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1', STATUS_COLORS[transfer.status])}>
                            {STATUS_LABELS[transfer.status]}
                        </span>

                        {transfer.status === 'draft' && (
                            <>
                                <Can permission="ingredient-stock-transfers-update">
                                    <Link href={transfersEdit.url(transfer.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        Edit
                                    </Link>
                                </Can>
                                <Can permission="ingredient-stock-transfers-request">
                                    <button onClick={() => handleAction('submit')} disabled={processing} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-60">
                                        Submit
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-transfers-delete">
                                    <button onClick={() => handleAction('destroy')} disabled={processing} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-60">
                                        Delete
                                    </button>
                                </Can>
                            </>
                        )}

                        {transfer.status === 'requested' && (
                            <>
                                <Can permission="ingredient-stock-transfers-approve">
                                    <button onClick={() => handleAction('approve')} disabled={processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60">
                                        Approve
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-transfers-cancel">
                                    <button onClick={() => handleAction('cancel')} disabled={processing} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60">
                                        Cancel
                                    </button>
                                </Can>
                            </>
                        )}

                        {transfer.status === 'approved' && (
                            <>
                                <Can permission="ingredient-stock-transfers-dispatch">
                                    <button onClick={() => setActivePanel((p) => p === 'dispatch' ? null : 'dispatch')} className={cn('rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all', activePanel === 'dispatch' ? 'bg-amber-700' : 'bg-amber-600 hover:bg-amber-700')}>
                                        {activePanel === 'dispatch' ? 'Close Dispatch' : 'Dispatch'}
                                    </button>
                                </Can>
                                <Can permission="ingredient-stock-transfers-cancel">
                                    <button onClick={() => handleAction('cancel')} disabled={processing} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60">
                                        Cancel
                                    </button>
                                </Can>
                            </>
                        )}

                        {(transfer.status === 'dispatched' || transfer.status === 'partially_received') && (
                            <Can permission="ingredient-stock-transfers-receive">
                                <button onClick={() => setActivePanel((p) => p === 'receive' ? null : 'receive')} className={cn('rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all', activePanel === 'receive' ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700')}>
                                    {activePanel === 'receive' ? 'Close Receive' : 'Receive Stock'}
                                </button>
                            </Can>
                        )}
                    </div>
                }
            />

            {/* Action panels */}
            {activePanel === 'dispatch' && transfer.status === 'approved' && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/40 dark:bg-amber-900/10">
                    <h3 className="mb-4 text-sm font-bold text-amber-800 dark:text-amber-300">Dispatch Transfer - enter quantities to dispatch from {transfer.from_warehouse?.name}</h3>
                    <DispatchPanel transfer={transfer} />
                </div>
            )}

            {activePanel === 'receive' && (transfer.status === 'dispatched' || transfer.status === 'partially_received') && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800/40 dark:bg-emerald-900/10">
                    <h3 className="mb-4 text-sm font-bold text-emerald-800 dark:text-emerald-300">Receive Stock - confirm quantities received into {transfer.to_warehouse?.name}</h3>
                    <ReceivePanel transfer={transfer} />
                </div>
            )}

            {/* Transfer info */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Items table */}
                    <div className="rounded-xl border border-border/20 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <div className="border-b border-border/10 px-6 py-4 dark:border-stone-800">
                            <h2 className="text-sm font-bold text-foreground dark:text-stone-100">Transfer Items</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-sm">
                                <thead>
                                    <tr className="border-b border-border/10 bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:border-stone-800 dark:bg-stone-950/50">
                                        <th className="px-6 py-3 text-left">Ingredient</th>
                                        <th className="px-6 py-3 text-right">Requested</th>
                                        <th className="px-6 py-3 text-right">Dispatched</th>
                                        <th className="px-6 py-3 text-right">Received</th>
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
                                            <td className="px-6 py-3 text-right font-mono text-sm">{parseFloat(item.requested_quantity).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-mono text-sm">{parseFloat(item.dispatched_quantity).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-mono text-sm">{parseFloat(item.received_quantity).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-xs text-muted-foreground dark:text-stone-400">{item.batch?.batch_no ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Remarks */}
                    {transfer.remarks && (
                        <div className="rounded-xl border border-border/20 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                            <h2 className="mb-2 text-sm font-bold text-foreground dark:text-stone-100">Remarks</h2>
                            <p className="text-sm text-muted-foreground dark:text-stone-400">{transfer.remarks}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar info */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-border/20 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">Transfer Info</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Transfer No</dt>
                                <dd className="mt-0.5 font-mono font-bold text-foreground dark:text-stone-100">{transfer.transfer_no}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Date</dt>
                                <dd className="mt-0.5 text-foreground dark:text-stone-200">{new Date(transfer.transfer_date).toLocaleDateString()}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">From</dt>
                                <dd className="mt-0.5 font-medium text-foreground dark:text-stone-200">{transfer.from_warehouse?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">To</dt>
                                <dd className="mt-0.5 font-medium text-foreground dark:text-stone-200">{transfer.to_warehouse?.name}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-xl border border-border/20 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">Activity</h2>
                        <dl className="space-y-3 text-sm">
                            {transfer.requestedBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Requested By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">{transfer.requestedBy.name}</dd>
                                </div>
                            )}
                            {transfer.approvedBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Approved By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">{transfer.approvedBy.name} {transfer.approved_at && <span className="text-xs text-muted-foreground">· {new Date(transfer.approved_at).toLocaleDateString()}</span>}</dd>
                                </div>
                            )}
                            {transfer.dispatchedBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Dispatched By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">{transfer.dispatchedBy.name} {transfer.dispatched_at && <span className="text-xs text-muted-foreground">· {new Date(transfer.dispatched_at).toLocaleDateString()}</span>}</dd>
                                </div>
                            )}
                            {transfer.receivedBy && (
                                <div>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-stone-500">Received By</dt>
                                    <dd className="mt-0.5 text-foreground dark:text-stone-200">{transfer.receivedBy.name} {transfer.received_at && <span className="text-xs text-muted-foreground">· {new Date(transfer.received_at).toLocaleDateString()}</span>}</dd>
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
