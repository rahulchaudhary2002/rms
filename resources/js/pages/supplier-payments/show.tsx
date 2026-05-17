import { Head, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    index as paymentsIndex,
    destroy as paymentsDestroy,
} from '@/routes/supplier-payments';
import type { PaymentMethod, SupplierPayment } from '@/types';

const METHOD_LABELS: Record<PaymentMethod, string> = {
    cash:   'Cash',
    bank:   'Bank Transfer',
    cheque: 'Cheque',
    online: 'Online',
    credit: 'Credit',
    other:  'Other',
};

type Props = { payment: SupplierPayment };

export default function SupplierPaymentsShow({ payment }: Props) {
    const { confirm, dialog } = useConfirm();

    function handleDelete() {
        confirm(
            `Delete "${payment.payment_no}"? This will reverse all invoice allocations and cannot be undone.`,
            () => router.delete(paymentsDestroy.url(payment)),
            { title: 'Delete Payment', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    return (
        <>
            {dialog}
            <Head title={payment.payment_no} />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title={payment.payment_no}
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Supplier Payments', href: paymentsIndex.url() },
                        { label: payment.payment_no },
                    ]}
                    actions={
                        <Can permission="supplier-payments-delete">
                            <Button variant="destructive" size="sm" onClick={handleDelete}>
                                <span className="material-symbols-outlined text-base">delete</span>
                                Delete
                            </Button>
                        </Can>
                    }
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Payment Information</h3>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Supplier</dt>
                                    <dd className="mt-0.5 font-medium">{payment.supplier?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Payment Date</dt>
                                    <dd className="mt-0.5 font-medium">{payment.payment_date}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Payment Method</dt>
                                    <dd className="mt-0.5 font-medium">{METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Reference No</dt>
                                    <dd className="mt-0.5 font-medium">{payment.reference_no ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Amount</dt>
                                    <dd className="mt-0.5 font-mono font-semibold text-lg">{Number(payment.amount).toFixed(2)}</dd>
                                </div>
                                {payment.notes && (
                                    <div className="col-span-2">
                                        <dt className="text-muted-foreground">Notes</dt>
                                        <dd className="mt-0.5 font-medium whitespace-pre-line">{payment.notes}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {(payment.allocations ?? []).length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="mb-4 font-semibold">Invoice Allocations</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Invoice No</th>
                                            <th className="pb-3 text-left font-medium text-muted-foreground">Invoice Date</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Invoice Total</th>
                                            <th className="pb-3 text-right font-medium text-muted-foreground">Allocated</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(payment.allocations ?? []).map((alloc) => (
                                            <tr key={alloc.id}>
                                                <td className="py-3 font-medium">{alloc.invoice?.invoice_no ?? '—'}</td>
                                                <td className="py-3 text-muted-foreground">{alloc.invoice?.invoice_date ?? '—'}</td>
                                                <td className="py-3 text-right font-mono">{alloc.invoice ? Number(alloc.invoice.grand_total).toFixed(2) : '—'}</td>
                                                <td className="py-3 text-right font-mono font-medium">{Number(alloc.allocated_amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-border">
                                            <td colSpan={3} className="pt-3 text-right text-sm font-semibold">Total Allocated</td>
                                            <td className="pt-3 text-right font-mono font-semibold">
                                                {(payment.allocations ?? []).reduce((sum, a) => sum + Number(a.allocated_amount), 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Summary</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Payment Amount</dt>
                                    <dd className="font-mono font-medium">{Number(payment.amount).toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Invoices Covered</dt>
                                    <dd className="font-medium">{(payment.allocations ?? []).length}</dd>
                                </div>
                                {payment.createdBy && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Created By</dt>
                                        <dd className="font-medium">{payment.createdBy.name}</dd>
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
