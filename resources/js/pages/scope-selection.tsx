import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type SelectionScope = 'outlet' | 'warehouse';

type NodeItem = {
    id: string;
    outlet_id?: string;
    outlet: string;
    node: string;
};

type NodeSelectionData = {
    current_scope_type: SelectionScope | null;
    current_outlet_id: string | null;
    current_node_id: string | null;
    items: NodeItem[];
};

type SharedProps = {
    errors?: {
        outlet_id?: string;
        warehouse_id?: string;
    };
    nodeSelection?: NodeSelectionData;
    auth?: {
        can: Record<string, boolean>;
    };
};

type OutletGroup = {
    key: string;
    id: string;
    name: string;
    nodes: NodeItem[];
};

export default function ScopeSelection() {
    const page = usePage<SharedProps>();
    const { errors } = page.props;
    const nodeSelection = page.props.nodeSelection;
    const can = page.props.auth?.can ?? {};
    const canCreateOutlet = can['outlets-create'] ?? false;
    const canCreateWarehouse = can['warehouses-create'] ?? false;
    const nodes = nodeSelection?.items ?? [];

    const initialNode =
        nodes.find((node) => node.id === (nodeSelection?.current_node_id ?? '')) ??
        nodes[0];
    const initialOutletKey =
        initialNode !== undefined
            ? (initialNode.outlet || 'Unknown Outlet').toLowerCase()
            : null;

    const [selectedNodeId, setSelectedNodeId] = useState(
        nodeSelection?.current_node_id ?? nodes[0]?.id ?? '',
    );
    const [selectedOutletId, setSelectedOutletId] = useState(
        nodeSelection?.current_outlet_id ?? '',
    );
    const [selectedScopeType, setSelectedScopeType] = useState<SelectionScope>(
        nodeSelection?.current_scope_type ?? 'warehouse',
    );
    const [openOutlet, setOpenOutlet] = useState<string | null>(initialOutletKey);
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState(false);

    // Modal and form states
    const [showCreateOutletModal, setShowCreateOutletModal] = useState(false);
    const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
    const [outletName, setOutletName] = useState('');
    const [warehouseName, setWarehouseName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [creationError, setCreationError] = useState('');

    const canSubmit =
        (selectedScopeType === 'outlet' && selectedOutletId !== '') ||
        (selectedScopeType === 'warehouse' && selectedNodeId !== '');

    const handleCreateOutlet = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreating(true);
        setCreationError('');

        try {
            const response = await fetch('/outlets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                        ?.content || '',
                },
                body: JSON.stringify({ name: outletName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create outlet');
            }

            setOutletName('');
            setShowCreateOutletModal(false);
            router.reload();
        } catch (error) {
            setCreationError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateWarehouse = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreating(true);
        setCreationError('');

        try {
            const response = await fetch('/warehouses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                        ?.content || '',
                },
                body: JSON.stringify({
                    outlet_id: selectedOutletId,
                    name: warehouseName,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create warehouse');
            }

            setWarehouseName('');
            setShowCreateWarehouseModal(false);
            router.reload();
        } catch (error) {
            setCreationError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsCreating(false);
        }
    };

    const hierarchy = useMemo<OutletGroup[]>(() => {
        const outletMap = new Map<string, OutletGroup>();
        const term = searchQuery.trim().toLowerCase();

        for (const node of nodes) {
            const outletName = node.outlet || 'Unknown Outlet';

            if (
                term !== '' &&
                !outletName.toLowerCase().includes(term) &&
                !node.node.toLowerCase().includes(term)
            ) {
                continue;
            }

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
    }, [nodes, searchQuery]);

    const handleOutletToggle = (outletKey: string) => {
        if (searchQuery.trim() !== '') {
            return;
        }

        setOpenOutlet((current) => (current === outletKey ? null : outletKey));
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        setProcessing(true);

        router.post(
            '/scope-selection',
            {
                scope_type: selectedScopeType,
                outlet_id: selectedScopeType === 'outlet' ? selectedOutletId : null,
                warehouse_id: selectedScopeType === 'warehouse' ? selectedNodeId : null,
                redirect_to: '/dashboard',
            },
            {
                preserveScroll: false,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted dark:bg-card">
            <Head title="Scope Selection" />

            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Scope Selection' }]}
                    title="Select active outlet or warehouse"
                    description="Choose an outlet for all warehouse operations, or a warehouse for warehouse-specific data."
                />

                <form
                    onSubmit={onSubmit}
                    className="space-y-4 rounded-xl border border-amber-200/70 bg-white p-6 shadow-sm dark:border-border dark:bg-card"
                >
                    {nodes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No warehouses are available yet. Please complete setup first.
                        </p>
                    ) : (
                        <div className="rounded-xl border border-border/40 bg-card p-3 dark:border-border dark:bg-background">
                            <div className="relative mb-3">
                                <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                    search
                                </span>
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search outlet or warehouse..."
                                    className="border-border/40 bg-white pl-9 dark:border-border dark:bg-card"
                                />
                            </div>

                            <div className="max-h-[460px] space-y-1 overflow-y-auto pr-1">
                                {hierarchy.length === 0 ? (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No warehouses match your search.
                                    </p>
                                ) : (
                                    hierarchy.map((outlet, outletIndex) => {
                                        const outletExpanded =
                                            searchQuery.trim() !== '' || openOutlet === outlet.key;

                                        return (
                                            <div key={outlet.key}>
                                                {outletIndex > 0 && (
                                                    <div className="my-2 h-px bg-border/30 dark:bg-border" />
                                                )}

                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted',
                                                        outletExpanded ? 'bg-primary/5 dark:bg-primary/10' : '',
                                                    )}
                                                    aria-expanded={outletExpanded}
                                                    onClick={() => handleOutletToggle(outlet.key)}
                                                >
                                                    <span
                                                        className={cn(
                                                            'material-symbols-outlined text-sm',
                                                            outletExpanded ? 'text-primary' : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        storefront
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                                                        {outlet.name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'material-symbols-outlined text-sm text-muted-foreground transition-transform',
                                                            outletExpanded && 'rotate-90',
                                                        )}
                                                    >
                                                        chevron_right
                                                    </span>
                                                </button>

                                                <div
                                                    className={cn(
                                                        'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                                        outletExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                                    )}
                                                >
                                                    <div className="overflow-hidden">
                                                        <div className="ml-6 space-y-1 border-l-2 border-primary/20">
                                                            <button
                                                                type="button"
                                                                className={cn(
                                                                    'ml-2 flex w-[calc(100%-0.5rem)] items-center justify-between gap-2 rounded-lg p-2 text-left transition-colors',
                                                                    selectedScopeType === 'outlet' && selectedOutletId === outlet.id
                                                                        ? 'bg-primary text-white shadow-sm'
                                                                        : 'text-muted-foreground hover:bg-muted',
                                                                )}
                                                                onClick={() => {
                                                                    setSelectedScopeType('outlet');
                                                                    setSelectedOutletId(outlet.id);
                                                                    setSelectedNodeId('');
                                                                }}
                                                            >
                                                                <span className="flex min-w-0 items-center gap-2">
                                                                    <span className="material-symbols-outlined text-sm">
                                                                        select_all
                                                                    </span>
                                                                    <span className="truncate text-xs font-medium">
                                                                        All warehouses
                                                                    </span>
                                                                </span>

                                                                {selectedScopeType === 'outlet' && selectedOutletId === outlet.id && (
                                                                    <span className="material-symbols-outlined text-xs">
                                                                        check_circle
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {outlet.nodes.map((node) => {
                                                                const selected =
                                                                    selectedScopeType === 'warehouse' && selectedNodeId === node.id;

                                                                return (
                                                                    <button
                                                                        key={node.id}
                                                                        type="button"
                                                                        className={cn(
                                                                            'ml-2 flex w-[calc(100%-0.5rem)] items-center justify-between gap-2 rounded-lg p-2 text-left transition-colors',
                                                                            selected
                                                                                ? 'bg-primary text-white shadow-sm'
                                                                                : 'text-muted-foreground hover:bg-muted',
                                                                        )}
                                                                        onClick={() => {
                                                                            setSelectedScopeType('warehouse');
                                                                            setSelectedOutletId(node.outlet_id ?? '');
                                                                            setSelectedNodeId(node.id);
                                                                        }}
                                                                    >
                                                                        <span className="flex min-w-0 items-center gap-2">
                                                                            <span className="material-symbols-outlined text-sm">
                                                                                inventory_2
                                                                            </span>
                                                                            <span className="truncate text-xs font-medium">
                                                                                {node.node}
                                                                            </span>
                                                                        </span>

                                                                        {selected && (
                                                                            <span className="material-symbols-outlined text-xs">
                                                                                check_circle
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {errors?.outlet_id && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.outlet_id}</p>
                    )}

                    {errors?.warehouse_id && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.warehouse_id}</p>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            disabled={!canSubmit || processing}
                            className="rounded-lg flex-1"
                        >
                            {processing ? 'Applying...' : 'Continue'}
                        </Button>

                        {canCreateOutlet && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateOutletModal(true)}
                                className="rounded-lg"
                            >
                                <span className="material-symbols-outlined text-base mr-2">add</span>
                                Outlet
                            </Button>
                        )}

                        {canCreateWarehouse && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateWarehouseModal(true)}
                                disabled={selectedOutletId === ''}
                                className="rounded-lg"
                            >
                                <span className="material-symbols-outlined text-base mr-2">add</span>
                                Warehouse
                            </Button>
                        )}
                    </div>
                </form>

                {/* Create Outlet Modal */}
                <Dialog open={showCreateOutletModal} onOpenChange={setShowCreateOutletModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Outlet</DialogTitle>
                            <DialogDescription>
                                Enter a name for the new outlet.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateOutlet} className="space-y-4">
                            <div>
                                <label htmlFor="outlet-name" className="block text-sm font-medium mb-2">
                                    Outlet Name
                                </label>
                                <Input
                                    id="outlet-name"
                                    type="text"
                                    value={outletName}
                                    onChange={(e) => setOutletName(e.target.value)}
                                    placeholder="e.g., Main Branch"
                                    required
                                    autoFocus
                                    disabled={isCreating}
                                />
                            </div>

                            {creationError && (
                                <p className="text-sm text-red-600 dark:text-red-400">{creationError}</p>
                            )}

                            <div className="flex gap-2 justify-end pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateOutletModal(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating || outletName.trim() === ''}>
                                    {isCreating ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Create Warehouse Modal */}
                <Dialog open={showCreateWarehouseModal} onOpenChange={setShowCreateWarehouseModal}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Warehouse</DialogTitle>
                            <DialogDescription>
                                Enter a name for the new warehouse.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateWarehouse} className="space-y-4">
                            <div>
                                <label htmlFor="warehouse-name" className="block text-sm font-medium mb-2">
                                    Warehouse Name
                                </label>
                                <Input
                                    id="warehouse-name"
                                    type="text"
                                    value={warehouseName}
                                    onChange={(e) => setWarehouseName(e.target.value)}
                                    placeholder="e.g., Warehouse A"
                                    required
                                    autoFocus
                                    disabled={isCreating}
                                />
                            </div>

                            {creationError && (
                                <p className="text-sm text-red-600 dark:text-red-400">{creationError}</p>
                            )}

                            <div className="flex gap-2 justify-end pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateWarehouseModal(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreating || warehouseName.trim() === ''}>
                                    {isCreating ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
