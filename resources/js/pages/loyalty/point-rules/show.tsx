import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit as rulesEdit, index as rulesIndex } from '@/routes/loyalty-point-rules';
import type { LoyaltyPointRule, LoyaltyPointRuleSlab } from '@/types';

type Props = {
    rule: LoyaltyPointRule & { slabs: LoyaltyPointRuleSlab[] };
};

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-1 text-[11px] font-bold tracking-wider text-muted-foreground/60 uppercase">{label}</p>
            <div className="text-sm font-semibold text-foreground">
                {value ?? <span className="text-muted-foreground">—</span>}
            </div>
        </div>
    );
}

function TypeBadge({ type }: { type: LoyaltyPointRule['type'] }) {
    const styles = {
        global: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
        outlet: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        campaign: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return (
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase', styles[type])}>
            {type}
        </span>
    );
}

function CalculationExample({ rule }: { rule: LoyaltyPointRule & { slabs: LoyaltyPointRuleSlab[] } }) {
    if (rule.earning_type === 'fixed_rate') {
        const amount = 450;
        const earnAmount = parseFloat(rule.earn_amount ?? '1');
        const earnPoints = rule.earn_points ?? 0;
        const points = Math.floor(amount / earnAmount) * earnPoints;

        return (
            <div className="rounded-xl border border-border bg-muted/30 p-5 dark:bg-stone-800/30">
                <h4 className="mb-3 text-sm font-bold text-foreground">Calculation Example</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        Bill amount: <span className="font-semibold text-foreground">Rs. {amount}</span>
                    </p>
                    <p className="font-mono text-xs bg-muted rounded px-3 py-2 dark:bg-stone-900">
                        floor({amount} / {earnAmount}) × {earnPoints} = <span className="font-bold text-primary">{points} points</span>
                    </p>
                    <p className="text-xs">
                        Every Rs.&nbsp;{rule.earn_amount} spent earns {rule.earn_points} point{(rule.earn_points ?? 1) !== 1 ? 's' : ''}.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-muted/30 p-5 dark:bg-stone-800/30">
            <h4 className="mb-3 text-sm font-bold text-foreground">Calculation Example</h4>
            <p className="text-sm text-muted-foreground">
                The bill amount is matched against active slabs below. The matching slab's points are awarded. If no slab matches, 0 points are earned.
            </p>
        </div>
    );
}

export default function LoyaltyPointRulesShow({ rule }: Props) {
    const slabs = rule.slabs ?? [];

    return (
        <>
            <Head title={rule.name} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Loyalty Point Rules', href: rulesIndex.url() },
                    { label: rule.name },
                ]}
                title={rule.name}
                description="Loyalty point rule details and earning configuration."
                actions={
                    <Link
                        href={rulesEdit.url(rule.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit Rule
                    </Link>
                }
            />

            <div className="space-y-6 pb-6">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <DetailItem
                        label="Type"
                        value={<TypeBadge type={rule.type} />}
                    />
                    <DetailItem label="Outlet" value={rule.outlet?.name} />
                    <DetailItem
                        label="Status"
                        value={
                            <span
                                className={cn(
                                    'inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                                    rule.is_active
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                )}
                            >
                                {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                        }
                    />
                    <DetailItem label="Priority" value={rule.priority} />
                    <DetailItem
                        label="Earning Type"
                        value={rule.earning_type === 'fixed_rate' ? 'Fixed Rate' : 'Fixed Slab'}
                    />
                    {rule.earning_type === 'fixed_rate' && (
                        <DetailItem
                            label="Earning Rule"
                            value={`Rs. ${rule.earn_amount} = ${rule.earn_points} point${(rule.earn_points ?? 1) !== 1 ? 's' : ''}`}
                        />
                    )}
                    <DetailItem
                        label="Point Redeem Value"
                        value={`1 point = Rs. ${rule.redeem_point_value}`}
                    />
                    <DetailItem
                        label="Min Redeem Points"
                        value={rule.minimum_redeem_points}
                    />
                    <DetailItem
                        label="Max Redeem Points"
                        value={rule.maximum_redeem_points}
                    />
                    <DetailItem
                        label="Max Redeem %"
                        value={rule.maximum_redeem_percent ? `${rule.maximum_redeem_percent}%` : undefined}
                    />
                    <DetailItem
                        label="Points Expiry"
                        value={rule.points_expiry_days ? `${rule.points_expiry_days} days` : 'Never'}
                    />
                    {rule.type === 'campaign' && (
                        <DetailItem
                            label="Campaign Dates"
                            value={rule.starts_at && rule.ends_at ? `${rule.starts_at} – ${rule.ends_at}` : '—'}
                        />
                    )}
                </section>

                <CalculationExample rule={rule} />

                {rule.earning_type === 'fixed_slab' && (
                    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-6 py-4">
                            <h2 className="text-sm font-bold text-foreground">Earning Slabs</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Bill amount is matched against these slabs to determine points earned.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px] text-left">
                                <thead>
                                    <tr className="bg-muted text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase dark:bg-stone-900 dark:text-stone-400">
                                        <th className="border-b border-border/10 px-6 py-4">Min Amount</th>
                                        <th className="border-b border-border/10 px-6 py-4">Max Amount</th>
                                        <th className="border-b border-border/10 px-6 py-4">Points</th>
                                        <th className="border-b border-border/10 px-6 py-4">Order</th>
                                        <th className="border-b border-border/10 px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted dark:divide-stone-800">
                                    {slabs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                                No slabs configured.
                                            </td>
                                        </tr>
                                    )}
                                    {slabs.map((slab) => (
                                        <tr key={slab.id} className="transition-colors hover:bg-muted dark:hover:bg-stone-900/50">
                                            <td className="px-6 py-4 text-sm font-semibold text-foreground">
                                                Rs.&nbsp;{slab.min_amount}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                                {slab.max_amount ? `Rs. ${slab.max_amount}` : '∞ (unlimited)'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-primary">
                                                {slab.points} pts
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground dark:text-stone-400">
                                                {slab.sort_order}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
                                                        slab.is_active
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
                                                    )}
                                                >
                                                    {slab.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
