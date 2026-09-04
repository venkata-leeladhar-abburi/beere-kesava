import { useMemo, useState } from "react";
import { Search, History, CheckSquare, Square, Printer, ImageOff } from "lucide-react";
import { C, F } from "../tokens";
import { SectionCard } from "../primitives";
import { type ReceivedSareeLog } from "./shared";
import { TagPreviewScreen } from "./TagPreviewScreen";
import { Button, Input, Combobox } from "../../../../../shared/ui/primitives";
import { useQc, type QcRecord } from "@/features/qc";
import { useBatches } from "@/features/production";
import { StatusPill } from "../../../../../shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { DataTable, ViewToggle, type ColumnDef, type DataView } from "../../../../../shared/ui/data";
import { ImageZoomModal, type ZoomImage } from "../../../../../shared/ui/ImageZoomModal";
import { usePrintSareeTags, type SareeTagData } from "@/features/weavers";

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

// `id` stays the saree ID (used for display and tag printing), but a saree
// can pass through QC more than once via rework (SEMI/DEFECTIVE -> reworked
// -> re-inspected), producing multiple qcHistory rows with the same `id`.
// `key` disambiguates those for React/DataTable row identity and selection.
type HistoryRow = ReceivedSareeLog & { isoDate?: string; key: string };

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
  const [dataView, setDataView] = useState<DataView>("table");
  const { qcRecords } = useQc();
  const { batches: allBatches } = useBatches();
  const printSareeTags = usePrintSareeTags();

  // Latest QC verdict per saree, keyed by sareeId, so a received row that has
  // since been inspected shows its real status instead of "Pending QC"
  // forever. A saree can be QC'd more than once (rework loop) — qcRecords is
  // already ordered newest-first, so the first hit per id wins.
  const latestQcBySaree = useMemo(() => {
    const m = new Map<string, { result: QcRecord["result"]; photoUrl?: string | null }>();
    for (const r of qcRecords) if (!m.has(r.sareeId)) m.set(r.sareeId, { result: r.result, photoUrl: r.photoUrl });
    return m;
  }, [qcRecords]);

  // Received history sourced directly from the batch rows themselves — the
  // backend persists receivedAt/receivedBy/receivedWeight/etc. on the row the
  // moment Worker Staff receives it, well before any QC inspection happens.
  // Building this off qcRecords (as before) meant a freshly received saree
  // vanished from history until it was QC'd, and never showed who received
  // it (receivedBy lived only on the row, not the QC record).
  const qcHistory: HistoryRow[] = useMemo(() => {
    const rows: HistoryRow[] = [];
    for (const b of allBatches) {
      for (const r of b.rows) {
        if (!r.sareeId || !r.receivedAt) continue;
        // Checked against the raw ids, not the resolved weaverName/
        // factoryLoomNumber labels — BatchContext degrades those to null
        // whenever the weavers/looms lookup fetch fails, and a row with a
        // real weaverId/factoryLoomId but a blank label is still a real
        // received saree, not one to drop from history.
        if (!r.weaverId && !r.factoryLoomId) continue;
        const qc = latestQcBySaree.get(r.sareeId);
        rows.push({
          id: r.sareeId,
          key: `${r.sareeId}-${r.receivedAt}`,
          weaver: r.weaverName ?? r.factoryLoomNumber ?? "Factory Loom",
          wcode: r.weaverId ?? "",
          weaverCode: r.weaverCode ?? undefined,
          batch: b.batchId,
          weight: r.receivedWeight ? `${r.receivedWeight}g` : "—",
          color: r.receivedColor ?? "—",
          date: new Date(r.receivedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          isoDate: r.receivedAt,
          status: qc ? (QC_RESULT_TO_STATUS[qc.result] ?? "Pending QC") : "Pending QC",
          // The code ("KJ-001"), not the type's display name ("KANJIVARAM") —
          // the code is what identifies a saree type on the floor, and it is
          // what the batch's own Saree Type column already shows.
          sareeType: r.sareeTypeCode ?? undefined,
          bulkOrder: r.bulkOrderLabel ?? undefined,
          loomNumber: r.weaverLoom ?? undefined,
          // Receipt-time photo, falling back to the QC-pass photo if intake
          // didn't capture one.
          photoUrl: r.receivedPhotoUrl ?? qc?.photoUrl ?? undefined,
          receivedBy: r.receivedBy ?? undefined,
        });
      }
    }
    return rows;
  }, [allBatches, latestQcBySaree]);

  // liveRecords covers the brief window between a receive click and the
  // batches list refetch landing — anything already reflected in qcHistory
  // (by sareeId) is dropped so a just-received saree doesn't show twice.
  const seenIds = useMemo(() => new Set(qcHistory.map(h => h.id)), [qcHistory]);
  const allData: HistoryRow[] = useMemo(() => [
    ...liveRecords.filter(r => !seenIds.has(r.id)).map(r => ({ ...r, sareeType: "—", key: `live-${r.id}` })),
    ...qcHistory,
  ], [liveRecords, qcHistory, seenIds]);

  const uniqueEntities = useMemo(() => Array.from(new Set(allData.map(h => h.weaver))).sort(), [allData]);
  const uniqueBatches = useMemo(() => Array.from(new Set(allData.map(h => h.batch))).filter(b => b !== "—").sort(), [allData]);

  // How many records sit behind each filter value, so the dropdowns say what
  // picking one will actually yield instead of just listing names.
  const countBy = useMemo(() => {
    const entity = new Map<string, number>();
    const batch = new Map<string, number>();
    for (const h of allData) {
      entity.set(h.weaver, (entity.get(h.weaver) ?? 0) + 1);
      batch.set(h.batch, (batch.get(h.batch) ?? 0) + 1);
    }
    return { entity, batch };
  }, [allData]);

  const filtered = allData.filter(h =>
    matchesDateFilter(h.isoDate || h.date, dateFilter) &&
    (filterEntity === "all" || h.weaver === filterEntity) &&
    (filterBatch === "all" || h.batch === filterBatch) &&
    (!search ||
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.weaver.toLowerCase().includes(search.toLowerCase()) ||
    h.batch.toLowerCase().includes(search.toLowerCase()) ||
    h.color.toLowerCase().includes(search.toLowerCase()) ||
    (h.sareeType ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (h.bulkOrder ?? "").toLowerCase().includes(search.toLowerCase()) ||
    String(h.loomNumber ?? "").toLowerCase().includes(search.toLowerCase()))
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
    else setSelected(new Set(filtered.map(h => h.key)));
  };

  if (showTagPrint) {
    const selectedRows = filtered.filter(h => selected.has(h.key));
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

  // Same tag design and same barcode-generation endpoint Inventory's saree
  // tables print from (SareeTagPrint.tsx) — not the separate QR-only
  // TagPreviewScreen/SareeTagSheet this section's bulk "Print Tags" action
  // below still uses, so a tag printed from either place is identical.
  const printRowTag = (h: HistoryRow) => {
    const weightGrams = h.weight ? Number(h.weight.replace(/g$/i, "")) || null : null;
    const tag: SareeTagData = {
      sareeId: h.id,
      batchId: h.batch !== "—" ? h.batch : null,
      sareeTypeCode: h.sareeType ?? null,
      color: h.color !== "—" ? h.color : null,
      weight: weightGrams,
      weaverName: h.weaver,
      loomNumber: h.loomNumber != null ? Number(h.loomNumber) || null : null,
      date: h.isoDate ?? null,
    };
    printSareeTags([tag]);
  };

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
      id: "batch", header: "Batch", accessor: h => h.batch, priority: 2,
      cell: (_v, h) => h.batch && h.batch !== "—" ? (
        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.wine, background: "rgba(74,6,27,0.06)", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "4px 9px", whiteSpace: "nowrap" }}>
          {h.batch}
        </span>
      ) : muted,
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
      id: "receivedBy", header: "Received By", accessor: h => h.receivedBy ?? "—", priority: 3,
      cell: (_v, h) => <span style={{ fontFamily: F.u, fontSize: 12, color: h.receivedBy ? C.text : C.muted }}>{h.receivedBy || "—"}</span>,
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
    {
      id: "tag", header: "Tag", accessor: () => null, type: "actions",
      cell: (_v, h) => (
        <Button
          variant="secondary" size="sm" iconLeft={Printer}
          onClick={e => { e.stopPropagation(); printRowTag(h); }}
          className="whitespace-nowrap"
        >
          Print
        </Button>
      ),
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
          <div className="w-full md:w-[220px]">
            <Combobox
              size="sm"
              className="w-full"
              value={filterEntity}
              onValueChange={setFilterEntity}
              searchPlaceholder="Search weaver or loom…"
              emptyMessage="No weaver or loom matches"
              options={[
                { value: "all", label: "All Weavers / Looms" },
                ...uniqueEntities.map(w => ({
                  value: w,
                  label: w,
                  hint: `${countBy.entity.get(w) ?? 0} saree${(countBy.entity.get(w) ?? 0) === 1 ? "" : "s"}`,
                })),
              ]}
            />
          </div>
          <div className="w-full md:w-[180px]">
            <Combobox
              size="sm"
              className="w-full"
              value={filterBatch}
              onValueChange={setFilterBatch}
              searchPlaceholder="Search batch number…"
              emptyMessage="No batch matches"
              options={[
                { value: "all", label: "All Batches" },
                ...uniqueBatches.map(b => ({
                  value: b,
                  label: b,
                  hint: `${countBy.batch.get(b) ?? 0} saree${(countBy.batch.get(b) ?? 0) === 1 ? "" : "s"}`,
                })),
              ]}
            />
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="flex justify-end md:justify-start shrink-0 items-center gap-2">
            <Button variant="link" onClick={toggleAll} className="gap-1.5 p-0 px-1.5 py-0.5 text-xs text-[#69635E] whitespace-nowrap">
              {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
              {allChecked ? "Deselect All" : "Select All"}
            </Button>
          </div>
        )}
        <div className="flex justify-end shrink-0">
          <ViewToggle value={dataView} onChange={setDataView} />
        </div>
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
                    getRowId={h => h.key}
                    onRowClick={h => toggleRow(h.key)}
                    selectedIds={selected}
                    onSelectionChange={setSelected}
                    view={dataView}
                    density="compact"
                    pagination
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
                    getRowId={h => h.key}
                    onRowClick={h => toggleRow(h.key)}
                    selectedIds={selected}
                    onSelectionChange={setSelected}
                    view={dataView}
                    density="compact"
                    pagination
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
