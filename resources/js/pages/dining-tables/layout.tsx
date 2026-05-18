import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as diningTablesIndex, update as diningTablesUpdate } from '@/routes/dining-tables';
import { update as updateLayout } from '@/routes/dining-table-layout';
import { cn } from '@/lib/utils';

type Outlet = { id: number; name: string };

type DiningArea = {
    id: number;
    name: string;
    outlet_id: number;
    layout_width: number;
    layout_height: number;
};

type DiningTable = {
    id: number;
    outlet_id: number;
    dining_area_id: number;
    name: string;
    code: string | null;
    capacity: number;
    status: string;
    shape: 'rectangle' | 'square' | 'circle' | 'oval';
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    rotation: number;
    is_active: boolean;
};

type LayoutTable = DiningTable & {
    _x: number;
    _y: number;
    _width: number;
    _height: number;
    _rotation: number;
};

type Props = {
    outlets: Outlet[];
    diningAreas: DiningArea[];
    tables: DiningTable[];
    scopedOutletId: string | null;
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    available: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-800 dark:text-emerald-300' },
    occupied:  { bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-300 dark:border-red-700',     text: 'text-red-800 dark:text-red-300' },
    reserved:  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-800 dark:text-amber-300' },
    cleaning:  { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-300 dark:border-blue-700',   text: 'text-blue-800 dark:text-blue-300' },
    inactive:  { bg: 'bg-stone-50 dark:bg-stone-800',    border: 'border-stone-300 dark:border-stone-600', text: 'text-stone-500 dark:text-stone-400' },
};

export default function DiningTableLayout({ outlets, diningAreas, tables, scopedOutletId }: Props) {
    const [selectedOutletId, setSelectedOutletId] = useState(scopedOutletId ?? '');
    const [selectedAreaId, setSelectedAreaId] = useState('');
    const [layoutTables, setLayoutTables] = useState<LayoutTable[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    type EditForm = { name: string; code: string; capacity: string; shape: string; status: string; is_active: string };
    const [editingTable, setEditingTable] = useState<LayoutTable | null>(null);
    const [editForm, setEditForm] = useState<EditForm | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editErrors, setEditErrors] = useState<Partial<EditForm>>({});
    const [canvasScale, setCanvasScale] = useState(1);
    const canvasRef = useRef<HTMLDivElement>(null);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const canvasColumnRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const dragging = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null);

    const filteredAreas = useMemo(() => {
        if (!selectedOutletId) return [];
        return diningAreas.filter((a) => String(a.outlet_id) === selectedOutletId);
    }, [diningAreas, selectedOutletId]);

    const selectedArea = useMemo(() => {
        return diningAreas.find((a) => String(a.id) === selectedAreaId) ?? null;
    }, [diningAreas, selectedAreaId]);

    useEffect(() => {
        if (!selectedAreaId) {
            setLayoutTables([]);
            return;
        }
        const areaTables = tables.filter((t) => String(t.dining_area_id) === selectedAreaId);
        setLayoutTables(areaTables.map((t) => ({
            ...t,
            _x: t.position_x,
            _y: t.position_y,
            _width: t.width,
            _height: t.height,
            _rotation: t.rotation,
        })));
    }, [selectedAreaId, tables]);

    useEffect(() => {
        if (!selectedArea) return;

        const measure = () => {
            const el = measureRef.current;
            if (!el) return;
            const w = el.offsetWidth;
            if (w === 0) return;
            const h = window.innerHeight * 0.65;
            setCanvasScale(Math.min(w / selectedArea.layout_width, h / selectedArea.layout_height, 1));
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [selectedArea]);

    const handleOutletChange = (outletId: string) => {
        setSelectedOutletId(outletId);
        setSelectedAreaId('');
        setSelectedTableId(null);
    };

    const handleAreaChange = (areaId: string) => {
        setSelectedAreaId(areaId);
        setSelectedTableId(null);
    };

    const onPointerDown = useCallback((e: React.PointerEvent, tableId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const table = layoutTables.find((t) => t.id === tableId);
        if (!table) return;

        setSelectedTableId(tableId);

        dragging.current = {
            id: tableId,
            startX: e.clientX,
            startY: e.clientY,
            origX: table._x,
            origY: table._y,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [layoutTables]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging.current) return;
        const canvas = canvasRef.current;
        if (!canvas || !selectedArea) return;

        const dx = (e.clientX - dragging.current.startX) / canvasScale;
        const dy = (e.clientY - dragging.current.startY) / canvasScale;

        const dragId = dragging.current.id;
        const table = layoutTables.find((t) => t.id === dragId);
        if (!table) return;

        const newX = Math.max(0, Math.min(selectedArea.layout_width - table._width, dragging.current.origX + dx));
        const newY = Math.max(0, Math.min(selectedArea.layout_height - table._height, dragging.current.origY + dy));

        setLayoutTables((prev) => prev.map((t) =>
            t.id === dragId ? { ...t, _x: newX, _y: newY } : t
        ));
    }, [layoutTables, selectedArea, canvasScale]);

    const onPointerUp = useCallback(() => {
        dragging.current = null;
    }, []);

    const updateDimension = (tableId: number, field: '_width' | '_height' | '_rotation', value: number) => {
        setLayoutTables((prev) => prev.map((t) => t.id === tableId ? { ...t, [field]: value } : t));
    };

    const selectedTable = useMemo(() => {
        return layoutTables.find((t) => t.id === selectedTableId) ?? null;
    }, [layoutTables, selectedTableId]);

    async function saveLayout() {
        if (!selectedAreaId || !selectedOutletId || layoutTables.length === 0) return;

        setSaving(true);
        setSaveMsg(null);

        const payload = {
            outlet_id:      Number(selectedOutletId),
            dining_area_id: Number(selectedAreaId),
            tables: layoutTables.map((t) => ({
                id:         t.id,
                position_x: Math.round(t._x * 100) / 100,
                position_y: Math.round(t._y * 100) / 100,
                width:      Math.round(t._width * 100) / 100,
                height:     Math.round(t._height * 100) / 100,
                rotation:   Math.round(t._rotation),
            })),
        };

        try {
            const res = await fetch(updateLayout.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSaveMsg('Layout saved successfully.');
                router.reload({ only: ['tables'] });
            } else {
                const data = await res.json();
                setSaveMsg(data.message ?? 'Failed to save layout.');
            }
        } catch {
            setSaveMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    function openEdit(table: LayoutTable) {
        setEditingTable(table);
        setEditForm({
            name:      table.name,
            code:      table.code ?? '',
            capacity:  String(table.capacity),
            shape:     table.shape,
            status:    table.status,
            is_active: table.is_active ? 'true' : 'false',
        });
        setEditErrors({});
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTable || !editForm) return;
        setEditSaving(true);
        setEditErrors({});

        router.put(
            diningTablesUpdate.url(editingTable.id),
            {
                _redirect:      window.location.href,
                outlet_id:      editingTable.outlet_id,
                dining_area_id: editingTable.dining_area_id,
                name:           editForm.name,
                code:           editForm.code || null,
                capacity:       Number(editForm.capacity),
                shape:          editForm.shape,
                status:         editForm.status,
                is_active:      editForm.is_active === 'true',
                position_x:     Math.round(editingTable._x * 100) / 100,
                position_y:     Math.round(editingTable._y * 100) / 100,
                width:          Math.round(editingTable._width * 100) / 100,
                height:         Math.round(editingTable._height * 100) / 100,
                rotation:       Math.round(editingTable._rotation),
                sort_order:     0,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingTable(null);
                    setEditForm(null);
                },
                onError: (errors) => setEditErrors(errors as Partial<EditForm>),
                onFinish: () => setEditSaving(false),
            },
        );
    }

    return (
        <>
            <Head title="Dining Table Layout" />
            <PageHeader
                breadcrumbs={[
                    { label: 'Home', href: dashboard.url() },
                    { label: 'Dining Tables', href: diningTablesIndex.url() },
                    { label: 'Layout Editor' },
                ]}
                title="Dining Table Layout"
                description="Drag and reposition tables within the selected dining area."
            />

            {/* Outlet selector */}
            <div className="mb-4 flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Outlet</label>
                    <SearchableSelect
                        value={selectedOutletId}
                        onChange={(e) => handleOutletChange(e.target.value)}
                        disabled={scopedOutletId !== null}
                    >
                        <option value="">Select outlet…</option>
                        {outlets.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                    </SearchableSelect>
                </div>
            </div>

            {/* Dining area tabs */}
            {selectedOutletId && (
                <div className="mb-5 flex items-center gap-0 border-b border-border/30 dark:border-stone-700">
                    {filteredAreas.length === 0 ? (
                        <p className="pb-2 text-sm text-muted-foreground">No dining areas for this outlet.</p>
                    ) : (
                        <>
                            {filteredAreas.map((area) => (
                                <button
                                    key={area.id}
                                    type="button"
                                    onClick={() => handleAreaChange(String(area.id))}
                                    className={cn(
                                        'relative -mb-px px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap',
                                        selectedAreaId === String(area.id)
                                            ? 'border-b-2 border-primary text-primary'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {area.name}
                                </button>
                            ))}
                            {selectedAreaId && layoutTables.length > 0 && (
                                <div className="ml-auto flex items-center gap-3 pb-1">
                                    {saveMsg && (
                                        <p className={cn('text-sm font-semibold', saveMsg.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                                            {saveMsg}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={saveLayout}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        {saving ? 'Saving…' : 'Save Layout'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="flex gap-6 pb-6">
                {/* Canvas */}
                <div ref={canvasColumnRef} className="min-w-0 flex-1">
                    <div ref={measureRef} style={{ width: '100%', height: 0 }} />
                    {!selectedAreaId ? (
                        <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-border/30 bg-muted/30 dark:border-stone-700 dark:bg-stone-900/30">
                            <div className="text-center">
                                <span className="material-symbols-outlined mb-2 block text-[48px] text-muted-foreground/30">table_restaurant</span>
                                <p className="text-sm font-semibold text-muted-foreground">
                                    {selectedOutletId ? 'Select a dining area tab above.' : 'Select an outlet to get started.'}
                                </p>
                            </div>
                        </div>
                    ) : layoutTables.length === 0 ? (
                        <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-border/30 bg-muted/30 dark:border-stone-700 dark:bg-stone-900/30">
                            <div className="text-center">
                                <span className="material-symbols-outlined mb-2 block text-[48px] text-muted-foreground/30">table_restaurant</span>
                                <p className="text-sm font-semibold text-muted-foreground">No active tables in this dining area.</p>
                                <p className="mt-1 text-xs text-muted-foreground/70">Create tables in Dining Tables to see them here.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                        {canvasScale < 0.99 && (
                            <p className="mb-1.5 text-right text-[11px] text-muted-foreground">
                                Scale: {Math.round(canvasScale * 100)}% &nbsp;·&nbsp; {selectedArea?.layout_width} × {selectedArea?.layout_height} px
                            </p>
                        )}
                        <div ref={canvasWrapperRef} className="rounded-xl border border-border/20 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-950 overflow-hidden">
                            <div
                                style={{
                                    width:  (selectedArea?.layout_width ?? 1000) * canvasScale,
                                    height: (selectedArea?.layout_height ?? 700) * canvasScale,
                                }}
                            >
                                <div
                                    ref={canvasRef}
                                    className="relative select-none bg-[length:20px_20px] bg-[linear-gradient(to_right,theme(colors.border/0.3)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/0.3)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.stone.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.stone.800)_1px,transparent_1px)]"
                                    style={{
                                        width:         selectedArea?.layout_width ?? 1000,
                                        height:        selectedArea?.layout_height ?? 700,
                                        transform:     `scale(${canvasScale})`,
                                        transformOrigin: 'top left',
                                    }}
                                    onPointerMove={onPointerMove}
                                    onPointerUp={onPointerUp}
                                    onPointerLeave={onPointerUp}
                                    onClick={() => setSelectedTableId(null)}
                                >
                                    {layoutTables.map((table) => {
                                        const colors = STATUS_COLORS[table.status] ?? STATUS_COLORS.inactive;
                                        const isSelected = selectedTableId === table.id;

                                        return (
                                            <div
                                                key={table.id}
                                                className={cn(
                                                    'absolute flex cursor-grab items-center justify-center active:cursor-grabbing',
                                                    isSelected && 'ring-2 ring-primary ring-offset-1',
                                                )}
                                                style={{
                                                    left:      table._x,
                                                    top:       table._y,
                                                    width:     table._width,
                                                    height:    table._height,
                                                    transform: `rotate(${table._rotation}deg)`,
                                                }}
                                                onPointerDown={(e) => onPointerDown(e, table.id)}
                                                onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }}
                                                onDoubleClick={(e) => { e.stopPropagation(); openEdit(table); }}
                                            >
                                                <div
                                                    className={cn(
                                                        'border-2 flex flex-col items-center justify-center w-full h-full overflow-hidden',
                                                        colors.bg,
                                                        colors.border,
                                                        (table.shape === 'circle') && 'rounded-full',
                                                        (table.shape === 'oval') && 'rounded-[50%]',
                                                        (table.shape === 'square') && 'rounded-lg',
                                                        (table.shape === 'rectangle') && 'rounded-md',
                                                    )}
                                                >
                                                    <span className={cn('text-[10px] font-bold leading-tight text-center px-1 truncate w-full text-center', colors.text)}>
                                                        {table.name}
                                                    </span>
                                                    <span className={cn('text-[9px] leading-none', colors.text, 'opacity-70')}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>person</span>
                                                        {table.capacity}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        </>
                    )}
                </div>

                {/* Properties panel */}
                {selectedTable && (
                    <div className="w-64 shrink-0">
                        <div className="rounded-xl border border-border/20 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
                            <h3 className="mb-4 text-sm font-bold text-foreground dark:text-stone-100">Table Properties</h3>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Name</p>
                                    <p className="mt-0.5 text-sm font-semibold text-foreground dark:text-stone-100">{selectedTable.name}</p>
                                </div>
                                {selectedTable.code && (
                                    <div>
                                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Code</p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground dark:text-stone-400">{selectedTable.code}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Shape</p>
                                    <p className="mt-0.5 text-sm capitalize text-foreground dark:text-stone-100">{selectedTable.shape}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Capacity</p>
                                    <p className="mt-0.5 text-sm text-foreground dark:text-stone-100">{selectedTable.capacity} seats</p>
                                </div>

                                <div className="border-t border-border/20 pt-3 dark:border-stone-700">
                                    <p className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Position</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase">X</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={Math.round(selectedTable._x)}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    setLayoutTables((prev) => prev.map((t) => t.id === selectedTable.id ? { ...t, _x: v } : t));
                                                }}
                                                className="mt-0.5 w-full rounded border border-border/30 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase">Y</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={Math.round(selectedTable._y)}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    setLayoutTables((prev) => prev.map((t) => t.id === selectedTable.id ? { ...t, _y: v } : t));
                                                }}
                                                className="mt-0.5 w-full rounded border border-border/30 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Size</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase">W</label>
                                            <input
                                                type="number"
                                                min="20"
                                                value={Math.round(selectedTable._width)}
                                                onChange={(e) => updateDimension(selectedTable.id, '_width', Number(e.target.value))}
                                                className="mt-0.5 w-full rounded border border-border/30 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase">H</label>
                                            <input
                                                type="number"
                                                min="20"
                                                value={Math.round(selectedTable._height)}
                                                onChange={(e) => updateDimension(selectedTable.id, '_height', Number(e.target.value))}
                                                className="mt-0.5 w-full rounded border border-border/30 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Rotation (°)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="360"
                                        value={Math.round(selectedTable._rotation)}
                                        onChange={(e) => updateDimension(selectedTable.id, '_rotation', Number(e.target.value))}
                                        className="mt-0.5 w-full rounded border border-border/30 bg-white px-2 py-1 text-xs font-bold text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-4 rounded-xl border border-border/20 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
                            <p className="mb-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Status Legend</p>
                            <div className="space-y-1.5">
                                {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                                    <div key={status} className="flex items-center gap-2">
                                        <div className={cn('h-3 w-3 rounded-sm border', colors.bg, colors.border)} />
                                        <span className="text-[11px] capitalize text-muted-foreground dark:text-stone-400">{status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend (no table selected) */}
                {!selectedTable && selectedAreaId && layoutTables.length > 0 && (
                    <div className="w-56 shrink-0">
                        <div className="rounded-xl border border-border/20 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
                            <p className="mb-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Status Legend</p>
                            <div className="space-y-1.5">
                                {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                                    <div key={status} className="flex items-center gap-2">
                                        <div className={cn('h-3 w-3 rounded-sm border', colors.bg, colors.border)} />
                                        <span className="text-[11px] capitalize text-muted-foreground dark:text-stone-400">{status}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-[10px] text-muted-foreground/70 dark:text-stone-500">Click a table to select and adjust its properties.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit table modal */}
            {editingTable && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingTable(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-stone-900" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-border/20 px-6 py-4 dark:border-stone-700">
                            <h2 className="text-base font-bold text-foreground dark:text-stone-100">Edit Table</h2>
                            <button type="button" onClick={() => setEditingTable(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-4 px-6 py-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm((f) => f && ({ ...f, name: e.target.value }))}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                    />
                                    {editErrors.name && <p className="mt-1 text-xs text-red-500">{editErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Code</label>
                                    <input
                                        type="text"
                                        value={editForm.code}
                                        onChange={(e) => setEditForm((f) => f && ({ ...f, code: e.target.value }))}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                        placeholder="e.g. T-01"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editForm.capacity}
                                        onChange={(e) => setEditForm((f) => f && ({ ...f, capacity: e.target.value }))}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Shape</label>
                                    <select
                                        value={editForm.shape}
                                        onChange={(e) => setEditForm((f) => f && ({ ...f, shape: e.target.value }))}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                    >
                                        <option value="rectangle">Rectangle</option>
                                        <option value="square">Square</option>
                                        <option value="circle">Circle</option>
                                        <option value="oval">Oval</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm((f) => f && ({ ...f, status: e.target.value }))}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                    >
                                        <option value="available">Available</option>
                                        <option value="occupied">Occupied</option>
                                        <option value="reserved">Reserved</option>
                                        <option value="cleaning">Cleaning</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Active</label>
                                    <select
                                        value={editForm.is_active}
                                        onChange={(e) => setEditForm((f) => f && ({ ...f, is_active: e.target.value }))}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-border/20 pt-4 dark:border-stone-700">
                                <button type="button" onClick={() => setEditingTable(null)} className="rounded-lg px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editSaving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
