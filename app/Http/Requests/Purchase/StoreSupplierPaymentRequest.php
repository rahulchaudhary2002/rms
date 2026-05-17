<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id'                            => ['required', 'exists:suppliers,id'],
            'payment_date'                           => ['required', 'date'],
            'payment_method'                         => ['required', 'in:cash,bank,cheque,online,credit,other'],
            'reference_no'                           => ['nullable', 'string', 'max:100'],
            'amount'                                 => ['required', 'numeric', 'min:0.0001'],
            'notes'                                  => ['nullable', 'string'],
            'allocations'                            => ['required', 'array', 'min:1'],
            'allocations.*.purchase_invoice_id'      => ['required', 'exists:purchase_invoices,id'],
            'allocations.*.allocated_amount'         => ['required', 'numeric', 'min:0.0001'],
        ];
    }

    public function messages(): array
    {
        return [
            'allocations.required' => 'Allocate the payment to at least one invoice.',
            'allocations.min'      => 'Allocate the payment to at least one invoice.',
        ];
    }
}
