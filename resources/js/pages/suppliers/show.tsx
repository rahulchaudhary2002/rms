import { Head, Link, router } from '@inertiajs/react';
import { useConfirm } from '@/hooks/use-confirm';
import { PageHeader } from '@/components/page-header';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index as suppliersIndex, edit as suppliersEdit, destroy as suppliersDestroy, toggleActive as suppliersToggleActive } from '@/routes/suppliers';
import { cn } from '@/lib/utils';
import type { Supplier } from '@/types';

type Props = { supplier: Supplier };

export default function SuppliersShow({ supplier }: Props) {
    const { confirm, dialog } = useConfirm();

    function handleToggleActive() {
        const label = supplier.is_active ? 'deactivate' : 'activate';
        confirm(
            `Are you sure you want to ${label} "${supplier.name}"?`,
            () => router.patch(suppliersToggleActive.url(supplier), { is_active: !supplier.is_active }, { preserveScroll: true }),
            { title: `${supplier.is_active ? 'Deactivate' : 'Activate'} Supplier`, confirmLabel: supplier.is_active ? 'Deactivate' : 'Activate', variant: supplier.is_active ? 'danger' : 'default' },
        );
    }

    function handleDelete() {
        confirm(
            `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
            () => router.delete(suppliersDestroy.url(supplier)),
            { title: 'Delete Supplier', confirmLabel: 'Delete', variant: 'danger' },
        );
    }

    return (
        <>
            {dialog}
            <Head title={supplier.name} />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title={supplier.name}
                    breadcrumbs={[
                        { label: 'Dashboard', href: dashboard.url() },
                        { label: 'Suppliers', href: suppliersIndex.url() },
                        { label: supplier.name },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Can permission="suppliers-edit">
                                <Button variant="outline" size="sm" onClick={handleToggleActive}>
                                    <span className="material-symbols-outlined text-base">{supplier.is_active ? 'toggle_off' : 'toggle_on'}</span>
                                    {supplier.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={suppliersEdit.url(supplier)}>
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        Edit
                                    </Link>
                                </Button>
                            </Can>
                            <Can permission="suppliers-delete">
                                <Button variant="destructive" size="sm" onClick={handleDelete}>
                                    <span className="material-symbols-outlined text-base">delete</span>
                                    Delete
                                </Button>
                            </Can>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Supplier Information</h3>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Code</dt>
                                    <dd className="mt-0.5 font-medium">{supplier.code ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Contact Person</dt>
                                    <dd className="mt-0.5 font-medium">{supplier.contact_person ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Phone</dt>
                                    <dd className="mt-0.5 font-medium">{supplier.phone ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Email</dt>
                                    <dd className="mt-0.5 font-medium">{supplier.email ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">PAN / VAT No.</dt>
                                    <dd className="mt-0.5 font-medium">{supplier.pan_vat_no ?? '—'}</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="text-muted-foreground">Address</dt>
                                    <dd className="mt-0.5 font-medium whitespace-pre-line">{supplier.address ?? '—'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-semibold">Status</h3>
                            <span className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset',
                                supplier.is_active
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800'
                                    : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
                            )}>
                                {supplier.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
