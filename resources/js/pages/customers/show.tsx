import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import {
    edit as customersEdit,
    index as customersIndex,
} from '@/routes/customers';
import type { Customer, CustomerOutlet } from '@/types';

type Props = { customer: Customer };

function formatDateTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                {label}
            </p>
            <div className="mt-2 text-sm font-semibold text-foreground">
                {value || '-'}
            </div>
        </div>
    );
}

function OutletRow({ item }: { item: CustomerOutlet }) {
    return (
        <tr className="transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
            <td className="px-6 py-4 font-semibold text-foreground">
                {item.outlet?.name ?? `Outlet #${item.outlet_id}`}
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
                {formatDateTime(item.first_visited_at)}
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
                {formatDateTime(item.last_visited_at)}
            </td>
            <td className="px-6 py-4 text-sm font-semibold text-foreground">
                {item.visit_count}
            </td>
            <td className="px-6 py-4">
                <span
                    className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
                        item.is_favorite_outlet
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                    )}
                >
                    {item.is_favorite_outlet ? 'Favorite' : 'Regular'}
                </span>
            </td>
        </tr>
    );
}

export default function CustomersShow({ customer }: Props) {
    const outletVisits = customer.customer_outlets ?? [];

    return (
        <>
            <Head title={customer.name} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Customers', href: customersIndex.url() },
                    { label: customer.name },
                ]}
                title={customer.name}
                description="Global customer profile and outlet visit summary."
                actions={
                    <Link
                        href={customersEdit.url(customer.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            edit
                        </span>
                        Edit Customer
                    </Link>
                }
            />

            <div className="space-y-6 pb-6">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <DetailItem label="Phone" value={customer.phone} />
                    <DetailItem label="Email" value={customer.email} />
                    <DetailItem
                        label="Status"
                        value={
                            <span
                                className={cn(
                                    'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                    customer.is_active
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                )}
                            >
                                {customer.is_active ? 'Active' : 'Inactive'}
                            </span>
                        }
                    />
                    <DetailItem
                        label="Outlets Visited"
                        value={
                            customer.customer_outlets_count ??
                            outletVisits.length
                        }
                    />
                    <DetailItem label="Address" value={customer.address} />
                </section>

                <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-6 py-4">
                        <h2 className="text-sm font-bold text-foreground">
                            Outlet Visit Summary
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Outlet-wise customer analytics are tracked here for
                            future reporting.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left">
                            <thead>
                                <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                    <th className="border-b border-border/10 px-6 py-4">
                                        Outlet
                                    </th>
                                    <th className="border-b border-border/10 px-6 py-4">
                                        First Visit
                                    </th>
                                    <th className="border-b border-border/10 px-6 py-4">
                                        Last Visit
                                    </th>
                                    <th className="border-b border-border/10 px-6 py-4">
                                        Visits
                                    </th>
                                    <th className="border-b border-border/10 px-6 py-4">
                                        Type
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted dark:divide-stone-800">
                                {outletVisits.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-sm text-muted-foreground"
                                        >
                                            No outlet visits recorded.
                                        </td>
                                    </tr>
                                )}
                                {outletVisits.map((item) => (
                                    <OutletRow key={item.id} item={item} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}
