import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { dashboard } from '@/routes';
import { index as diningTablesIndex, update as diningTablesUpdate } from '@/routes/dining-tables';
import { update as updateLayout } from '@/routes/dining-table-layout';
import { cn } from '@/lib/utils';

type Outlet    = { id: number; name: string };
type DiningArea = { id: number; name: string; outlet_id: number; layout_width: number; layout_height: number };
type DiningTable = {
    id: number; outlet_id: number; dining_area_id: number;
    name: string; code: string | null; capacity: number; status: string;
    shape: 'rectangle' | 'square' | 'circle' | 'oval';
    position_x: number; position_y: number; width: number; height: number; rotation: number; is_active: boolean;
};
type LayoutTable = DiningTable & { _x: number; _y: number; _width: number; _height: number; _rotation: number };
type Props = { outlets: Outlet[]; diningAreas: DiningArea[]; tables: DiningTable[]; scopedOutletId: string | null };
type EditForm  = { name: string; code: string; capacity: string; shape: string; status: string; is_active: string };

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    available: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-400 dark:border-emerald-600', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-400' },
    occupied:  { bg: 'bg-red-50 dark:bg-red-900/20',         border: 'border-red-400 dark:border-red-600',         text: 'text-red-800 dark:text-red-300',         dot: 'bg-red-400' },
    reserved:  { bg: 'bg-amber-50 dark:bg-amber-900/20',     border: 'border-amber-400 dark:border-amber-600',     text: 'text-amber-800 dark:text-amber-300',     dot: 'bg-amber-400' },
    cleaning:  { bg: 'bg-blue-50 dark:bg-blue-900/20',       border: 'border-blue-400 dark:border-blue-600',       text: 'text-blue-800 dark:text-blue-300',       dot: 'bg-blue-400' },
    inactive:  { bg: 'bg-stone-50 dark:bg-stone-800',        border: 'border-stone-300 dark:border-stone-600',     text: 'text-stone-500 dark:text-stone-400',     dot: 'bg-stone-300' },
};

const fieldCls = 'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary focus:bg-background';

