<?php

namespace App\Services\Purchase;

use App\Models\PurchaseInvoice;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Services\Concerns\PaginatesQuery;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SupplierPaymentService
{
    use PaginatesQuery;

    public function getIndexData(array $filters): array
    {
        $query = SupplierPayment::with(['supplier', 'createdBy', 'allocations'])
            ->when($filters['search'] !== '', function ($b) use ($filters) {
                $search = '%' . $filters['search'] . '%';
                $b->where('payment_no', 'like', $search);
            })
            ->when($filters['supplier_id'] !== '', fn ($b) => $b->where('supplier_id', $filters['supplier_id']))
            ->when($filters['payment_method'] !== '', fn ($b) => $b->where('payment_method', $filters['payment_method']))
            ->orderByDesc('payment_date')
            ->orderByDesc('id');

        $payments  = $query->paginate($this->perPage($query, $filters['per_page']))->withQueryString();
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('payments', 'suppliers', 'filters');
    }

    public function getCreateData(): array
    {
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return compact('suppliers');
    }

    public function getInvoicesForSupplier(int $supplierId): array
    {
        return PurchaseInvoice::where('supplier_id', $supplierId)
            ->whereIn('status', ['unpaid', 'partially_paid'])
            ->orderByDesc('invoice_date')
            ->get(['id', 'invoice_no', 'grand_total', 'paid_amount', 'due_amount', 'invoice_date'])
            ->toArray();
    }

    public function getShowData(SupplierPayment $payment): array
    {
        $payment->load(['supplier', 'allocations.invoice', 'createdBy']);

        return compact('payment');
    }

    public function createPayment(array $data, int $userId): SupplierPayment
    {
        return DB::transaction(function () use ($data, $userId) {
            $allocations     = array_values(array_filter($data['allocations'] ?? [], fn ($allocation) => (float) ($allocation['allocated_amount'] ?? 0) > 0));
            $totalAllocated  = array_sum(array_map(fn ($allocation) => (float) $allocation['allocated_amount'], $allocations));
            $paymentAmount   = (float) $data['amount'];

            if ($totalAllocated <= 0 || count($allocations) === 0) {
                throw new RuntimeException('Allocate the payment to at least one invoice.');
            }

            if ($totalAllocated > $paymentAmount + 0.0001) {
                throw new RuntimeException('Total allocated amount cannot exceed payment amount.');
            }

            $payment = SupplierPayment::create([
                'supplier_id'    => $data['supplier_id'],
                'payment_no'     => $this->generatePaymentNo(),
                'payment_date'   => $data['payment_date'],
                'payment_method' => $data['payment_method'],
                'reference_no'   => $data['reference_no'] ?? null,
                'amount'         => $paymentAmount,
                'notes'          => $data['notes'] ?? null,
                'created_by'     => $userId,
            ]);

            foreach ($allocations as $allocation) {
                $amount  = (float) $allocation['allocated_amount'];
                if ($amount <= 0) {
                    continue;
                }

                $invoice = PurchaseInvoice::where('supplier_id', $data['supplier_id'])
                    ->whereIn('status', ['unpaid', 'partially_paid'])
                    ->lockForUpdate()
                    ->find($allocation['purchase_invoice_id']);
                if (! $invoice) {
                    throw new RuntimeException('Selected invoice is not outstanding for this supplier.');
                }

                $dueAmount = (float) $invoice->due_amount;
                if ($amount > $dueAmount + 0.0001) {
                    throw new RuntimeException("Allocation for invoice {$invoice->invoice_no} exceeds its due amount.");
                }

                $payment->allocations()->create([
                    'purchase_invoice_id' => $invoice->id,
                    'allocated_amount'    => $amount,
                ]);

                $newPaid = (float) $invoice->paid_amount + $amount;
                $invoice->update(['paid_amount' => $newPaid]);

                app(PurchaseInvoiceService::class)->resolveStatus($invoice);
            }

            return $payment;
        });
    }

    public function deletePayment(SupplierPayment $payment): void
    {
        DB::transaction(function () use ($payment) {
            foreach ($payment->allocations as $allocation) {
                $invoice = $allocation->invoice;
                if ($invoice) {
                    $newPaid = max(0, (float) $invoice->paid_amount - (float) $allocation->allocated_amount);
                    $invoice->update(['paid_amount' => $newPaid]);
                    app(PurchaseInvoiceService::class)->resolveStatus($invoice);
                }
            }

            $payment->allocations()->delete();
            $payment->delete();
        });
    }

    private function generatePaymentNo(): string
    {
        $last = SupplierPayment::withTrashed()->orderByDesc('id')->value('payment_no');
        $seq  = $last ? ((int) substr($last, -6)) + 1 : 1;

        return 'PAY-' . date('Ymd') . '-' . str_pad($seq, 6, '0', STR_PAD_LEFT);
    }
}
