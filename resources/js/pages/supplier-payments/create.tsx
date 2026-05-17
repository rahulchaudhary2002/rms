import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { FormSection } from '@/components/form-section';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import {
    index as paymentsIndex,
    store as paymentsStore,
    invoices as paymentsInvoices,
} from '@/routes/supplier-payments';
import type { PaymentMethod, PurchaseInvoice, Supplier } from '@/types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'cash',   label: 'Cash' },
    { value: 'bank',   label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online' },
    { value: 'credit', label: 'Credit' },
    { value: 'other',  label: 'Other' },
];

type Props = {
    suppliers: Pick<Supplier, 'id' | 'name'>[];
};

type AllocationRow = {
    purchase_invoice_id: string;
    allocated_amount:    string;
};

type InvoiceOption = Pick<PurchaseInvoice, 'id' | 'invoice_no' | 'due_amount' | 'grand_total'> & { supplier_invoice_no?: string | null };

export default function SupplierPaymentsCreate({ suppliers }: Props) {
    const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
    const [allocations, setAllocations] = useState<AllocationRow[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        supplier_id:    '',
        payment_date:   new Date().toISOString().slice(0, 10),
        payment_method: 'cash' as PaymentMethod,
        reference_no:   '',
        amount:         '',
        notes:          '',
        allocations:    allocations,
    });

    function handleSupplierChange(supplierId: string) {
        setData('supplier_id', supplierId);
        setAllocations([]);
        setData('allocations', []);
        setInvoices([]);
        if (!supplierId) return;

        setLoadingInvoices(true);
        fetch(paymentsInvoices.url({ query: { supplier_id: supplierId } }))
            .then((res) => res.json())
            .then((list: InvoiceOption[]) => {
                setInvoices(list);
                setLoadingInvoices(false);
            })
            .catch(() => setLoadingInvoices(false));
    }

    function updateAllocation(invoiceId: string, amount: string) {
        const existing = allocations.find((a) => a.purchase_invoice_id === invoiceId);
        let next: AllocationRow[];
        if (amount === '' || parseFloat(amount) === 0) {
            next = allocations.filter((a) => a.purchase_invoice_id !== invoiceId);
        } else if (existing) {
            next = allocations.map((a) => a.purchase_invoice_id === invoiceId ? { ...a, allocated_amount: amount } : a);
        } else {
            next = [...allocations, { purchase_invoice_id: invoiceId, allocated_amount: amount }];
        }
        setAllocations(next);
        setData('allocations', next);
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + (parseFloat(a.allocated_amount) || 0), 0);
    const paymentAmount  = parseFloat(data.amount) || 0;
    const unallocated    = paymentAmount - totalAllocated;
    const canSubmit      = !processing && paymentAmount > 0 && totalAllocated > 0;
    const formErrors     = errors as Record<string, string | undefined>;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(paymentsStore.url());
    }

    return (
        <>
            <Head title="New Supplier Payment" />
            <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Supplier Payments', href: paymentsIndex.url() },
                        { label: 'New Payment' },
                    ]}
                    title="New Supplier Payment"
                    description="Record a payment to a supplier."
                />

                <form onSubmit={submit} className="space-y-8 pb-6">
                    <FormSection title="Payment Details" description="Enter payment method, amount, and date.">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <FormField label="Supplier" required error={errors.supplier_id}>
                                <SearchableSelect
                                    value={data.supplier_id}
                                    onChange={(e) => handleSupplierChange(e.target.value)}
                                >
                                    <option value="">Select supplier…</option>
                                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Payment Date" required error={errors.payment_date}>
                                <Input type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} />
                            </FormField>
                            <FormField label="Payment Method" required error={errors.payment_method}>
                                <SearchableSelect
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value as PaymentMethod)}
                                >
                                    {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </SearchableSelect>
                            </FormField>
                            <FormField label="Reference No" error={errors.reference_no}>
                                <Input value={data.reference_no} onChange={(e) => setData('reference_no', e.target.value)} placeholder="Cheque / transaction reference" />
                            </FormField>
                            <FormField label="Amount" required error={errors.amount}>
                                <Input
                                    type="number" min="0.01" step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="0.00"
                                    className="font-mono text-right"
                                />
                            </FormField>
                            <FormField label="Notes" error={errors.notes}>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Optional notes…"
                                    className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    <FormSection title="Allocate to Invoices" description="Apply payment to unpaid supplier invoices.">
                        {formErrors.payment && (
                            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300">
                                {formErrors.payment}
                            </p>
                        )}
                        {formErrors.allocations && (
                            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300">
                                {formErrors.allocations}
                            </p>
                        )}
                        {!data.supplier_id ? (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
                                Select a supplier to load outstanding invoices.
                            </p>
                        ) : loadingInvoices ? (
                            <p className="text-sm text-muted-foreground">Loading invoices…</p>
                        ) : invoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No outstanding invoices for this supplier.</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="pb-3 text-left font-medium text-muted-foreground">Invoice No</th>
                                                <th className="pb-3 text-left font-medium text-muted-foreground">Supplier Ref</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Total</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Due</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Allocate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {invoices.map((inv) => {
                                                const alloc = allocations.find((a) => a.purchase_invoice_id === String(inv.id));
                                                return (
                                                    <tr key={inv.id}>
                                                        <td className="py-3 font-medium">{inv.invoice_no}</td>
                                                        <td className="py-3 text-muted-foreground">{inv.supplier_invoice_no ?? '—'}</td>
                                                        <td className="py-3 text-right font-mono">{Number(inv.grand_total).toFixed(2)}</td>
                                                        <td className="py-3 text-right font-mono text-red-600 dark:text-red-400">{Number(inv.due_amount).toFixed(2)}</td>
                                                        <td className="py-3 text-right">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={Number(inv.due_amount).toFixed(2)}
                                                                step="0.01"
                                                                value={alloc?.allocated_amount ?? ''}
                                                                onChange={(e) => updateAllocation(String(inv.id), e.target.value)}
                                                                placeholder="0.00"
                                                                className="w-28 font-mono text-right"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end">
                                    <dl className="w-full max-w-xs space-y-1.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">Payment Amount</dt>
                                            <dd className="font-mono font-medium">{paymentAmount.toFixed(2)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">Total Allocated</dt>
                                            <dd className="font-mono">{totalAllocated.toFixed(2)}</dd>
                                        </div>
                                        <div className={`flex justify-between border-t border-border pt-2 font-semibold ${unallocated < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                            <dt>Unallocated</dt>
                                            <dd className="font-mono">{unallocated.toFixed(2)}</dd>
                                        </div>
                                    </dl>
                                </div>

                            </div>
                        )}
                    </FormSection>

                    <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                        <span className="hidden text-sm text-muted-foreground italic sm:inline">Unsaved changes will be lost.</span>
                        <Link href={paymentsIndex.url()} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            Discard Draft
                        </Link>
                        <button type="submit" disabled={!canSubmit} className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                            {processing ? 'Saving…' : 'Record Payment'}
                        </button>
                    </div>
            </form>
        </>
    );
}