/* Canvas renders tables on a transparent surface — the outer container provides the grid background */
function TableCanvas({ tables, selectedArea, canvasScale, selectedTableId, onPointerMove, onPointerUp, onPointerDown, onSelectTable, onDoubleClick }: {
    tables: LayoutTable[]; selectedArea: DiningArea; canvasScale: number; selectedTableId: number | null;
    onPointerMove: (e: React.PointerEvent) => void; onPointerUp: () => void;
    onPointerDown: (e: React.PointerEvent, id: number) => void;
    onSelectTable: (id: number | null) => void; onDoubleClick: (t: LayoutTable) => void;
}) {
    return (
        <div style={{ width: selectedArea.layout_width * canvasScale, height: selectedArea.layout_height * canvasScale }}>
            <div
                className="relative select-none"
                style={{ width: selectedArea.layout_width, height: selectedArea.layout_height, transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
                onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onPointerCancel={onPointerUp}
                onClick={() => onSelectTable(null)}
            >
                {tables.map((table) => {
                    const c = STATUS_COLORS[table.status] ?? STATUS_COLORS.inactive;
                    const sel = selectedTableId === table.id;
                    return (
                        <div key={table.id}
                            className={cn('absolute cursor-grab active:cursor-grabbing', sel && 'drop-shadow-xl')}
                            style={{ left: table._x, top: table._y, width: table._width, height: table._height, transform: `rotate(${table._rotation}deg)` }}
                            onPointerDown={(e) => onPointerDown(e, table.id)}
                            onClick={(e) => { e.stopPropagation(); onSelectTable(table.id); }}
                            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(table); }}
                        >
                            <div className={cn(
                                'flex h-full w-full flex-col items-center justify-center overflow-hidden border-2 transition-all',
                                c.bg, c.border, sel && 'ring-2 ring-primary ring-offset-1',
                                table.shape === 'circle' && 'rounded-full',
                                table.shape === 'oval' && 'rounded-[50%]',
                                table.shape === 'square' && 'rounded-xl',
                                table.shape === 'rectangle' && 'rounded-lg',
                            )}>
                                <span className={cn('truncate w-full text-center px-1 text-[10px] font-bold leading-tight', c.text)}>{table.name}</span>
                                {table.code && <span className={cn('text-[8px] leading-none opacity-50', c.text)}>{table.code}</span>}
                                <span className={cn('mt-0.5 flex items-center gap-0.5 text-[9px] leading-none opacity-60', c.text)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '9px' }}>person</span>{table.capacity}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function DiningTableLayout({ outlets, diningAreas, tables, scopedOutletId }: Props) {
    const [selectedOutletId, setSelectedOutletId] = useState(scopedOutletId ?? '');
    const [selectedAreaId,   setSelectedAreaId]   = useState('');
    const [layoutTables,     setLayoutTables]     = useState<LayoutTable[]>([]);
    const [selectedTableId,  setSelectedTableId]  = useState<number | null>(null);
    const [saving,    setSaving]    = useState(false);
    const [saveMsg,   setSaveMsg]   = useState<string | null>(null);
    const [editingTable, setEditingTable] = useState<LayoutTable | null>(null);
    const [editForm,     setEditForm]     = useState<EditForm | null>(null);
    const [editSaving,   setEditSaving]   = useState(false);
    const [editErrors,   setEditErrors]   = useState<Partial<EditForm>>({});
    const [canvasScale,  setCanvasScale]  = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSidebar,  setShowSidebar]  = useState(true);

    const measureRefNormal     = useRef<HTMLDivElement>(null);
    const measureRefFullscreen = useRef<HTMLDivElement>(null);
    const dragging  = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
    const fitScaleRef = useRef<number>(1);

    const filteredAreas = useMemo(() =>
        selectedOutletId ? diningAreas.filter((a) => String(a.outlet_id) === selectedOutletId) : []
    , [diningAreas, selectedOutletId]);

    const selectedArea = useMemo(() =>
        diningAreas.find((a) => String(a.id) === selectedAreaId) ?? null
    , [diningAreas, selectedAreaId]);

    useEffect(() => {
        if (!selectedAreaId) { setLayoutTables([]); return; }
        setLayoutTables(
            tables.filter((t) => String(t.dining_area_id) === selectedAreaId)
                  .map((t) => ({ ...t, _x: t.position_x, _y: t.position_y, _width: t.width, _height: t.height, _rotation: t.rotation }))
        );
    }, [selectedAreaId, tables]);

    /* Both refs are absolute-inset divs — measure actual container dimensions for scale */
    useEffect(() => {
        if (!selectedArea) return;
        const measure = () => {
            const el = isFullscreen ? measureRefFullscreen.current : measureRefNormal.current;
            if (!el) return;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            if (w === 0 || h === 0) return;
            const fit = Math.min(w / selectedArea.layout_width, h / selectedArea.layout_height, 1);
            fitScaleRef.current = fit;
            setCanvasScale(fit);
        };
        measure();
        const el = isFullscreen ? measureRefFullscreen.current : measureRefNormal.current;
        const ro = new ResizeObserver(measure);
        if (el) ro.observe(el);
        window.addEventListener('resize', measure);
        return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
    }, [selectedArea, isFullscreen]);

    const zoomIn  = () => setCanvasScale((s) => Math.min(+(s + 0.1).toFixed(2), 3));
    const zoomOut = () => setCanvasScale((s) => Math.max(+(s - 0.1).toFixed(2), 0.1));
    const zoomFit = () => setCanvasScale(fitScaleRef.current);

    const handleOutletChange = (id: string) => { setSelectedOutletId(id); setSelectedAreaId(''); setSelectedTableId(null); };
    const handleAreaChange   = (id: string) => { setSelectedAreaId(id);   setSelectedTableId(null); };

    const onPointerDown = useCallback((e: React.PointerEvent, tableId: number) => {
        e.preventDefault(); e.stopPropagation();
        const t = layoutTables.find((t) => t.id === tableId);
        if (!t) return;
        setSelectedTableId(tableId);
        dragging.current = { id: tableId, startX: e.clientX, startY: e.clientY, origX: t._x, origY: t._y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, [layoutTables]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const drag = dragging.current;
        if (!drag || !selectedArea) return;
        const dx = (e.clientX - drag.startX) / canvasScale;
        const dy = (e.clientY - drag.startY) / canvasScale;
        const t = layoutTables.find((t) => t.id === drag.id);
        if (!t) return;
        setLayoutTables((prev) => prev.map((r) => r.id === drag.id ? {
            ...r,
            _x: Math.max(0, Math.min(selectedArea.layout_width  - t._width,  drag.origX + dx)),
            _y: Math.max(0, Math.min(selectedArea.layout_height - t._height, drag.origY + dy)),
        } : r));
    }, [layoutTables, selectedArea, canvasScale]);

    const onPointerUp = useCallback(() => { dragging.current = null; }, []);

    const updateDim = (id: number, field: '_width' | '_height' | '_rotation', v: number) =>
        setLayoutTables((prev) => prev.map((t) => t.id === id ? { ...t, [field]: v } : t));

    const selectedTable = useMemo(() => layoutTables.find((t) => t.id === selectedTableId) ?? null, [layoutTables, selectedTableId]);

    async function saveLayout() {
        if (!selectedAreaId || !selectedOutletId || layoutTables.length === 0) return;
        setSaving(true); setSaveMsg(null);
        try {
            const res = await fetch(updateLayout.url(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '', 'Accept': 'application/json' },
                body: JSON.stringify({
                    outlet_id: Number(selectedOutletId), dining_area_id: Number(selectedAreaId),
                    tables: layoutTables.map((t) => ({ id: t.id, position_x: Math.round(t._x*100)/100, position_y: Math.round(t._y*100)/100, width: Math.round(t._width*100)/100, height: Math.round(t._height*100)/100, rotation: Math.round(t._rotation) })),
                }),
            });
            setSaveMsg(res.ok ? 'Layout saved.' : ((await res.json()).message ?? 'Failed to save.'));
        } catch { setSaveMsg('Network error.'); } finally { setSaving(false); }
    }

    function openEdit(table: LayoutTable) {
        dragging.current = null;
        setEditingTable(table);
        setEditForm({ name: table.name, code: table.code ?? '', capacity: String(table.capacity), shape: table.shape, status: table.status, is_active: table.is_active ? 'true' : 'false' });
        setEditErrors({});
    }

    async function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingTable || !editForm) return;
        setEditSaving(true); setEditErrors({});
        try {
            const res = await fetch(diningTablesUpdate.url(editingTable.id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '', 'Accept': 'application/json' },
                body: JSON.stringify({
                    outlet_id: editingTable.outlet_id, dining_area_id: editingTable.dining_area_id,
                    name: editForm.name, code: editForm.code || null, capacity: Number(editForm.capacity),
                    shape: editForm.shape, status: editForm.status, is_active: editForm.is_active === 'true',
                    position_x: Math.round(editingTable._x*100)/100, position_y: Math.round(editingTable._y*100)/100,
                    width: Math.round(editingTable._width*100)/100, height: Math.round(editingTable._height*100)/100,
                    rotation: Math.round(editingTable._rotation), sort_order: 0,
                }),
            });
            if (res.ok) {
                setLayoutTables((prev) => prev.map((t) => t.id === editingTable.id ? {
                    ...t,
                    name:      editForm.name,
                    code:      editForm.code || null,
                    capacity:  Number(editForm.capacity),
                    shape:     editForm.shape as LayoutTable['shape'],
                    status:    editForm.status,
                    is_active: editForm.is_active === 'true',
                } : t));
                setEditingTable(null);
                setEditForm(null);
            }
            else { const d = await res.json(); if (d.errors) setEditErrors(d.errors); else setEditErrors({ name: d.message ?? 'Failed.' }); }
        } catch { setEditErrors({ name: 'Network error.' }); } finally { setEditSaving(false); }
    }

    const canvasProps = { tables: layoutTables, canvasScale, selectedTableId, onPointerMove, onPointerUp, onPointerDown, onSelectTable: setSelectedTableId, onDoubleClick: openEdit };

    return (
        <>
            <Head title="Dining Table Layout" />
            <PageHeader
                breadcrumbs={[{ label: 'Home', href: dashboard.url() }, { label: 'Dining Tables', href: diningTablesIndex.url() }, { label: 'Layout Editor' }]}
                title="Dining Table Layout"
                description="Drag tables to reposition. Double-click a table to edit its details."
            />

            {/* ── Toolbar ── */}
            <div className="mb-4 rounded-xl border border-border bg-card shadow-sm">
                {/* Row 1: outlet selector + save — always single row */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
                    <div className="w-[150px] sm:w-[180px]">
                        <SearchableSelect value={selectedOutletId} onChange={(e) => handleOutletChange(e.target.value)} disabled={scopedOutletId !== null}>
                            <option value="">Select outlet…</option>
                            {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </SearchableSelect>
                    </div>

                    <div className="flex items-center gap-2">
                        {saveMsg && (
                            <span className={cn('text-xs font-semibold', saveMsg.includes('saved') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                                {saveMsg}
                            </span>
                        )}
                        {selectedAreaId && layoutTables.length > 0 && (
                            <button type="button" onClick={saveLayout} disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4">
                                <span className="material-symbols-outlined text-[16px]">save</span>
                                <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save Layout'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: area tabs — wraps below outlet row, scrollable */}
                {selectedOutletId && (
                    <div className="flex items-center gap-1 overflow-x-auto border-t border-border px-3 py-2 sm:px-4">
                        {filteredAreas.length === 0
                            ? <p className="text-xs text-muted-foreground">No dining areas for this outlet.</p>
                            : filteredAreas.map((area) => (
                                <button key={area.id} type="button" onClick={() => handleAreaChange(String(area.id))}
                                    className={cn(
                                        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                                        selectedAreaId === String(area.id)
                                            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}>
                                    <span className="material-symbols-outlined text-[13px]">chair</span>
                                    {area.name}
                                    {selectedAreaId === String(area.id) && layoutTables.length > 0 && (
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                                            {layoutTables.length}
                                        </span>
                                    )}
                                </button>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* ── 2-column: Canvas card + Properties card ── */}
            <div className={cn('grid items-start gap-4', isFullscreen && 'hidden', showSidebar ? 'grid-cols-1 lg:grid-cols-[1fr_260px]' : 'grid-cols-1')}>

                {/* ── Canvas card ── */}
                <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                    style={{ height: 'calc(100vh - 420px)', minHeight: '380px' }}>
                    {/* Measure ref — inset-4 matches scroll area padding */}
                    <div ref={measureRefNormal} className="pointer-events-none absolute inset-4" />

                    {!selectedAreaId ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                    <span className="material-symbols-outlined text-[32px] text-muted-foreground/40">table_restaurant</span>
                                </div>
                                <p className="text-sm font-semibold text-muted-foreground">
                                    {selectedOutletId ? 'Select a dining area above.' : 'Select an outlet to get started.'}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground/50">Drag tables to rearrange the floor plan.</p>
                            </div>
                        </div>
                    ) : layoutTables.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                    <span className="material-symbols-outlined text-[32px] text-muted-foreground/40">table_restaurant</span>
                                </div>
                                <p className="text-sm font-semibold text-muted-foreground">No active tables in this area.</p>
                                <p className="mt-1 text-xs text-muted-foreground/50">Add tables from the Dining Tables page.</p>
                            </div>
                        </div>
                    ) : selectedArea ? (
                        <>
                            {/* Scrollable area */}
                            <div className="absolute inset-0 overflow-auto">
                                <div className="grid min-h-full min-w-max place-items-center p-4">
                                    <div className={cn(
                                        'overflow-hidden rounded-xl border border-border shadow-md',
                                        'bg-white bg-[length:20px_20px] [background-image:radial-gradient(circle,#e2e8f0_1px,transparent_1px)]',
                                        'dark:bg-stone-950 dark:[background-image:radial-gradient(circle,#334155_1px,transparent_1px)]',
                                    )}>
                                        <TableCanvas selectedArea={selectedArea} {...canvasProps} />
                                    </div>
                                </div>
                            </div>

                            {/* Zoom controls — bottom-left, don't scroll */}
                            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1 shadow-sm">
                                <button type="button" onClick={zoomOut} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <span className="material-symbols-outlined text-[16px]">remove</span>
                                </button>
                                <button type="button" onClick={zoomFit} title="Reset to fit" className="min-w-[44px] rounded px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    {Math.round(canvasScale * 100)}%
                                </button>
                                <button type="button" onClick={zoomIn} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                </button>
                            </div>

                            {/* Top-right controls — don't scroll */}
                            <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
                                <button type="button" onClick={() => setShowSidebar((v) => !v)}
                                    className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:text-foreground">
                                    <span className="material-symbols-outlined text-[15px]">{showSidebar ? 'right_panel_close' : 'right_panel_open'}</span>
                                </button>
                                <button type="button" onClick={() => setIsFullscreen(true)}
                                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:text-foreground">
                                    <span className="material-symbols-outlined text-[15px]">fullscreen</span>
                                    <span className="hidden sm:inline">Full Screen</span>
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* ── Properties card ── */}
                {showSidebar && (
                    <div className="flex flex-col gap-3 overflow-y-auto">

                        {/* Properties */}
                        <div className="rounded-xl border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[15px] text-primary">tune</span>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Properties</h3>
                                </div>
                                {selectedTable && (
                                    <button type="button" onClick={() => openEdit(selectedTable)}
                                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-primary transition-colors hover:bg-primary/10">
                                        <span className="material-symbols-outlined text-[13px]">edit</span>Edit
                                    </button>
                                )}
                            </div>

                            {selectedTable ? (
                                <div className="divide-y divide-border">
                                    {/* Info row */}
                                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{selectedTable.name}</p>
                                            <p className="mt-0.5 text-xs capitalize text-muted-foreground">{selectedTable.shape} · {selectedTable.capacity} seats</p>
                                        </div>
                                        {selectedTable.code && (
                                            <span className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{selectedTable.code}</span>
                                        )}
                                    </div>

                                    {/* Position */}
                                    <div className="px-4 py-3">
                                        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Position</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-muted-foreground">X</label>
                                                <input type="number" min="0" value={Math.round(selectedTable._x)}
                                                    onChange={(e) => { const v = Number(e.target.value); setLayoutTables((p) => p.map((t) => t.id === selectedTable.id ? { ...t, _x: v } : t)); }}
                                                    className={fieldCls} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-muted-foreground">Y</label>
                                                <input type="number" min="0" value={Math.round(selectedTable._y)}
                                                    onChange={(e) => { const v = Number(e.target.value); setLayoutTables((p) => p.map((t) => t.id === selectedTable.id ? { ...t, _y: v } : t)); }}
                                                    className={fieldCls} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Size */}
                                    <div className="px-4 py-3">
                                        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Size</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-muted-foreground">Width</label>
                                                <input type="number" min="20" value={Math.round(selectedTable._width)} onChange={(e) => updateDim(selectedTable.id, '_width', Number(e.target.value))} className={fieldCls} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-muted-foreground">Height</label>
                                                <input type="number" min="20" value={Math.round(selectedTable._height)} onChange={(e) => updateDim(selectedTable.id, '_height', Number(e.target.value))} className={fieldCls} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rotation */}
                                    <div className="px-4 py-3">
                                        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rotation</p>
                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-muted-foreground">Degrees (0 – 360)</label>
                                            <input type="number" min="0" max="360" value={Math.round(selectedTable._rotation)} onChange={(e) => updateDim(selectedTable.id, '_rotation', Number(e.target.value))} className={fieldCls} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                                    <span className="material-symbols-outlined text-[32px] text-muted-foreground/25">touch_app</span>
                                    <p className="text-sm font-semibold text-muted-foreground">Select a table</p>
                                    <p className="text-xs text-muted-foreground/60">Click any table to view and edit its properties</p>
                                </div>
                            )}
                        </div>

                        {/* Status legend */}
                        <div className="rounded-xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-4 py-3">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Status Legend</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 p-4">
                                {Object.entries(STATUS_COLORS).map(([status, c]) => (
                                    <div key={status} className="flex items-center gap-2">
                                        <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', c.dot)} />
                                        <span className="text-[11px] font-medium capitalize text-muted-foreground">{status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Fullscreen overlay ── */}
            {isFullscreen && selectedArea && (
                <div className="fixed inset-0 z-50 flex flex-col bg-background">
                    {/* Toolbar */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4">
                        {/* Left: area info + zoom */}
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[17px] text-muted-foreground">chair</span>
                            <span className="max-w-[120px] truncate text-sm font-semibold text-foreground sm:max-w-none">{selectedArea.name}</span>
                            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground sm:inline">{layoutTables.length} tables</span>
                            {/* Zoom controls */}
                            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 px-1 py-0.5">
                                <button type="button" onClick={zoomOut} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
                                    <span className="material-symbols-outlined text-[16px]">remove</span>
                                </button>
                                <button type="button" onClick={zoomFit} title="Reset to fit" className="min-w-[40px] rounded px-1 py-0.5 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
                                    {Math.round(canvasScale * 100)}%
                                </button>
                                <button type="button" onClick={zoomIn} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground">
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Right: save msg + save + exit */}
                        <div className="flex items-center gap-2">
                            {saveMsg && (
                                <span className={cn('hidden text-xs font-semibold sm:inline', saveMsg.includes('saved') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                                    {saveMsg}
                                </span>
                            )}
                            {layoutTables.length > 0 && (
                                <button type="button" onClick={saveLayout} disabled={saving}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60">
                                    <span className="material-symbols-outlined text-[16px]">save</span>
                                    <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
                                </button>
                            )}
                            <button type="button" onClick={() => setIsFullscreen(false)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                                <span className="material-symbols-outlined text-[16px]">fullscreen_exit</span>
                                <span className="hidden sm:inline">Exit</span>
                            </button>
                        </div>
                    </div>

                    {/* Canvas — plain bg body, scrollable when zoomed */}
                    <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
                        <div ref={measureRefFullscreen} className="pointer-events-none absolute inset-6" />
                        <div className="absolute inset-0 overflow-auto">
                            <div className="grid min-h-full min-w-max place-items-center p-6">
                                <div className={cn(
                                    'overflow-hidden rounded-2xl border-2 border-border shadow-2xl',
                                    'bg-white bg-[length:20px_20px] [background-image:radial-gradient(circle,#e2e8f0_1px,transparent_1px)]',
                                    'dark:bg-stone-950 dark:[background-image:radial-gradient(circle,#334155_1px,transparent_1px)]',
                                )}>
                                    <TableCanvas selectedArea={selectedArea} {...canvasProps} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit modal ── */}
            {editingTable && editForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingTable(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl dark:bg-stone-900" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-base font-bold text-foreground">Edit Table</h2>
                            <button type="button" onClick={() => setEditingTable(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={submitEdit} className="space-y-4 px-6 py-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                                    <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => f && ({ ...f, name: e.target.value }))}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:bg-stone-800 dark:text-stone-100" />
                                    {editErrors.name && <p className="mt-1 text-xs text-red-500">{editErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Code</label>
                                    <input type="text" value={editForm.code} placeholder="e.g. T-01" onChange={(e) => setEditForm((f) => f && ({ ...f, code: e.target.value }))}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:bg-stone-800 dark:text-stone-100" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Capacity</label>
                                    <input type="number" min="1" value={editForm.capacity} onChange={(e) => setEditForm((f) => f && ({ ...f, capacity: e.target.value }))}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:bg-stone-800 dark:text-stone-100" />
                                </div>
                                {[
                                    { key: 'shape',     label: 'Shape',  opts: [['rectangle','Rectangle'],['square','Square'],['circle','Circle'],['oval','Oval']] },
                                    { key: 'status',    label: 'Status', opts: [['available','Available'],['occupied','Occupied'],['reserved','Reserved'],['cleaning','Cleaning'],['inactive','Inactive']] },
                                    { key: 'is_active', label: 'Active', opts: [['true','Active'],['false','Inactive']] },
                                ].map(({ key, label, opts }) => (
                                    <div key={key}>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
                                        <select value={editForm[key as keyof EditForm]} onChange={(e) => setEditForm((f) => f && ({ ...f, [key]: e.target.value }))}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary dark:bg-stone-800 dark:text-stone-100">
                                            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                                <button type="button" onClick={() => setEditingTable(null)} className="rounded-lg px-5 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                                <button type="submit" disabled={editSaving}
                                    className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
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
