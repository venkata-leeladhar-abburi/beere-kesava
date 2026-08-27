import React, { useMemo, useState } from "react";
import { Search, History, CheckSquare, Square, Printer, ImageOff } from "lucide-react";
import { C, F } from "../tokens";
import { SectionCard } from "../primitives";
import { type ReceivedSareeLog } from "./shared";
import { TagPreviewScreen } from "./TagPreviewScreen";
import { Button, Input, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { useQc } from "@/features/qc";
import { useBatches, type SareeRow } from "@/features/production";
import { StatusPill } from "../../../../../shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { ImageZoomModal, type ZoomImage } from "../../../../../shared/ui/ImageZoomModal";

const QC_RESULT_TO_STATUS: Record<string, ReceivedSareeLog["status"]> = {
  passed: "Passed QC",
  semi: "Pending QC",
  defective: "Defective",
};

const HISTORY_STATUS_TO_PRODUCTION: Record<ReceivedSareeLog["status"], StatusValueOf<"production">> = {
  "Passed QC": "qc-passed",
  "Pending QC": "qc-pending",
  "Defective": "qc-failed",
};

type HistoryRow = ReceivedSareeLog & { isoDate?: string };

// Module-level so the default is referentially stable. An inline `= []`
// default allocates a new array on every render, which would defeat the
// memoisation of everything downstream of allData.
const NO_LIVE_RECORDS: ReceivedSareeLog[] = [];

export function HistorySection({ liveRecords = NO_LIVE_RECORDS }: { liveRecords?: ReceivedSareeLog[] }) {
  const [view, setView] = useState<"day" | "weaver">("day");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showTagPrint, setShowTagPrint] = useState(false);
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const { qcRecords } = useQc();
  const { batches: allBatches } = useBatches();

  // The color/weight/photo entered by Worker Staff at receipt live on the
  // batch row itself (receivedWeight/receivedColor/receivedPhotoUrl), not on
  // the QC record — join to it by sareeId so a QC'd saree's history entry
  // still shows what was actually recorded on intake.
  const rowLookup = useMemo(() => {
    const m = new Map<string, SareeRow>();
    for (const b of allBatches) for (const r of b.rows) if (r.sareeId) m.set(r.sareeId, r);
    return m;
  }, [allBatches]);

  // Real QC-inspection history — the closest genuine equivalent to a
  // "received from weaver/loom" log this schema actually has. A row belongs
  // to either an outsourced weaver or one of the factory's own looms —
  // either identity is enough to admit it, not just weaverName (which is
  // null for factory-loom rows and previously hid them from this history
  // entirely).
  const qcHistory: HistoryRow[] = useMemo(() => qcRecords
    .filter(r => r.weaverName || r.factoryLoomNumber)
    .map(r => {
      const row = rowLookup.get(r.sareeId);
      return {
        id: r.sareeId,
        weaver: r.weaverName ?? r.factoryLoomNumber ?? "Factory Loom",
        wcode: r.weaverId ?? "",
        weaverCode: row?.weaverCode ?? undefined,
        batch: r.batchId ?? "—",
        weight: row?.receivedWeight ? `${row.receivedWeight}g` : "—",
        color: row?.receivedColor ?? "—",
        date: new Date(r.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        isoDate: r.qcDate,
        status: QC_RESULT_TO_STATUS[r.result] ?? "Pending QC",
        sareeType: r.sareeTypeName ?? undefined,
        bulkOrder: r.bulkOrderLabel ?? undefined,
        loomNumber: row?.weaverLoom ?? undefined,
        photoUrl: row?.receivedPhotoUrl ?? undefined,
      };
    }),
  [qcRecords, rowLookup]);

  const allData: HistoryRow[] = useMemo(() => [
    ...liveRecords.map(r => ({ ...r, sareeType: "—" })),
    ...qcHistory,
  ], [liveRecords, qcHistory]);

  const uniqueEntities = useMemo(() => Array.from(new Set(allData.map(h => h.weaver))).sort(), [allData]);
  const uniqueBatches = useMemo(() => Array.from(new Set(allData.map(h => h.batch))).filter(b => b !== "—").sort(), [allData]);

  const filtered = allData.filter(h =>
    matchesDateFilter(h.isoDate || h.date, dateFilter) &&
    (filterEntity === "all" || h.weaver === filterEntity) &&
    (filterBatch === "all" || h.batch === filterBatch) &&
    (!search ||
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.weaver.toLowerCase().includes(search.toLowerCase()) ||
    h.batch.toLowerCase().includes(search.toLowerCase()) ||
    h.color.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by date
  const byDay: Record<string, typeof filtered> = {};
  filtered.forEach(h => { if (!byDay[h.date]) byDay[h.date] = []; byDay[h.date].push(h); });

  // Group by weaver/loom
  const byWeaver: Record<string, typeof filtered> = {};
  filtered.forEach(h => { if (!byWeaver[h.weaver]) byWeaver[h.weaver] = []; byWeaver[h.weaver].push(h); });

  const toggleRow = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map(h => h.id)));
  };

  if (showTagPrint) {
    const selectedRows = filtered.filter(h => selected.has(h.id));
    const uniqueSelWeavers = Array.from(new Set(selectedRows.map(h => h.weaver)));
    return (
      <TagPreviewScreen
        sareeIds={selectedRows.map(h => h.id)}
        entityLabel={uniqueSelWeavers.length === 1 ? "Weaver/Loom" : "Sarees"}
        entityValue={uniqueSelWeavers.length === 1 ? uniqueSelWeavers[0] : `${selectedRows.length} selected · ${uniqueSelWeavers.length} weavers/looms`}
        onBack={() => setShowTagPrint(false)}
        onPrint={() => { setSelected(new Set()); setShowTagPrint(false); }}
      />
    );
  }

  const muted = <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>;

  const columns: ColumnDef<HistoryRow>[] = [
    {
      id: "sareeId", header: "Saree ID", accessor: h => h.id, priority: 1,
      cell: (_v, h) => (
        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg, background: "rgba(110,15,45,0.08)", borderRadius: 8, padding: "4px 9px", whiteSpace: "nowrap" }}>
          {h.id}
        </span>
      ),
    },
    {
      id: "weaver", header: "Weaver / Loom", accessor: h => h.weaver, priority: 2,
      cell: (_v, h) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 700, color: "#FFF" }}>{h.weaver.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}</span>
          </div>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{h.weaver}</span>
        </div>
      ),
    },
    {
      id: "loomNo", header: "Loom No.", accessor: h => h.loomNumber ?? "—", priority: 3,
      cell: (_v, h) => h.loomNumber != null ? (
        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 9px", whiteSpace: "nowrap" }}>
          Loom {h.loomNumber}
        </span>
      ) : muted,
    },
    {
      id: "sareeType", header: "Saree Type", accessor: h => h.sareeType ?? "—", priority: 3,
      cell: (_v, h) => h.sareeType && h.sareeType !== "—" ? (
        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 500, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 9px", whiteSpace: "nowrap" }}>
          {h.sareeType}
        </span>
      ) : muted,
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: h => h.bulkOrder ?? "—", priority: 3,
      cell: (_v, h) => <span style={{ fontFamily: F.u, fontSize: 12, color: h.bulkOrder ? C.burg : C.muted }}>{h.bulkOrder || "—"}</span>,
    },
    {
      id: "color", header: "Color", accessor: h => h.color, priority: 2,
      cell: (_v, h) => h.color && h.color !== "—" ? (
        <span style={{ fontFamily: F.u, fontSize: 12, color: C.text, whiteSpace: "nowrap" }}>{h.color}</span>
      ) : muted,
    },
    {
      id: "weight", header: "Weight", accessor: h => h.weight, priority: 2,
      cell: (_v, h) => <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, whiteSpace: "nowrap" }}>{h.weight && h.weight !== "—" ? h.weight : "—"}</span>,
    },
    {
      id: "photo", header: "Photo", accessor: h => h.photoUrl ?? null,
      cell: (v, h) => v ? (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setZoomImage({ url: v as string, label: `Saree photo — ${h.id}` }); }}
          title="View photo"
          aria-label={`View photo for ${h.id}`}
          style={{
            width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.bdr}`, padding: 0, cursor: "pointer",
            backgroundImage: `url(${v})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0,
          }}
        />
      ) : (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: `1px dashed ${C.bdr}`, color: C.muted }}>
          <ImageOff size={13} />
        </span>
      ),
    },
    {
      id: "status", header: "Status", accessor: h => h.status, priority: 1,
      cell: (_v, h) => <StatusPill taxonomy="production" status={HISTORY_STATUS_TO_PRODUCTION[h.status]} size="sm" />,
    },
  ];

  return (
    <div style={{ margin: "24px 0 0" }}>
      <SectionCard
        icon={History}
        title="Received History"
        subtitle="Every saree recorded from weavers and factory looms, grouped by day or by weaver/loom."
        actions={
          <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: 3 }}>
            {([["day", "Day Wise"], ["weaver", "Weaver Wise"]] as const).map(([key, label]) => (
              <Button key={key} variant="tertiary" size="sm" onClick={() => setView(key)}
                className={view === key
                  ? "rounded-[7px] bg-white/90 !text-[#4A061B] hover:!bg-white"
                  : "rounded-[7px] bg-transparent !text-[rgba(255,253,249,0.80)] hover:!bg-white/10 hover:!text-white"}>
                {label}
              </Button>
            ))}
          </div>
        }
      >
      {/* Filters */}
      <div style={{ marginBottom: 12 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search saree ID, weaver, batch…"
            iconLeft={Search}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-[3fr_2fr] md:flex items-center gap-2 w-full md:w-auto shrink-0">
          <div className="w-full md:w-[200px]">
            <Select value={filterEntity} onValueChange={setFilterEntity} size="sm" className="w-full">
              <SelectItem value="all">All Weavers / Looms</SelectItem>
              {uniqueEntities.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </Select>
          </div>
          <div className="w-full md:w-[150px]">
            <Select value={filterBatch} onValueChange={setFilterBatch} size="sm" className="w-full">
              <SelectItem value="all">All Batches</SelectItem>
              {uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </Select>
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="flex justify-end md:justify-start shrink-0">
            <Button variant="link" onClick={toggleAll} className="gap-1.5 p-0 px-1.5 py-0.5 text-xs text-[#69635E] whitespace-nowrap">
              {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
              {allChecked ? "Deselect All" : "Select All"}
            </Button>
          </div>
        )}
      </div>

      {/* Grouped table */}
      <div>
        {view === "day" ? (
          Object.entries(byDay).length === 0
            ? <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No records found.</div>
            : Object.entries(byDay).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, paddingLeft: 2 }}>{date}</div>
                <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                  <DataTable
                    columns={columns}
                    data={items}
                    getRowId={h => h.id}
                    onRowClick={h => toggleRow(h.id)}
                    selectedIds={selected}
                    onSelectionChange={setSelected}
                    responsive
                    density="compact"
                  />
                </div>
              </div>
            ))
        ) : (
          Object.entries(byWeaver).length === 0
            ? <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No records found.</div>
            : Object.entries(byWeaver).map(([weaver, items]) => (
              <div key={weaver} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 2 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{weaver.split(" ").map(p => p[0]).join("").slice(0,2)}</span>
                  </div>
                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>{weaver}</span>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>· {items.length} sarees</span>
                </div>
                <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                  <DataTable
                    columns={columns}
                    data={items}
                    getRowId={h => h.id}
                    onRowClick={h => toggleRow(h.id)}
                    selectedIds={selected}
                    onSelectionChange={setSelected}
                    responsive
                    density="compact"
                  />
                </div>
              </div>
            ))
        )}
      </div>

      {/* Print-tag action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, padding: "10px 12px", background: "rgba(110,15,45,0.04)", border: `1px solid rgba(110,15,45,0.14)`, borderRadius: 12 }}>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, flex: 1 }}>{selected.size} saree{selected.size > 1 ? "s" : ""} selected</span>
          <Button variant="secondary" onClick={() => setSelected(new Set())}
            className="h-10 rounded-full border-[rgba(110,15,45,0.30)] text-[#6E0F2D] text-xs">
            Clear
          </Button>
          <Button variant="primary" iconLeft={Printer} onClick={() => setShowTagPrint(true)}
            className="h-10 rounded-full bg-[#6E0F2D] hover:bg-[#4A061B] text-xs">
            Print Tag{selected.size > 1 ? "s" : ""} ({selected.size})
          </Button>
        </div>
      )}
      </SectionCard>
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
}
