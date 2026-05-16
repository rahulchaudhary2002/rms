import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
    nodeSelection?: NodeSelectionData;
    auth?: { can: Record<string, boolean> };
};

type Pending = {
    scope_type: ScopeType | null;
    outlet_id: string | null;
    department_id: string | null;
    warehouse_id: string | null;
};

const WAREHOUSE_SCOPES: ScopeType[] = ['central_warehouse', 'outlet_warehouse', 'department_warehouse'];
const OUTLET_SCOPES: ScopeType[]    = ['outlet', 'outlet_department'];

function pendingChanged(pending: Pending, ns: NodeSelectionData): boolean {
    return (
        pending.scope_type    !== ns.current_scope_type ||
        pending.outlet_id     !== ns.current_outlet_id ||
        pending.department_id !== ns.current_department_id ||
        pending.warehouse_id  !== ns.current_node_id
    );
}

export function OutletNodeSwitcher() {
    const page           = usePage<SharedProps>();
    const nodeSelection  = page.props.nodeSelection;
    const canSelectGlobal = nodeSelection?.can_select_global ?? false;

    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState<Pending>({
        scope_type:    nodeSelection?.current_scope_type ?? null,
        outlet_id:     nodeSelection?.current_outlet_id ?? null,
        department_id: nodeSelection?.current_department_id ?? null,
        warehouse_id:  nodeSelection?.current_node_id ?? null,
    });
    const [openOutlet, setOpenOutlet] = useState<string | null>(nodeSelection?.current_outlet_id ?? null);
    const [openDept, setOpenDept]     = useState<string | null>(nodeSelection?.current_department_id ?? null);
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState(false);

    const centralWarehouses = nodeSelection?.central_warehouses ?? [];
    const outlets           = nodeSelection?.outlets ?? [];

    const set = (patch: Partial<Pending>) => setPending((p) => ({ ...p, ...patch }));

    // Flat list of all items for search
    type FlatItem = { type: ScopeType; label: string; outletId: string | null; deptId: string | null; warehouseId: string | null; outletName?: string; deptName?: string };
    const allItems = useMemo<FlatItem[]>(() => {
        const list: FlatItem[] = [];
        for (const wh of centralWarehouses) {
            list.push({ type: 'central_warehouse', label: wh.name, outletId: null, deptId: null, warehouseId: wh.id });
        }
        for (const o of outlets) {
            list.push({ type: 'outlet', label: o.name, outletId: o.id, deptId: null, warehouseId: null });
            for (const wh of o.warehouses) {
                list.push({ type: 'outlet_warehouse', label: wh.name, outletId: o.id, deptId: null, warehouseId: wh.id, outletName: o.name });
            }
            for (const d of o.departments) {
                list.push({ type: 'outlet_department', label: d.name, outletId: o.id, deptId: d.id, warehouseId: null, outletName: o.name });
                for (const wh of d.warehouses) {
                    list.push({ type: 'department_warehouse', label: wh.name, outletId: o.id, deptId: d.id, warehouseId: wh.id, deptName: d.name });
                }
            }
        }
        return list;
    }, [centralWarehouses, outlets]);

    const filteredItems = useMemo<FlatItem[]>(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return [];
        return allItems.filter((item) => item.label.toLowerCase().includes(term) || (item.outletName ?? '').toLowerCase().includes(term) || (item.deptName ?? '').toLowerCase().includes(term));
    }, [allItems, searchQuery]);

    useEffect(() => {
        if (!open) return;
        const handleMouseDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => { document.removeEventListener('mousedown', handleMouseDown); document.removeEventListener('keydown', handleKeyDown); };
    }, [open]);

    const handleSwitcherToggle = () => {
        if (!open) {
            setSearchQuery('');
            setPending({
                scope_type:    nodeSelection?.current_scope_type ?? null,
                outlet_id:     nodeSelection?.current_outlet_id ?? null,
                department_id: nodeSelection?.current_department_id ?? null,
                warehouse_id:  nodeSelection?.current_node_id ?? null,
            });
            setOpenOutlet(nodeSelection?.current_outlet_id ?? (outlets[0]?.id ?? null));
            setOpenDept(nodeSelection?.current_department_id ?? null);
        }
        setOpen((v) => !v);
    };

    const handleApplySelection = () => {
        if (!nodeSelection?.selection_url || pending.scope_type === null || processing) return;

        setProcessing(true);
        const needsOutlet    = OUTLET_SCOPES.includes(pending.scope_type) || WAREHOUSE_SCOPES.includes(pending.scope_type);
        const needsDept      = pending.scope_type === 'outlet_department' || pending.scope_type === 'department_warehouse';
        const needsWarehouse = WAREHOUSE_SCOPES.includes(pending.scope_type);

        router.post(
            nodeSelection.selection_url,
            {
                scope_type:    pending.scope_type,
                outlet_id:     needsOutlet    ? pending.outlet_id     : null,
                department_id: needsDept      ? pending.department_id : null,
                warehouse_id:  needsWarehouse ? pending.warehouse_id  : null,
                redirect_to:   window.location.pathname,
            } as Record<string, string | null>,
            {
                preserveScroll: true,
                onFinish: () => { setProcessing(false); setOpen(false); setSearchQuery(''); },
            },
        );
    };

    if (!nodeSelection) return null;

    const currentLabel = nodeSelection.current_label ?? (nodeSelection.current_scope_type === 'global' ? 'Global' : null);
    const selectionUnchanged = nodeSelection ? !pendingChanged(pending, nodeSelection) : true;

    const scopeIcon = (type: ScopeType | null): string => {
        if (type === 'global')               return 'language';
        if (type === 'central_warehouse')    return 'inventory_2';
        if (type === 'outlet')               return 'storefront';
        if (type === 'outlet_warehouse')     return 'inventory_2';
        if (type === 'outlet_department')    return 'meeting_room';
        if (type === 'department_warehouse') return 'inventory_2';
        return 'account_tree';
    };

    const itemIcon = (type: ScopeType): string => scopeIcon(type);

    const isItemSelected = (item: FlatItem) =>
        pending.scope_type    === item.type &&
        pending.outlet_id     === item.outletId &&
        pending.department_id === item.deptId &&
        pending.warehouse_id  === item.warehouseId;

    const selectItem = (item: FlatItem) => {
        set({ scope_type: item.type, outlet_id: item.outletId, department_id: item.deptId, warehouse_id: item.warehouseId });
        if (item.outletId) setOpenOutlet(item.outletId);
    };

    return (
        <div ref={rootRef} className="relative w-full max-w-xl min-w-0">
            {/* Trigger */}
            <button
                type="button"
                className="flex h-10 w-full min-w-0 items-center gap-2 rounded-lg bg-muted px-2 text-left transition-all hover:bg-accent focus:ring-2 focus:ring-primary/20 focus:outline-none sm:px-3 lg:h-11 lg:gap-3 lg:px-4"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={handleSwitcherToggle}
            >
                <span className="material-symbols-outlined shrink-0 text-primary">
                    {scopeIcon(nodeSelection.current_scope_type)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-[9px] leading-none font-bold tracking-wider text-muted-foreground/60 uppercase">
                        Current Scope
                    </p>
                    <p className="truncate text-sm font-bold text-foreground">
                        {currentLabel ?? 'Select scope'}
                    </p>
                </div>
                <span className={cn('material-symbols-outlined ml-auto shrink-0 text-lg text-muted-foreground transition-transform', open && 'rotate-180')}>
                    expand_more
                </span>
            </button>

            {/* Dropdown */}
            <div className={cn(
                'fixed top-16 right-4 left-4 z-[60] mt-2 origin-top-left overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-200 sm:absolute sm:top-full sm:right-auto sm:left-0 sm:w-[min(calc(100vw-2rem),30rem)]',
                open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0',
            )}>
                {/* Search */}
                <div className="border-b border-border bg-muted p-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full rounded-lg border border-input bg-background py-2 pr-4 pl-9 text-sm focus:border-ring focus:ring-1 focus:ring-ring"
                        />
                    </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto p-2">
                    {/* Search results */}
                    {searchQuery.trim() !== '' ? (
                        filteredItems.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">No results found.</p>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredItems.map((item, i) => {
                                    const selected = isItemSelected(item);
                                    const sub = item.outletName ? (item.deptName ? `${item.outletName} / ${item.deptName}` : item.outletName) : undefined;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors',
                                                selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                                            )}
                                            onClick={() => selectItem(item)}
                                        >
                                            <span className={cn('material-symbols-outlined text-sm shrink-0', selected ? '' : 'text-muted-foreground')}>
                                                {itemIcon(item.type)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">{item.label}</span>
                                                {sub && <span className={cn('block truncate text-xs', selected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{sub}</span>}
                                            </span>
                                            {selected && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* Hierarchical view */
                        <div className="space-y-0.5">
                            {/* Global */}
                            {canSelectGlobal && (
                                <>
                                    <button
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors',
                                            pending.scope_type === 'global' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                                        )}
                                        onClick={() => set({ scope_type: 'global', outlet_id: null, department_id: null, warehouse_id: null })}
                                    >
                                        <span className={cn('material-symbols-outlined text-sm', pending.scope_type === 'global' ? '' : 'text-muted-foreground')}>language</span>
                                        <span className="flex-1 text-sm font-semibold">Global</span>
                                        <span className={cn('text-xs', pending.scope_type === 'global' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>All outlets &amp; warehouses</span>
                                        {pending.scope_type === 'global' && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                    </button>
                                    {(centralWarehouses.length > 0 || outlets.length > 0) && <div className="my-1 h-px bg-border" />}
                                </>
                            )}

                            {/* Central warehouses */}
                            {centralWarehouses.length > 0 && (
                                <>
                                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Central Warehouses</p>
                                    {centralWarehouses.map((wh) => {
                                        const sel = pending.scope_type === 'central_warehouse' && pending.warehouse_id === wh.id;
                                        return (
                                            <button
                                                key={wh.id}
                                                type="button"
                                                className={cn('flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors', sel ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                                                onClick={() => set({ scope_type: 'central_warehouse', outlet_id: null, department_id: null, warehouse_id: wh.id })}
                                            >
                                                <span className={cn('material-symbols-outlined text-sm', sel ? '' : 'text-muted-foreground')}>inventory_2</span>
                                                <span className="flex-1 truncate text-sm font-medium">{wh.name}</span>
                                                {sel && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                            </button>
                                        );
                                    })}
                                    {outlets.length > 0 && <div className="my-1 h-px bg-border" />}
                                </>
                            )}

                            {/* Outlets */}
                            {outlets.length === 0 && centralWarehouses.length === 0 && !canSelectGlobal && (
                                <p className="p-3 text-sm text-muted-foreground">No scopes available.</p>
                            )}

                            {outlets.map((outlet, idx) => {
                                const outletSel  = pending.scope_type === 'outlet' && pending.outlet_id === outlet.id;
                                const outletExp  = openOutlet === outlet.id;
                                const hasChildren = outlet.warehouses.length > 0 || outlet.departments.length > 0;

                                return (
                                    <div key={outlet.id}>
                                        {idx > 0 && <div className="my-1 h-px bg-border/50" />}

                                        {/* Outlet */}
                                        <button
                                            type="button"
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors',
                                                outletSel ? 'bg-primary text-primary-foreground' : outletExp ? 'bg-primary/10' : 'hover:bg-muted',
                                            )}
                                            onClick={() => {
                                                set({ scope_type: 'outlet', outlet_id: outlet.id, department_id: null, warehouse_id: null });
                                                setOpenOutlet(outletExp && !outletSel ? null : outlet.id);
                                            }}
                                        >
                                            <span className={cn('material-symbols-outlined text-sm shrink-0', outletSel ? '' : outletExp ? 'text-primary' : 'text-muted-foreground')}>storefront</span>
                                            <span className="flex-1 truncate text-sm font-semibold">{outlet.name}</span>
                                            <span className={cn('shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide', outletSel ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-muted-foreground')}>Outlet</span>
                                            {outletSel
                                                ? <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                                                : hasChildren && <span className={cn('material-symbols-outlined text-xs shrink-0 text-muted-foreground transition-transform', outletExp && 'rotate-90')}>chevron_right</span>
                                            }
                                        </button>

                                        {/* Children */}
                                        <div className={cn('grid transition-[grid-template-rows] duration-200 ease-in-out', outletExp ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                                            <div className="overflow-hidden">
                                                <div className="ml-5 border-l-2 border-primary/20 pl-1 space-y-0.5 pb-1">

                                                    {/* Outlet warehouses */}
                                                    {outlet.warehouses.map((wh) => {
                                                        const s = pending.scope_type === 'outlet_warehouse' && pending.warehouse_id === wh.id;
                                                        return (
                                                            <button
                                                                key={wh.id}
                                                                type="button"
                                                                className={cn('ml-1 flex w-[calc(100%-0.25rem)] items-center gap-2 rounded-lg p-2 text-left transition-colors', s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                                                                onClick={() => set({ scope_type: 'outlet_warehouse', outlet_id: outlet.id, department_id: null, warehouse_id: wh.id })}
                                                            >
                                                                <span className="material-symbols-outlined text-sm shrink-0">inventory_2</span>
                                                                <span className="flex-1 truncate text-xs font-medium">{wh.name}</span>
                                                                <span className={cn('shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide', s ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-muted-foreground')}>Warehouse</span>
                                                                {s && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Departments */}
                                                    {outlet.departments.map((dept) => {
                                                        const deptSel = pending.scope_type === 'outlet_department' && pending.department_id === dept.id;
                                                        const deptExp = openDept === dept.id;
                                                        const hasDeptWh = dept.warehouses.length > 0;

                                                        return (
                                                            <div key={dept.id}>
                                                                {/* Department row */}
                                                                <button
                                                                    type="button"
                                                                    className={cn('ml-1 flex w-[calc(100%-0.25rem)] items-center gap-2 rounded-lg p-2 text-left transition-colors', deptSel ? 'bg-primary text-primary-foreground' : deptExp ? 'bg-primary/10' : 'text-muted-foreground hover:bg-muted')}
                                                                    onClick={() => {
                                                                        set({ scope_type: 'outlet_department', outlet_id: outlet.id, department_id: dept.id, warehouse_id: null });
                                                                        if (hasDeptWh) setOpenDept(deptExp && !deptSel ? null : dept.id);
                                                                    }}
                                                                >
                                                                    <span className={cn('material-symbols-outlined text-sm shrink-0', deptSel ? '' : deptExp ? 'text-primary' : '')}>meeting_room</span>
                                                                    <span className="flex-1 truncate text-xs font-medium">{dept.name}</span>
                                                                    <span className={cn('shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide', deptSel ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-muted-foreground')}>Dept</span>
                                                                    {deptSel
                                                                        ? <span className="material-symbols-outlined text-sm">check_circle</span>
                                                                        : hasDeptWh && <span className={cn('material-symbols-outlined text-xs text-muted-foreground transition-transform', deptExp && 'rotate-90')}>chevron_right</span>
                                                                    }
                                                                </button>

                                                                {/* Dept warehouses accordion */}
                                                                {hasDeptWh && (
                                                                    <div className={cn('grid transition-[grid-template-rows] duration-200 ease-in-out', deptExp ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                                                                        <div className="overflow-hidden">
                                                                            <div className="ml-4 border-l-2 border-border/40 pl-1 space-y-0.5 pb-0.5">
                                                                                {dept.warehouses.map((wh) => {
                                                                                    const s = pending.scope_type === 'department_warehouse' && pending.warehouse_id === wh.id;
                                                                                    return (
                                                                                        <button
                                                                                            key={wh.id}
                                                                                            type="button"
                                                                                            className={cn('ml-1 flex w-[calc(100%-0.25rem)] items-center gap-2 rounded-lg p-2 text-left transition-colors', s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                                                                                            onClick={() => set({ scope_type: 'department_warehouse', outlet_id: outlet.id, department_id: dept.id, warehouse_id: wh.id })}
                                                                                        >
                                                                                            <span className="material-symbols-outlined text-sm shrink-0">inventory_2</span>
                                                                                            <span className="flex-1 truncate text-xs font-medium">{wh.name}</span>
                                                                                            <span className={cn('shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide', s ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-muted-foreground')}>Warehouse</span>
                                                                                            {s && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                                                                        </button>
                                                                                    );
                                                                                })}
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
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border bg-muted p-3">
                    <button
                        type="button"
                        className="flex w-full min-w-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                        onClick={handleApplySelection}
                        disabled={pending.scope_type === null || selectionUnchanged || processing}
                    >
                        <span className="material-symbols-outlined text-sm">check</span>
                        {processing ? 'Applying...' : 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
}
