import { router, usePage } from '@inertiajs/react';
import { store as outletsStore } from '@/routes/outlets';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';

type SelectionScope = 'outlet' | 'warehouse';

type NodeItem = {
    id: string;
    outlet_id?: string;
    outlet: string;
    node: string;
};

type NodeSelectionData = {
    setup_completed: boolean;
    selection_url: string | null;
    current_scope_type: SelectionScope | null;
    current_outlet_id: string | null;
    current_node_id: string | null;
    items: NodeItem[];
};

type SharedProps = {
    nodeSelection?: NodeSelectionData;
    outlets?: Array<{ id: string; name: string }>;
    warehouses?: Array<{ id: string; outlet_id: string; name: string }>;
    auth?: { can: Record<string, boolean> };
    errors?: {
        create_outlet_name?: string;
        create_warehouse_name?: string;
    };
};

type OutletGroup = {
    key: string;
    id: string;
    name: string;
    nodes: NodeItem[];
};

export function OutletNodeSwitcher() {
    const page = usePage<SharedProps>();
    const nodeSelection = page.props.nodeSelection;
    const can = page.props.auth?.can ?? {};
    const canCreateWarehouse = can['warehouses-create'] ?? false;
    const canCreateOutlet = can['outlets-create'] ?? false;

    const [open, setOpen] = useState(false);
    const [pendingScopeType, setPendingScopeType] =
        useState<SelectionScope | null>(
            nodeSelection?.current_scope_type ?? null,
        );
    const [pendingOutletId, setPendingOutletId] = useState<string | null>(
        nodeSelection?.current_outlet_id ?? null,
    );
    const [pendingNodeId, setPendingNodeId] = useState<string | null>(
        nodeSelection?.current_node_id ?? null,
    );
    const [openOutlet, setOpenOutlet] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedOutletId, setSelectedOutletId] = useState('');
    const [createWarehouseName, setCreateWarehouseName] = useState('');
    const [createProcessing, setCreateProcessing] = useState(false);

    // Locally created records (not yet in shared props)
    const [localOutlets, setLocalOutlets] = useState<{ id: string; name: string }[]>([]);

    // Add-outlet sub-modal
    const [addOutletModalOpen, setAddOutletModalOpen] = useState(false);
    const [addOutletName, setAddOutletName] = useState('');
    const [addOutletProcessing, setAddOutletProcessing] = useState(false);
    const [addOutletError, setAddOutletError] = useState('');

    const rootRef = useRef<HTMLDivElement>(null);
    const createErrors = page.props.errors ?? {};

    const hierarchy = useMemo<OutletGroup[]>(() => {
        const outletMap = new Map<string, OutletGroup>();

        for (const outlet of page.props.outlets ?? []) {
            const outletName = outlet.name || 'Unknown Outlet';
            const outletKey = outletName.toLowerCase();

            if (!outletMap.has(outletKey)) {
                outletMap.set(outletKey, {
                    key: outletKey,
                    id: outlet.id,
                    name: outletName,
                    nodes: [],
                });
            }
        }

        for (const node of nodeSelection?.items ?? []) {
            if (!node.id || !node.node) continue;

            const outletName = node.outlet || 'Unknown Outlet';
            const outletKey = outletName.toLowerCase();

            if (!outletMap.has(outletKey)) {
                outletMap.set(outletKey, {
                    key: outletKey,
                    id: node.outlet_id ?? '',
                    name: outletName,
                    nodes: [],
                });
            }

            outletMap.get(outletKey)?.nodes.push(node);
        }

        return Array.from(outletMap.values());
    }, [nodeSelection?.items, page.props.outlets]);

    const filteredHierarchy = useMemo<OutletGroup[]>(() => {
        const term = searchQuery.trim().toLowerCase();

        if (term === '') {
            return hierarchy;
        }

        return hierarchy
            .map((outlet) => {
                const outletMatches = outlet.name.toLowerCase().includes(term);
                const nodes = outlet.nodes.filter((node) => {
                    return (
                        outletMatches ||
                        node.node.toLowerCase().includes(term)
                    );
                });

                return nodes.length > 0 ? { ...outlet, nodes } : null;
            })
            .filter((outlet): outlet is OutletGroup => outlet !== null);
    }, [hierarchy, searchQuery]);

    const outletOptions = useMemo(() => {
        const outlets = new Map<string, string>();

        for (const outlet of page.props.outlets ?? []) {
            if (outlet.id !== '' && !outlets.has(outlet.id)) {
                outlets.set(outlet.id, outlet.name || 'Unknown Outlet');
            }
        }

        for (const node of nodeSelection?.items ?? []) {
            const outletId = node.outlet_id ?? '';

            if (outletId !== '' && !outlets.has(outletId)) {
                outlets.set(outletId, node.outlet || 'Unknown Outlet');
            }
        }

        const fromProps = Array.from(outlets.entries()).map(([id, name]) => ({ id, name }));
        const localIds = new Set(fromProps.map((o) => o.id));
        const extras = localOutlets.filter((o) => !localIds.has(o.id));

        return [...fromProps, ...extras];
    }, [nodeSelection?.items, page.props.outlets, localOutlets]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleMouseDown = (event: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleSwitcherToggle = () => {
        setOpen((value) => {
            const nextOpen = !value;

            if (nextOpen) {
                setSearchQuery('');
                setPendingScopeType(nodeSelection?.current_scope_type ?? null);
                setPendingOutletId(nodeSelection?.current_outlet_id ?? null);
                setPendingNodeId(nodeSelection?.current_node_id ?? null);

                if (hierarchy.length > 0) {
                    const hasOpenOutlet =
                        openOutlet !== null &&
                        hierarchy.some((outlet) => outlet.key === openOutlet);

                    if (!hasOpenOutlet) {
                        setOpenOutlet(hierarchy[0].key);
                    }
                }
            }

            return nextOpen;
        });
    };

    const handleOutletToggle = (outletKey: string) => {
        if (searchQuery.trim() !== '') {
            return;
        }

        setOpenOutlet((current) => (current === outletKey ? null : outletKey));
    };

    const handleApplySelection = () => {
        if (
            !nodeSelection?.selection_url ||
            pendingScopeType === null ||
            processing
        ) {
            return;
        }

        setProcessing(true);

        router.post(
            nodeSelection.selection_url,
            {
                scope_type: pendingScopeType,
                outlet_id:
                    pendingScopeType === 'outlet' ? pendingOutletId : null,
                warehouse_id:
                    pendingScopeType === 'warehouse' ? pendingNodeId : null,
                redirect_to: window.location.pathname,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setOpen(false);
                    setSearchQuery('');
                },
            },
        );
    };

    const createNodeUrl = nodeSelection?.selection_url
        ? `${nodeSelection.selection_url.replace(/\/$/, '')}/nodes`
        : null;

    const handleOpenCreateModal = () => {
        setOpen(false);
        setCreateModalOpen(true);
    };

    const handleRegisterWarehouse = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!createNodeUrl || createProcessing) {
            return;
        }

        setCreateProcessing(true);

        router.post(
            createNodeUrl,
            {
                create_outlet_id: selectedOutletId !== '' ? selectedOutletId : '',
                create_outlet_name: '',
                create_warehouse_name: createWarehouseName,
                redirect_to: window.location.pathname,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateModalOpen(false);
                    setSelectedOutletId('');
                    setCreateWarehouseName('');
                    setLocalOutlets([]);
                },
                onError: () => setCreateModalOpen(true),
                onFinish: () => setCreateProcessing(false),
            },
        );
    };

    const handleCreateOutlet = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!addOutletName.trim() || addOutletProcessing) return;

        setAddOutletProcessing(true);
        setAddOutletError('');

        try {
            const csrfToken =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const response = await fetch(outletsStore.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ name: addOutletName.trim() }),
            });

            const data = (await response.json()) as { id?: string; name?: string; errors?: Record<string, string[]> };

            if (!response.ok) {
                const msg = data.errors?.name?.[0] ?? 'Failed to create outlet.';
                setAddOutletError(msg);
                return;
            }

            const created = { id: data.id!, name: data.name! };
            setLocalOutlets((prev) => [...prev, created]);
            setSelectedOutletId(created.id);
            setAddOutletModalOpen(false);
            setAddOutletName('');
        } catch {
            setAddOutletError('Network error. Please try again.');
        } finally {
            setAddOutletProcessing(false);
        }
    };

    if (!nodeSelection) {
        return null;
    }

    const selectedNode = nodeSelection.items.find(
        (node) => node.id === (nodeSelection.current_node_id ?? ''),
    );
    const currentOutletName =
        nodeSelection.current_scope_type === 'outlet'
            ? (page.props.outlets ?? []).find((o) => o.id === (nodeSelection.current_outlet_id ?? ''))?.name
              ?? nodeSelection.items.find((n) => n.outlet_id === (nodeSelection.current_outlet_id ?? ''))?.outlet
            : null;
    const currentLabel =
        nodeSelection.current_scope_type === 'outlet' && currentOutletName
            ? currentOutletName
            : selectedNode
              ? `${selectedNode.outlet} / ${selectedNode.node}`
              : null;
    const selectionUnchanged =
        pendingScopeType === nodeSelection.current_scope_type &&
        pendingOutletId === nodeSelection.current_outlet_id &&
        pendingNodeId === nodeSelection.current_node_id;

    const selectOutlet = (outlet: OutletGroup) => {
        setPendingScopeType('outlet');
        setPendingOutletId(outlet.id);
        setPendingNodeId(null);
    };

    const selectWarehouse = (node: NodeItem) => {
        if (!node.id) return;
        setPendingScopeType('warehouse');
        setPendingOutletId(node.outlet_id ?? null);
        setPendingNodeId(node.id);
    };

    return (
        <div ref={rootRef} className="relative w-full max-w-xl min-w-0">
            <button
                type="button"
                className="flex h-10 w-full min-w-0 items-center gap-2 rounded-lg bg-muted px-2 text-left transition-all hover:bg-accent focus:ring-2 focus:ring-primary/20 focus:outline-none sm:px-3 lg:h-11 lg:gap-3 lg:px-4"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={handleSwitcherToggle}
            >
                <span className="material-symbols-outlined shrink-0 text-primary">
                    account_tree
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-[9px] leading-none font-bold tracking-wider text-muted-foreground/60 uppercase">
                        Current Scope
                    </p>
                    <p className="truncate text-sm font-bold text-foreground">
                        {currentLabel ?? 'Select outlet or warehouse'}
                    </p>
                </div>
                <span
                    className={cn(
                        'material-symbols-outlined ml-auto shrink-0 text-lg text-muted-foreground transition-transform',
                        open && 'rotate-180',
                    )}
                >
                    expand_more
                </span>
            </button>

            <div
                className={cn(
                    'fixed top-16 right-4 left-4 z-[60] mt-2 origin-top-left overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-200 sm:absolute sm:top-full sm:right-auto sm:left-0 sm:w-[min(calc(100vw-2rem),30rem)]',
                    open
                        ? 'visible scale-100 opacity-100'
                        : 'invisible scale-95 opacity-0',
                )}
            >
                <div className="border-b border-border bg-muted p-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search outlet or warehouse..."
                            className="w-full rounded-lg border border-input bg-background py-2 pr-4 pl-9 text-sm focus:border-ring focus:ring-1 focus:ring-ring"
                        />
                    </div>
                </div>

                <div className="max-h-[420px] space-y-1 overflow-y-auto p-2">
                    {hierarchy.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                            No warehouses are available.
                        </p>
                    ) : filteredHierarchy.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                            No warehouses match your search.
                        </p>
                    ) : (
                        filteredHierarchy.map((outlet, outletIndex) => {
                            const hasWarehouses = outlet.nodes.length > 0;
                            const outletExpanded =
                                !hasWarehouses ||
                                searchQuery.trim() !== '' ||
                                openOutlet === outlet.key;
                            const outletSelected =
                                pendingScopeType === 'outlet' &&
                                pendingOutletId === outlet.id;

                            return (
                                <div key={outlet.key}>
                                    {outletIndex > 0 && (
                                        <div className="my-2 h-px bg-border" />
                                    )}

                                    {/* Outlet with no warehouses — show as a direct selectable row */}
                                    {!hasWarehouses ? (
                                        <button
                                            type="button"
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors',
                                                outletSelected
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'hover:bg-muted',
                                            )}
                                            onClick={() => selectOutlet(outlet)}
                                        >
                                            <span className={cn('material-symbols-outlined text-sm', outletSelected ? '' : 'text-muted-foreground')}>
                                                storefront
                                            </span>
                                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                                                {outlet.name}
                                            </span>
                                            {outletSelected && (
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                            )}
                                        </button>
                                    ) : (
                                        /* Outlet with warehouses — selectable header + collapsible warehouse list */
                                        <>
                                            <button
                                                type="button"
                                                className={cn(
                                                    'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors',
                                                    outletSelected
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'hover:bg-muted',
                                                    !outletSelected && outletExpanded && 'bg-primary/10',
                                                )}
                                                aria-expanded={outletExpanded}
                                                onClick={() => {
                                                    selectOutlet(outlet);
                                                    setOpenOutlet(outlet.key);
                                                }}
                                            >
                                                <span className={cn('material-symbols-outlined text-sm', outletSelected ? '' : outletExpanded ? 'text-primary' : 'text-muted-foreground')}>
                                                    storefront
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                                                    {outlet.name}
                                                </span>
                                                {outletSelected ? (
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                ) : (
                                                    <span className={cn('material-symbols-outlined text-xs text-muted-foreground transition-transform', outletExpanded && 'rotate-90')}>
                                                        chevron_right
                                                    </span>
                                                )}
                                            </button>

                                            <div
                                                className={cn(
                                                    'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                                    outletExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                                )}
                                            >
                                                <div className="overflow-hidden">
                                                    <div className="ml-6 space-y-1 border-l-2 border-primary/20">

                                                        {outlet.nodes.map((node) => {
                                                            const warehouseSelected = pendingScopeType === 'warehouse' && pendingNodeId === node.id;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={node.id}
                                                                    className={cn(
                                                                        'ml-2 flex w-[calc(100%-0.5rem)] items-center justify-between gap-2 rounded-lg p-2 text-left transition-colors',
                                                                        warehouseSelected
                                                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                                                            : 'text-muted-foreground hover:bg-muted',
                                                                    )}
                                                                    onClick={() => selectWarehouse(node)}
                                                                >
                                                                    <span className="flex min-w-0 items-center gap-2">
                                                                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                                                                        <span className="truncate text-xs font-medium">{node.node}</span>
                                                                    </span>
                                                                    {warehouseSelected && (
                                                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="border-t border-border bg-muted p-3">
                    <div className={cn('grid gap-2', canCreateWarehouse ? 'grid-cols-2' : 'grid-cols-1')}>
                        {canCreateWarehouse && (
                            <button
                                type="button"
                                className="flex min-w-0 items-center justify-center gap-2 rounded-lg bg-card px-3 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-accent"
                                onClick={handleOpenCreateModal}
                                disabled={!createNodeUrl}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    add_circle
                                </span>
                                <span className="truncate">Register Warehouse</span>
                            </button>
                        )}

                        <button
                            type="button"
                            className="flex min-w-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                            onClick={handleApplySelection}
                            disabled={
                                pendingScopeType === null ||
                                selectionUnchanged ||
                                processing
                            }
                        >
                            <span className="material-symbols-outlined text-sm">
                                check
                            </span>
                            {processing ? 'Applying...' : 'Apply'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Register Warehouse Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent>
                    <form onSubmit={handleRegisterWarehouse} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Register New Warehouse</DialogTitle>
                            <DialogDescription>
                                Select or create an outlet, then select or
                                create a warehouse to register.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label
                                    className="mb-1 block text-sm font-medium text-foreground"
                                    htmlFor="create_outlet_select"
                                >
                                    Outlet
                                </label>
                                <SearchableSelect
                                    id="create_outlet_select"
                                    value={selectedOutletId}
                                    placeholder="Search or select outlet"
                                    addNewLabel={canCreateOutlet ? 'Add outlet' : undefined}
                                    onAddNew={canCreateOutlet ? (query) => {
                                        setAddOutletName(query);
                                        setAddOutletError('');
                                        setAddOutletModalOpen(true);
                                    } : undefined}
                                    onChange={(event) => {
                                        setSelectedOutletId(event.target.value);
                                    }}
                                    required
                                >
                                    <option value="">Select outlet</option>
                                    {outletOptions.map((outlet) => (
                                        <option key={outlet.id} value={outlet.id}>
                                            {outlet.name}
                                        </option>
                                    ))}
                                </SearchableSelect>
                            </div>

                            <div>
                                <label
                                    className="mb-1 block text-sm font-medium text-foreground"
                                    htmlFor="create_warehouse_name"
                                >
                                    Warehouse
                                </label>
                                <Input
                                    id="create_warehouse_name"
                                    value={createWarehouseName}
                                    onChange={(event) =>
                                        setCreateWarehouseName(event.target.value)
                                    }
                                    className="h-11 rounded-lg"
                                    placeholder="Enter warehouse name"
                                    required
                                />
                                {createErrors.create_warehouse_name && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {createErrors.create_warehouse_name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-11"
                                onClick={() => setCreateModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="h-11"
                                disabled={createProcessing}
                            >
                                {createProcessing ? 'Registering...' : 'Register Warehouse'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Outlet Sub-Modal */}
            <Dialog
                open={addOutletModalOpen}
                onOpenChange={(open) => {
                    setAddOutletModalOpen(open);
                    if (!open) {
                        setAddOutletError('');
                    }
                }}
            >
                <DialogContent className="z-[110]">
                    <form onSubmit={handleCreateOutlet} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Add Outlet</DialogTitle>
                            <DialogDescription>
                                Enter a name for the new outlet.
                            </DialogDescription>
                        </DialogHeader>

                        <div>
                            <label
                                className="mb-1 block text-sm font-medium text-foreground"
                                htmlFor="add_outlet_name"
                            >
                                Outlet Name
                            </label>
                            <Input
                                id="add_outlet_name"
                                value={addOutletName}
                                onChange={(event) => setAddOutletName(event.target.value)}
                                className="h-11 rounded-lg"
                                placeholder="Enter outlet name"
                                required
                                autoFocus
                            />
                            {addOutletError && (
                                <p className="mt-1 text-sm text-destructive">
                                    {addOutletError}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-11"
                                onClick={() => setAddOutletModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="h-11"
                                disabled={addOutletProcessing}
                            >
                                {addOutletProcessing ? 'Creating...' : 'Create Outlet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}

