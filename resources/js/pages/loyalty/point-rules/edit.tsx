import { Head, Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/form-section';
import { PageHeader } from '@/components/page-header';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DateInput } from '@/components/ui/date-input';
import { dashboard } from '@/routes';
import {
    index as rulesIndex,
    update as rulesUpdate,
} from '@/routes/loyalty-point-rules';
import type { LoyaltyPointRule, LoyaltyPointRuleSlab, Outlet } from '@/types';

type SlabRow = {
    min_amount: string;
    max_amount: string;
    points: string;
    sort_order: string;
    is_active: boolean;
};

type Props = {
    rule: LoyaltyPointRule & { slabs: LoyaltyPointRuleSlab[] };
    scopeOutlets: Outlet[];
    scopeType: 'global' | 'outlet' | 'warehouse';
    scopeOutletId: number | null;
};

function SlabRepeater({
    slabs,
    onChange,
    error,
}: {
    slabs: SlabRow[];
    onChange: (slabs: SlabRow[]) => void;
    error?: string;
}) {
    function addSlab() {
        onChange([
            ...slabs,
            { min_amount: '', max_amount: '', points: '', sort_order: String(slabs.length), is_active: true },
        ]);
    }

    function removeSlab(index: number) {
        onChange(slabs.filter((_, i) => i !== index));
    }

    function updateSlab(index: number, field: keyof SlabRow, value: string | boolean) {
        const next = slabs.map((s, i) => (i === index ? { ...s, [field]: value } : s));
        onChange(next);
    }

    return (
        <div className="space-y-3">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <p className="text-xs text-muted-foreground">
                Slabs should not overlap. Leave max amount empty for the final unlimited slab.
            </p>
            {slabs.length === 0 && (
                <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                    No slabs added yet.
                </p>
            )}
            {slabs.map((slab, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 rounded-lg border border-border bg-muted/30 p-3 dark:bg-stone-800/30">
                    <div className="col-span-12 sm:col-span-3">
                        <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Min Amount</label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={slab.min_amount}
                            onChange={(e) => updateSlab(i, 'min_amount', e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                        <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Max Amount</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={slab.max_amount}
                            onChange={(e) => updateSlab(i, 'max_amount', e.target.value)}
                            placeholder="Unlimited"
                        />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Points</label>
                        <Input
                            type="number"
                            min="1"
                            value={slab.points}
                            onChange={(e) => updateSlab(i, 'points', e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Order</label>
                        <Input
                            type="number"
                            min="0"
                            value={slab.sort_order}
                            onChange={(e) => updateSlab(i, 'sort_order', e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div className="col-span-4 sm:col-span-1 flex flex-col justify-end">
                        <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">Active</label>
                        <input
                            type="checkbox"
                            checked={slab.is_active}
                            onChange={(e) => updateSlab(i, 'is_active', e.target.checked)}
                            className="h-5 w-5 rounded border-border"
                        />
                    </div>
                    <div className="col-span-4 sm:col-span-1 flex flex-col justify-end items-end">
                        <button
                            type="button"
                            onClick={() => removeSlab(i)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={addSlab}
                className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
            >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Slab
            </button>
        </div>
    );
}

export default function LoyaltyPointRulesEdit({ rule, scopeOutlets, scopeType, scopeOutletId }: Props) {
    const scopeLocked = scopeType !== 'global';
    const { data, setData, put, processing, errors } = useForm({
        name: rule.name,
        type: rule.type,
        outlet_id: rule.outlet_id ? String(rule.outlet_id) : '',
        earning_type: rule.earning_type,
        earn_amount: rule.earn_amount ?? '',
        earn_points: rule.earn_points ? String(rule.earn_points) : '',
        slabs: (rule.slabs ?? []).map((s) => ({
            min_amount: s.min_amount,
            max_amount: s.max_amount ?? '',
            points: String(s.points),
            sort_order: String(s.sort_order),
            is_active: s.is_active,
        })),
        redeem_point_value: rule.redeem_point_value,
        minimum_redeem_points: String(rule.minimum_redeem_points),
        maximum_redeem_points: rule.maximum_redeem_points ? String(rule.maximum_redeem_points) : '',
        maximum_redeem_percent: rule.maximum_redeem_percent ?? '',
        points_expiry_days: rule.points_expiry_days ? String(rule.points_expiry_days) : '',
        starts_at: rule.starts_at ?? '',
        ends_at: rule.ends_at ?? '',
        is_active: rule.is_active,
        priority: String(rule.priority),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(rulesUpdate.url(rule.id));
    }

    const showOutlet = data.type === 'outlet' || data.type === 'campaign';
    const showCampaignDates = data.type === 'campaign';
    const showFixedRate = data.earning_type === 'fixed_rate';
    const showSlabs = data.earning_type === 'fixed_slab';

    return (
        <>
            <Head title={`Edit Rule: ${rule.name}`} />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Loyalty Point Rules', href: rulesIndex.url() },
                    { label: rule.name },
                ]}
                title={`Edit Rule: ${rule.name}`}
                description="Update the loyalty point earning and redemption rule."
            />

            <form onSubmit={submit} className="space-y-8 pb-6">
                <FormSection
                    title="Rule Identity"
                    description="Set the name, type, and scope of this rule."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Name" htmlFor="name" error={errors.name} className="md:col-span-2">
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Rule Type" error={errors.type}>
                            <SearchableSelect
                                value={data.type}
                                onChange={(e) => {
                                    const type = e.target.value as typeof data.type;
                                    setData('type', type);
                                    if (type === 'global') setData('outlet_id', '');
                                }}
                            >
                                {!scopeLocked && <option value="global">Global</option>}
                                <option value="outlet">Outlet</option>
                                <option value="campaign">Campaign</option>
                            </SearchableSelect>
                        </FormField>

                        {showOutlet && (
                            <FormField
                                label={data.type === 'outlet' ? 'Outlet (required)' : 'Outlet (optional)'}
                                error={errors.outlet_id}
                            >
                                <SearchableSelect
                                    value={data.outlet_id}
                                    onChange={(e) => setData('outlet_id', e.target.value)}
                                    disabled={scopeLocked}
                                >
                                    <option value="">Select an outlet...</option>
                                    {scopeOutlets.map((o) => (
                                        <option key={o.id} value={String(o.id)}>{o.name}</option>
                                    ))}
                                </SearchableSelect>
                            </FormField>
                        )}

                        {showCampaignDates && (
                            <>
                                <FormField label="Starts At" error={errors.starts_at}>
                                    <DateInput
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </FormField>
                                <FormField label="Ends At" error={errors.ends_at}>
                                    <DateInput
                                        value={data.ends_at}
                                        onChange={(e) => setData('ends_at', e.target.value)}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </FormField>
                            </>
                        )}
                    </div>
                </FormSection>

                <FormSection
                    title="Earning Configuration"
                    description="Choose how customers earn loyalty points."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Earning Type" error={errors.earning_type} className="md:col-span-2">
                            <SearchableSelect
                                value={data.earning_type}
                                onChange={(e) => {
                                    setData('earning_type', e.target.value as typeof data.earning_type);
                                    setData('slabs', []);
                                }}
                            >
                                <option value="fixed_rate">Fixed Rate (e.g. Rs. 100 = 10 points)</option>
                                <option value="fixed_slab">Fixed Slab (tiered by bill amount)</option>
                            </SearchableSelect>
                        </FormField>

                        {showFixedRate && (
                            <>
                                <FormField label="Earn Amount (Rs.)" htmlFor="earn_amount" error={errors.earn_amount}>
                                    <Input
                                        id="earn_amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={data.earn_amount}
                                        onChange={(e) => setData('earn_amount', e.target.value)}
                                        placeholder="e.g. 100"
                                    />
                                </FormField>
                                <FormField label="Earn Points" htmlFor="earn_points" error={errors.earn_points}>
                                    <Input
                                        id="earn_points"
                                        type="number"
                                        min="1"
                                        value={data.earn_points}
                                        onChange={(e) => setData('earn_points', e.target.value)}
                                        placeholder="e.g. 10"
                                    />
                                </FormField>
                            </>
                        )}

                        {showSlabs && (
                            <div className="md:col-span-2">
                                <FormField label="Earning Slabs" error={errors.slabs}>
                                    <SlabRepeater
                                        slabs={data.slabs}
                                        onChange={(slabs) => setData('slabs', slabs)}
                                    />
                                </FormField>
                            </div>
                        )}
                    </div>
                </FormSection>

                <FormSection
                    title="Redemption Settings"
                    description="Configure point redemption limits and value."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Point Value (Rs. per point)" htmlFor="redeem_point_value" error={errors.redeem_point_value}>
                            <Input
                                id="redeem_point_value"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.redeem_point_value}
                                onChange={(e) => setData('redeem_point_value', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Minimum Redeem Points" htmlFor="minimum_redeem_points" error={errors.minimum_redeem_points}>
                            <Input
                                id="minimum_redeem_points"
                                type="number"
                                min="0"
                                value={data.minimum_redeem_points}
                                onChange={(e) => setData('minimum_redeem_points', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Maximum Redeem Points (optional)" htmlFor="maximum_redeem_points" error={errors.maximum_redeem_points}>
                            <Input
                                id="maximum_redeem_points"
                                type="number"
                                min="1"
                                value={data.maximum_redeem_points}
                                onChange={(e) => setData('maximum_redeem_points', e.target.value)}
                                placeholder="No limit"
                            />
                        </FormField>

                        <FormField label="Max Redeem % of Bill (optional)" htmlFor="maximum_redeem_percent" error={errors.maximum_redeem_percent}>
                            <Input
                                id="maximum_redeem_percent"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.maximum_redeem_percent}
                                onChange={(e) => setData('maximum_redeem_percent', e.target.value)}
                                placeholder="e.g. 50"
                            />
                        </FormField>

                        <FormField label="Points Expiry Days (optional)" htmlFor="points_expiry_days" error={errors.points_expiry_days}>
                            <Input
                                id="points_expiry_days"
                                type="number"
                                min="1"
                                value={data.points_expiry_days}
                                onChange={(e) => setData('points_expiry_days', e.target.value)}
                                placeholder="Never expires"
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Rule Settings"
                    description="Control priority and activation status."
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Priority (lower = higher priority)" htmlFor="priority" error={errors.priority}>
                            <Input
                                id="priority"
                                type="number"
                                min="1"
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Status" error={errors.is_active}>
                            <SearchableSelect
                                value={data.is_active ? 'true' : 'false'}
                                onChange={(e) => setData('is_active', e.target.value === 'true')}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </SearchableSelect>
                        </FormField>
                    </div>
                </FormSection>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/70 pt-8 dark:border-stone-700">
                    <span className="hidden text-sm text-muted-foreground italic sm:inline">
                        Unsaved changes will be lost.
                    </span>
                    <Link
                        href={rulesIndex.url()}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Discard Changes
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}
