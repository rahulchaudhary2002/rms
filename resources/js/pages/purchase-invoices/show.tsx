import { Head, Link, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    index as invoicesIndex,
    edit as invoicesEdit,
    destroy as invoicesDestroy,
    cancel as invoicesCancel,
} from '@/routes/purchase-invoices';
import { cn } from '@/lib/utils';
import type { PurchaseInvoice, PurchaseInvoiceStatus } from '@/types';

const STATUS_LABELS: Record<PurchaseInvoiceStatus, string> = {
    draft:          'Draft',
    unpaid:         'Unpaid',
    partially_paid: 'Partially Paid',
    paid:           'Paid',
    cancelled:      'Cancelled',
};

const STATUS_COLORS: Record<PurchaseInvoiceStatus, string> = {
    draft:          'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    unpaid:         'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
    partially_paid: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
    paid:           'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
    cancelled:      'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};

type Props = { invoice: PurchaseInvoice };

export default function PurchaseInvoicesShow({ invoice }: Props) {
    const { confirm, dialog } = useConfirm();

    function handleCancel() {
        confirm(
            `Cancel "${invoice.invoice_no}"? This action cannot be undone.`,
            () => router.post(invoicesCancel.url(invoice), {}, { preserveScroll: true }),
            { title: 'Cancel Invoice', confirmLabel: 'Cancel Invoice', variant: 'danger' },
        );
    }

    function handleDelete() {
        confirm(
            `Delete "${invoice.invoice_no}"? This action cannot be undone.`,
            () => router.delete(invoicesDestroy.url(invoice)),
            { title: 'Delete Invoice', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    const isDraft = invoice.status === 'draft';
    const isCancellable = invoice.status === 'unpaid' || invoice.status === 'partially_paid';

    return (
        <>
            {dialog}
            <Head title={invoice.invoice_no} />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title={invoice.invoice_no}
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Purchase Invoices', href: invoicesIndex.url() },
                        { label: invoice.invoice_no },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            {isDraft && (
                                <Can permission="purchase-invoices-edit">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={invoicesEdit.url(invoice)}>
                                            <span className="material-symbols-outlined text-base">edit</span>
                                            Edit
                                        </Link>
                                    </Button>
                                </Can>
                            )}
                            {isCancellable && (
                                <Can permission="purchase-invoices-edit">
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                        <span className="material-symbols-outlined text-base">cancel</span>
                                        Cancel Invoice
                                    </Button>
                                </Can>
                            )}
                            {isDraft && (
                                <Can permission="purchase-invoices-delete">
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
                            <h3 className="mb-4 font-semibold">Invoice Information</h3>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Supplier</dt>
                                    <dd className="mt-0.5 font-medium">{invoice.supplier?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Supplier Invoice No</dt>
                                    <dd className="mt-0.5 font-medium">{invoice.supplier_invoice_no ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Invoice Date</dt>
                                    <dd className="mt-0.5 font-medium">{invoice.invoice_date}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Due Date</dt>
                                    <dd className="mt-0.5 font-medium">{invoice.due_date ?? '—'}</dd>
                                </div>
                                {invoice.purchaseOrder && (
                                    <div>
                                        <dt className="text-muted-foreground">Purchase Order</dt>
                                        <dd className="mt-0.5 font-medium">{invoice.purchaseOrder.purchase_order_no}</dd>
                                    </div>
                                )}
                                {invoice.notes && (
                                    <div className="col-span-2">
                                        <dt className="text-muted-foreground">Notes</dt>
                                        <dd className="mt-0.5 font-medium whitespace-pre-line">{invoice.notes}</dd>
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
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Unit Price</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Discount</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Tax</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(invoice.items ?? []).map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-3 font-medium">{item.ingredient?.name ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground">{item.unit?.short_name ?? '—'}</td>
                                                <td className="py-3 text-right font-mono">{Number(item.quantity).toFixed(4)}</td>
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
                                        <dd className="font-mono">{Number(invoice.subtotal).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Discount</dt>
                                        <dd className="font-mono">−{Number(invoice.discount_amount).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Tax</dt>
                                        <dd className="font-mono">{Number(invoice.tax_amount).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Shipping</dt>
                                        <dd className="font-mono">{Number(invoice.shipping_amount).toFixed(2)}</dd>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-2 font-semibold">
                                        <dt>Grand Total</dt>
                                        <dd className="font-mono">{Number(invoice.grand_total).toFixed(2)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {(invoice.paymentAllocations ?? []).length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="mb-4 font-semibold">Payment History</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Payment No</th>
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Date</th>
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Method</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Allocated</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(invoice.paymentAllocations ?? []).map((alloc) => (
                                            <tr key={alloc.id}>
                                                <td className="py-3 font-medium">{alloc.payment?.payment_no ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground">{alloc.payment?.payment_date ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground capitalize">{alloc.payment?.payment_method ?? '—'}</td>
                                                <td className="py-3 text-right font-mono font-medium">{Number(alloc.allocated_amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Status</h3>
                            <span className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset',
                                STATUS_COLORS[invoice.status],
                            )}>
                                {STATUS_LABELS[invoice.status]}
                            </span>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Payment Summary</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Grand Total</dt>
                                    <dd className="font-mono font-medium">{Number(invoice.grand_total).toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Paid</dt>
                                    <dd className="font-mono text-emerald-600 dark:text-emerald-400">{Number(invoice.paid_amount).toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                                    <dt>Due</dt>
                                    <dd className={cn('font-mono', Number(invoice.due_amount) > 0 ? 'text-red-600 dark:text-red-400' : '')}>
                                        {Number(invoice.due_amount).toFixed(2)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
