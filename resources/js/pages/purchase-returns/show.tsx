import { Head, Link, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    index as returnsIndex,
    edit as returnsEdit,
    destroy as returnsDestroy,
    post as returnsPost,
    cancel as returnsCancel,
} from '@/routes/purchase-returns';
import { cn } from '@/lib/utils';
import type { PurchaseReturn, PurchaseReturnStatus } from '@/types';

const STATUS_LABELS: Record<PurchaseReturnStatus, string> = {
    draft:     'Draft',
    posted:    'Posted',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<PurchaseReturnStatus, string> = {
    draft:     'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    posted:    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

type Props = { return: PurchaseReturn };

export default function PurchaseReturnsShow({ return: purchaseReturn }: Props) {
    const { confirm, dialog } = useConfirm();

    function handlePost() {
        confirm(
            `Post "${purchaseReturn.return_no}"? This will decrease inventory stock and cannot be undone.`,
            () => router.post(returnsPost.url(purchaseReturn), {}, { preserveScroll: true }),
            { title: 'Post Purchase Return', confirmLabel: 'Post', variant: 'danger' },
        );
    }

    function handleCancel() {
        confirm(
            `Cancel "${purchaseReturn.return_no}"? This action cannot be undone.`,
            () => router.post(returnsCancel.url(purchaseReturn), {}, { preserveScroll: true }),
            { title: 'Cancel Purchase Return', confirmLabel: 'Cancel', variant: 'danger' },
        );
    }

    function handleDelete() {
        confirm(
            `Delete "${purchaseReturn.return_no}"? This action cannot be undone.`,
            () => router.delete(returnsDestroy.url(purchaseReturn)),
            { title: 'Delete Purchase Return', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    const isDraft = purchaseReturn.status === 'draft';

    return (
        <>
            {dialog}
            <Head title={purchaseReturn.return_no} />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title={purchaseReturn.return_no}
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Purchase Returns', href: returnsIndex.url() },
                        { label: purchaseReturn.return_no },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            {isDraft && (
                                <Can permission="purchase-returns-post">
                                    <Button size="sm" variant="destructive" onClick={handlePost}>
                                        <span className="material-symbols-outlined text-base">undo</span>
                                        Post Return
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-returns-edit">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={returnsEdit.url(purchaseReturn)}>
                                            <span className="material-symbols-outlined text-base">edit</span>
                                            Edit
                                        </Link>
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-returns-edit">
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                        <span className="material-symbols-outlined text-base">cancel</span>
                                        Cancel
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-returns-delete">
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
                            <h3 className="mb-4 font-semibold">Return Information</h3>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Supplier</dt>
                                    <dd className="mt-0.5 font-medium">{purchaseReturn.supplier?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Warehouse</dt>
                                    <dd className="mt-0.5 font-medium">{purchaseReturn.warehouse?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Return Date</dt>
                                    <dd className="mt-0.5 font-medium">{purchaseReturn.return_date}</dd>
                                </div>
                                {purchaseReturn.purchaseReceive && (
                                    <div>
                                        <dt className="text-muted-foreground">Purchase Receive</dt>
                                        <dd className="mt-0.5 font-medium">{purchaseReturn.purchaseReceive.receive_no}</dd>
                                    </div>
                                )}
                                {purchaseReturn.purchaseInvoice && (
                                    <div>
                                        <dt className="text-muted-foreground">Purchase Invoice</dt>
                                        <dd className="mt-0.5 font-medium">{purchaseReturn.purchaseInvoice.invoice_no}</dd>
                                    </div>
                                )}
                                {purchaseReturn.postedBy && (
                                    <div>
                                        <dt className="text-muted-foreground">Posted By</dt>
                                        <dd className="mt-0.5 font-medium">{purchaseReturn.postedBy.name}</dd>
                                    </div>
                                )}
                                {purchaseReturn.posted_at && (
                                    <div>
                                        <dt className="text-muted-foreground">Posted At</dt>
                                        <dd className="mt-0.5 font-medium">{purchaseReturn.posted_at}</dd>
                                    </div>
                                )}
                                {purchaseReturn.reason && (
                                    <div className="col-span-2">
                                        <dt className="text-muted-foreground">Reason</dt>
                                        <dd className="mt-0.5 font-medium whitespace-pre-line">{purchaseReturn.reason}</dd>
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
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Batch</th>
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Unit</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Qty</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Unit Price</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Line Total</th>
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(purchaseReturn.items ?? []).map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3 font-medium">{item.ingredient?.name ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground">{item.batch?.batch_no ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground">{item.unit?.short_name ?? '—'}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.quantity).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.unit_price).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono font-medium">{Number(item.line_total).toFixed(2)}</td>
                                                <td className="py-3 text-muted-foreground">{item.reason ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <dl className="w-full max-w-xs space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Subtotal</dt>
                                        <dd className="font-mono">{Number(purchaseReturn.subtotal).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Tax</dt>
                                        <dd className="font-mono">{Number(purchaseReturn.tax_amount).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-2 font-semibold">
                                        <dt>Grand Total</dt>
                                        <dd className="font-mono">{Number(purchaseReturn.grand_total).toFixed(2)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Status</h3>
                            <span className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset',
                                STATUS_COLORS[purchaseReturn.status],
                            )}>
                                {STATUS_LABELS[purchaseReturn.status]}
                            </span>
                            {purchaseReturn.status === 'draft' && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Stock will be decreased when this return is posted.
                                </p>
                            )}
                            {purchaseReturn.status === 'posted' && (
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
                                    <dd className="font-medium">{(purchaseReturn.items ?? []).length}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Grand Total</dt>
                                    <dd className="font-mono font-medium">{Number(purchaseReturn.grand_total).toFixed(2)}</dd>
                                </div>
                                {purchaseReturn.createdBy && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Created By</dt>
                                        <dd className="font-medium">{purchaseReturn.createdBy.name}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
