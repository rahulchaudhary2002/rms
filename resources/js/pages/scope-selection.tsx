import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/page-header';
import { dashboard, logout } from '@/routes';
import { store as scopeSelectionStore } from '@/routes/scope-selection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScopeType } from '@/types';

type CentralWarehouse = { id: string; name: string };
type DeptWarehouse    = { id: string; name: string };
type Department       = { id: string; name: string; warehouses: DeptWarehouse[] };
type OutletWarehouse  = { id: string; name: string };
type OutletItem       = { id: string; name: string; warehouses: OutletWarehouse[]; departments: Department[] };

type NodeSelectionData = {
    setup_completed: boolean;
    selection_url: string | null;
    can_select_global: boolean;
    current_scope_type: ScopeType | null;
    current_outlet_id: string | null;
    current_department_id: string | null;
    current_node_id: string | null;
    current_label: string | null;
    central_warehouses: CentralWarehouse[];
    outlets: OutletItem[];
};

type SharedProps = {
    errors?: { outlet_id?: string; department_id?: string; warehouse_id?: string; scope_type?: string };
    nodeSelection?: NodeSelectionData;
};

type Selected = {
    scope_type: ScopeType | '';
    outlet_id: string;
    department_id: string;
    warehouse_id: string;
};

const WAREHOUSE_SCOPES: ScopeType[] = ['central_warehouse', 'outlet_warehouse', 'department_warehouse'];
const OUTLET_SCOPES: ScopeType[]    = ['outlet', 'outlet_department'];

function isValid(s: Selected): boolean {
    if (s.scope_type === 'global')               return true;
    if (s.scope_type === 'central_warehouse')    return s.warehouse_id !== '';
    if (s.scope_type === 'outlet')               return s.outlet_id !== '';
    if (s.scope_type === 'outlet_warehouse')     return s.outlet_id !== '' && s.warehouse_id !== '';
    if (s.scope_type === 'outlet_department')    return s.outlet_id !== '' && s.department_id !== '';
    if (s.scope_type === 'department_warehouse') return s.outlet_id !== '' && s.department_id !== '' && s.warehouse_id !== '';
    return false;
}

function Badge({ label, selected }: { label: string; selected: boolean }) {
    return (
        <span className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            selected ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-muted-foreground',
        )}>
            {label}
        </span>
    );
}

function ScopeButton({ icon, label, badge, selected, expanded, hasChildren, onClick }: {
    icon: string; label: string; badge?: string; selected: boolean;
    expanded?: boolean; hasChildren?: boolean; onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                selected ? 'bg-primary text-white shadow-sm' : expanded ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted',
            )}
            onClick={onClick}
        >
            <span className={cn('material-symbols-outlined text-[18px] shrink-0', selected ? '' : expanded ? 'text-primary' : 'text-muted-foreground')}>
                {icon}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight">{label}</span>
            {badge && <Badge label={badge} selected={selected} />}
            {selected
                ? <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                : hasChildren && (
                    <span className={cn('material-symbols-outlined text-sm shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-90')}>
                        chevron_right
                    </span>
                )
            }
        </button>
    );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
    return (
        <div className="flex items-center gap-2 px-1 pb-1.5 pt-3">
            <span className="material-symbols-outlined text-sm text-muted-foreground/60">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
        </div>
    );
}

