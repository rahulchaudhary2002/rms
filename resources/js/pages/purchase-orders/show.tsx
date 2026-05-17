import { Head, Link, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    index as ordersIndex,
    edit as ordersEdit,
    destroy as ordersDestroy,
    approve as ordersApprove,
    cancel as ordersCancel,
} from '@/routes/purchase-orders';
import { create as receivesCreate } from '@/routes/purchase-receives';
import { cn } from '@/lib/utils';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
    draft:              'Draft',
    ordered:            'Ordered',
    partially_received: 'Partially Received',
    received:           'Received',
    cancelled:          'Cancelled',
    closed:             'Closed',
};

const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
    draft:              'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    ordered:            'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800',
    partially_received: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
    received:           'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled:          'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
    closed:             'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};

type Props = { order: PurchaseOrder };

export default function PurchaseOrdersShow({ order }: Props) {
    const { confirm, dialog } = useConfirm();

    function handleApprove() {
        confirm(
            `Approve "${order.purchase_order_no}"? This will mark the order as Ordered and lock editing.`,
            () => router.post(ordersApprove.url(order), {}, { preserveScroll: true }),
            { title: 'Approve Purchase Order', confirmLabel: 'Approve' },
        );
    }

    function handleCancel() {
        confirm(
            `Cancel "${order.purchase_order_no}"? This action cannot be undone.`,
            () => router.post(ordersCancel.url(order), {}, { preserveScroll: true }),
            { title: 'Cancel Purchase Order', confirmLabel: 'Cancel Order', variant: 'danger' },
        );
    }

    function handleDelete() {
        confirm(
            `Delete "${order.purchase_order_no}"? This action cannot be undone.`,
            () => router.delete(ordersDestroy.url(order)),
            { title: 'Delete Purchase Order', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    const isDraft = order.status === 'draft';
    const isCancellable = order.status === 'draft' || order.status === 'ordered';
    const canReceive = order.status === 'ordered' || order.status === 'partially_received';

    return (
        <>
            {dialog}
            <Head title={order.purchase_order_no} />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title={order.purchase_order_no}
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Purchase Orders', href: ordersIndex.url() },
                        { label: order.purchase_order_no },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            {isDraft && (
                                <Can permission="purchase-orders-approve">
                                    <Button size="sm" onClick={handleApprove}>
                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                        Approve
                                    </Button>
                                </Can>
                            )}
                            {canReceive && (
                                <Can permission="purchase-receives-create">
                                    <Button size="sm" asChild>
                                        <Link href={receivesCreate.url({ query: { purchase_order_id: order.id } })}>
                                            <span className="material-symbols-outlined text-base">inventory</span>
                                            Receive
                                        </Link>
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-orders-edit">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={ordersEdit.url(order)}>
                                            <span className="material-symbols-outlined text-base">edit</span>
                                            Edit
                                        </Link>
                                    </Button>
                                </Can>
                            )}
                            {isCancellable && (
                                <Can permission="purchase-orders-edit">
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                        <span className="material-symbols-outlined text-base">cancel</span>
                                        Cancel Order
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-orders-delete">
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
                            <h3 className="mb-4 font-semibold">Order Information</h3>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Supplier</dt>
                                    <dd className="mt-0.5 font-medium">{order.supplier?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Warehouse</dt>
                                    <dd className="mt-0.5 font-medium">{order.warehouse?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Order Date</dt>
                                    <dd className="mt-0.5 font-medium">{order.order_date}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Expected Delivery</dt>
                                    <dd className="mt-0.5 font-medium">{order.expected_delivery_date ?? '—'}</dd>
                                </div>
                                {order.approvedBy && (
                                    <div>
                                        <dt className="text-muted-foreground">Approved By</dt>
                                        <dd className="mt-0.5 font-medium">{order.approvedBy.name}</dd>
                                    </div>
                                )}
                                {order.approved_at && (
                                    <div>
                                        <dt className="text-muted-foreground">Approved At</dt>
                                        <dd className="mt-0.5 font-medium">{order.approved_at}</dd>
                                    </div>
                                )}
                                {order.notes && (
                                    <div className="col-span-2">
                                        <dt className="text-muted-foreground">Notes</dt>
                                        <dd className="mt-0.5 font-medium whitespace-pre-line">{order.notes}</dd>
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
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Unit</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Qty</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Received</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Unit Price</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Discount</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Tax</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(order.items ?? []).map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3 font-medium">{item.ingredient?.name ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground">{item.unit?.short_name ?? '—'}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.quantity).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.received_quantity).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.unit_price).toFixed(4)}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.discount_amount).toFixed(2)}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.tax_amount).toFixed(2)}</td>
                                                <td className="py-3 text-right font-mono font-medium">{Number(item.line_total).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <dl className="w-full max-w-xs space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Subtotal</dt>
                                        <dd className="font-mono">{Number(order.subtotal).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Discount</dt>
                                        <dd className="font-mono">−{Number(order.discount_amount).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Tax</dt>
                                        <dd className="font-mono">{Number(order.tax_amount).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Shipping</dt>
                                        <dd className="font-mono">{Number(order.shipping_amount).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-2 font-semibold">
                                        <dt>Grand Total</dt>
                                        <dd className="font-mono">{Number(order.grand_total).toFixed(2)}</dd>
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
                                STATUS_COLORS[order.status],
                            )}>
                                {STATUS_LABELS[order.status]}
                            </span>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Summary</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Items</dt>
                                    <dd className="font-medium">{(order.items ?? []).length}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Grand Total</dt>
                                    <dd className="font-mono font-medium">{Number(order.grand_total).toFixed(2)}</dd>
                                </div>
                                {order.createdBy && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Created By</dt>
                                        <dd className="font-medium">{order.createdBy.name}</dd>
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
