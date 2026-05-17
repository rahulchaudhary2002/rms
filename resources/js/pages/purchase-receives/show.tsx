import { Head, Link, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    index as receivesIndex,
    edit as receivesEdit,
    destroy as receivesDestroy,
    post as receivesPost,
    cancel as receivesCancel,
} from '@/routes/purchase-receives';
import { cn } from '@/lib/utils';
import type { PurchaseReceive, PurchaseReceiveStatus } from '@/types';

const STATUS_LABELS: Record<PurchaseReceiveStatus, string> = {
    draft:     'Draft',
    posted:    'Posted',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<PurchaseReceiveStatus, string> = {
    draft:     'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    posted:    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

type Props = { receive: PurchaseReceive };

export default function PurchaseReceivesShow({ receive }: Props) {
    const { confirm, dialog } = useConfirm();

    function handlePost() {
        confirm(
            `Post "${receive.receive_no}"? This will update inventory stock and cannot be undone.`,
            () => router.post(receivesPost.url(receive), {}, { preserveScroll: true }),
            { title: 'Post Purchase Receive', confirmLabel: 'Post' },
        );
    }

    function handleCancel() {
        confirm(
            `Cancel "${receive.receive_no}"? This action cannot be undone.`,
            () => router.post(receivesCancel.url(receive), {}, { preserveScroll: true }),
            { title: 'Cancel Purchase Receive', confirmLabel: 'Cancel', variant: 'danger' },
        );
    }

    function handleDelete() {
        confirm(
            `Delete "${receive.receive_no}"? This action cannot be undone.`,
            () => router.delete(receivesDestroy.url(receive)),
            { title: 'Delete Purchase Receive', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    const isDraft = receive.status === 'draft';

    return (
        <>
            {dialog}
            <Head title={receive.receive_no} />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title={receive.receive_no}
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Purchase Receives', href: receivesIndex.url() },
                        { label: receive.receive_no },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            {isDraft && (
                                <Can permission="purchase-receives-post">
                                    <Button size="sm" onClick={handlePost}>
                                        <span className="material-symbols-outlined text-base">inventory</span>
                                        Post to Inventory
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-receives-edit">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={receivesEdit.url(receive)}>
                                            <span className="material-symbols-outlined text-base">edit</span>
                                            Edit
                                        </Link>
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-receives-edit">
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                        <span className="material-symbols-outlined text-base">cancel</span>
                                        Cancel
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-receives-delete">
                                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                                        <span className="material-symbols-outlined text-base">delete</span>
                                        Delete
                                    </Button>
                                </Can>
                            )}
                        </div>
                    }
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Receive Information</h3>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Supplier</dt>
                                    <dd className="mt-0.5 font-medium">{receive.supplier?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Warehouse</dt>
                                    <dd className="mt-0.5 font-medium">{receive.warehouse?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Received Date</dt>
                                    <dd className="mt-0.5 font-medium">{receive.received_date}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Purchase Order</dt>
                                    <dd className="mt-0.5 font-medium">{receive.purchaseOrder?.purchase_order_no ?? '—'}</dd>
                                </div>
                                {receive.receivedBy && (
                                    <div>
                                        <dt className="text-muted-foreground">Received By</dt>
                                        <dd className="mt-0.5 font-medium">{receive.receivedBy.name}</dd>
                                    </div>
                                )}
                                {receive.postedBy && (
                                    <div>
                                        <dt className="text-muted-foreground">Posted By</dt>
                                        <dd className="mt-0.5 font-medium">{receive.postedBy.name}</dd>
                                    </div>
                                )}
                                {receive.posted_at && (
                                    <div>
                                        <dt className="text-muted-foreground">Posted At</dt>
                                        <dd className="mt-0.5 font-medium">{receive.posted_at}</dd>
                                    </div>
                                )}
                                {receive.notes && (
                                    <div className="col-span-2">
                                        <dt className="text-muted-foreground">Notes</dt>
                                        <dd className="mt-0.5 font-medium whitespace-pre-line">{receive.notes}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Items</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Ingredient</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Ordered</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Received</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Rejected</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Accepted</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Unit Price</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Line Total</th>
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Batch</th>
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(receive.items ?? []).map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3 font-medium">{item.ingredient?.name ?? '—'}</td>
                                                <td className="py-3 text-right font-mono text-muted-foreground">{Number(item.ordered_quantity).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.received_quantity).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono text-red-600 dark:text-red-400">{Number(item.rejected_quantity).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono font-medium">{Number(item.accepted_quantity).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.unit_price).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono font-medium">{Number(item.line_total).toFixed(2)}</td>
                                                <td className="py-3 text-muted-foreground">{item.batch_no ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground">{item.expiry_date ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Status</h3>
                            <span className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset',
                                STATUS_COLORS[receive.status],
                            )}>
                                {STATUS_LABELS[receive.status]}
                            </span>
                            {receive.status === 'draft' && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Stock will be updated when this receive is posted.
                                </p>
                            )}
                            {receive.status === 'posted' && (
                                <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                                    Inventory has been updated.
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Summary</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Items</dt>
                                    <dd className="font-medium">{(receive.items ?? []).length}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