export default function ScopeSelection() {
    const page          = usePage<SharedProps>();
    const { errors }    = page.props;
    const nodeSelection = page.props.nodeSelection;

    const canSelectGlobal  = nodeSelection?.can_select_global ?? false;
    const centralWarehouses = nodeSelection?.central_warehouses ?? [];
    const outlets           = nodeSelection?.outlets ?? [];

    const initialSelected: Selected = {
        scope_type:    nodeSelection?.current_scope_type ?? '',
        outlet_id:     nodeSelection?.current_outlet_id ?? '',
        department_id: nodeSelection?.current_department_id ?? '',
        warehouse_id:  nodeSelection?.current_node_id ?? '',
    };

    const [selected, setSelected]  = useState<Selected>(initialSelected);
    const [openOutlet, setOpenOutlet] = useState<string | null>(
        nodeSelection?.current_outlet_id ?? (outlets[0]?.id ?? null),
    );
    const [openDept, setOpenDept] = useState<string | null>(
        nodeSelection?.current_department_id ?? null,
    );
    const [processing, setProcessing] = useState(false);

    const sel = (patch: Partial<Selected>) => setSelected((prev) => ({ ...prev, ...patch }));

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isValid(selected)) return;

        setProcessing(true);

        const needsOutlet    = OUTLET_SCOPES.includes(selected.scope_type as ScopeType) || WAREHOUSE_SCOPES.includes(selected.scope_type as ScopeType);
        const needsDept      = selected.scope_type === 'outlet_department' || selected.scope_type === 'department_warehouse';
        const needsWarehouse = WAREHOUSE_SCOPES.includes(selected.scope_type as ScopeType);

        router.post(
            scopeSelectionStore.url(),
            {
                scope_type:    selected.scope_type,
                outlet_id:     needsOutlet    ? selected.outlet_id     : null,
                department_id: needsDept      ? selected.department_id : null,
                warehouse_id:  needsWarehouse ? selected.warehouse_id  : null,
                redirect_to:   dashboard.url(),
            } as Record<string, string | null>,
            {
                preserveScroll: false,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const hasAnything = centralWarehouses.length > 0 || outlets.length > 0;

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted dark:bg-card">
            <Head title="Scope Selection" />

            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Dashboard', href: dashboard.url() }, { label: 'Scope Selection' }]}
                    title="Select working scope"
                    description="Choose the context you want to work in — global, a central warehouse, an outlet, a department, or a specific warehouse."
                />

                <form
                    onSubmit={onSubmit}
                    className="space-y-2 rounded-xl border border-amber-200/70 bg-white p-6 shadow-sm dark:border-border dark:bg-card"
                >
                    {/* ── Global ─────────────────────────────────── */}
                    {canSelectGlobal && (
                        <div>
                            <SectionHeader icon="public" label="Global" />
                            <ScopeButton
                                icon="language"
                                label="Global"
                                selected={selected.scope_type === 'global'}
                                onClick={() => sel({ scope_type: 'global', outlet_id: '', department_id: '', warehouse_id: '' })}
                            />
                        </div>
                    )}

                    {/* ── Central Warehouses ──────────────────────── */}
                    {centralWarehouses.length > 0 && (
                        <div>
                            <SectionHeader icon="warehouse" label="Central Warehouses" />
                            <div className="space-y-0.5">
                                {centralWarehouses.map((wh) => (
                                    <ScopeButton
                                        key={wh.id}
                                        icon="inventory_2"
                                        label={wh.name}
                                        badge="Warehouse"
                                        selected={selected.scope_type === 'central_warehouse' && selected.warehouse_id === wh.id}
                                        onClick={() => sel({ scope_type: 'central_warehouse', outlet_id: '', department_id: '', warehouse_id: wh.id })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Outlets ─────────────────────────────────── */}
                    {outlets.length > 0 && (
                        <div>
                            <SectionHeader icon="storefront" label="Outlets" />
                            <div className="space-y-1">
                                {outlets.map((outlet) => {
                                    const outletSelected = selected.scope_type === 'outlet' && selected.outlet_id === outlet.id;
                                    const outletExpanded = openOutlet === outlet.id;
                                    const hasChildren    = outlet.warehouses.length > 0 || outlet.departments.length > 0;

                                    return (
                                        <div key={outlet.id} className="rounded-lg border border-border/30 bg-card/50 dark:bg-background/30">
                                            {/* Outlet row */}
                                            <ScopeButton
                                                icon="storefront"
                                                label={outlet.name}
                                                badge="Outlet"
                                                selected={outletSelected}
                                                expanded={outletExpanded}
                                                hasChildren={hasChildren}
                                                onClick={() => {
                                                    sel({ scope_type: 'outlet', outlet_id: outlet.id, department_id: '', warehouse_id: '' });
                                                    setOpenOutlet(outletExpanded && !outletSelected ? null : outlet.id);
                                                }}
                                            />

                                            {/* Collapsible children */}
                                            <div className={cn(
                                                'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                                outletExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                            )}>
                                                <div className="overflow-hidden">
                                                    <div className="ml-4 border-l-2 border-primary/20 pl-2 pb-1 space-y-0.5">

                                                        {/* Outlet-direct warehouses */}
                                                        {outlet.warehouses.map((wh) => (
                                                            <ScopeButton
                                                                key={wh.id}
                                                                icon="inventory_2"
                                                                label={wh.name}
                                                                badge="Warehouse"
                                                                selected={selected.scope_type === 'outlet_warehouse' && selected.warehouse_id === wh.id}
                                                                onClick={() => sel({ scope_type: 'outlet_warehouse', outlet_id: outlet.id, department_id: '', warehouse_id: wh.id })}
                                                            />
                                                        ))}

                                                        {/* Departments */}
                                                        {outlet.departments.map((dept) => {
                                                            const deptSelected = selected.scope_type === 'outlet_department' && selected.department_id === dept.id;
                                                            const deptExpanded = openDept === dept.id;
                                                            const hasDeptWh    = dept.warehouses.length > 0;

                                                            return (
                                                                <div key={dept.id}>
                                                                    {/* Department row — accordion if it has warehouses */}
                                                                    <ScopeButton
                                                                        icon="meeting_room"
                                                                        label={dept.name}
                                                                        badge="Department"
                                                                        selected={deptSelected}
                                                                        expanded={deptExpanded}
                                                                        hasChildren={hasDeptWh}
                                                                        onClick={() => {
                                                                            sel({ scope_type: 'outlet_department', outlet_id: outlet.id, department_id: dept.id, warehouse_id: '' });
                                                                            if (hasDeptWh) setOpenDept(deptExpanded && !deptSelected ? null : dept.id);
                                                                        }}
                                                                    />

                                                                    {/* Department warehouses accordion */}
                                                                    {hasDeptWh && (
                                                                        <div className={cn(
                                                                            'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                                                            deptExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                                                        )}>
                                                                            <div className="overflow-hidden">
                                                                                <div className="ml-4 border-l-2 border-border/40 pl-2 space-y-0.5 pb-0.5">
                                                                                    {dept.warehouses.map((wh) => (
                                                                                        <ScopeButton
                                                                                            key={wh.id}
                                                                                            icon="inventory_2"
                                                                                            label={wh.name}
                                                                                            badge="Warehouse"
                                                                                            selected={selected.scope_type === 'department_warehouse' && selected.warehouse_id === wh.id}
                                                                                            onClick={() => sel({ scope_type: 'department_warehouse', outlet_id: outlet.id, department_id: dept.id, warehouse_id: wh.id })}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!canSelectGlobal && !hasAnything && (
                        <p className="py-4 text-sm text-muted-foreground text-center">
                            No outlets or warehouses are available yet.
                        </p>
                    )}

                    {(errors?.outlet_id || errors?.department_id || errors?.warehouse_id || errors?.scope_type) && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {errors.scope_type ?? errors.outlet_id ?? errors.department_id ?? errors.warehouse_id}
                        </p>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={!isValid(selected) || processing}
                            className="w-full rounded-lg"
                        >
                            {processing ? 'Applying...' : 'Continue'}
                        </Button>
                    </div>
                </form>

                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => router.post(logout.url())}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
                    >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
