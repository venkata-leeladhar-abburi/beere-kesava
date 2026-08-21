import React, { useMemo, useState } from "react";
import { Search, History, CheckSquare, Square, Printer } from "lucide-react";
import { C, F } from "../tokens";
import { SectionCard } from "../primitives";
import { type ReceivedSareeLog } from "./shared";
import { TagPreviewScreen } from "./TagPreviewScreen";
import { Button, Input, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { useQc } from "@/features/qc";
import { StatusPill } from "../../../../../shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";

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

type HistoryRow = ReceivedSareeLog & { sareeType?: string; isoDate?: string };

export function HistorySection({ liveRecords = [] }: { liveRecords?: ReceivedSareeLog[] }) {
  const [view, setView] = useState<"day" | "weaver">("day");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showTagPrint, setShowTagPrint] = useState(false);
  const { qcRecords } = useQc();

  // Real QC-inspection history — the closest genuine equivalent to a
  // "received from weaver/loom" log this schema actually has (weight/color/
  // photo aren't recorded anywhere yet, so they're omitted rather than
  // faked). A row belongs to either an outsourced weaver or one of the
  // factory's own looms — either identity is enough to admit it, not just
  // weaverName (which is null for factory-loom rows and previously hid them
  // from this history entirely).
  const qcHistory: HistoryRow[] = useMemo(() => qcRecords
    .filter(r => r.weaverName || r.factoryLoomNumber)
    .map(r => ({
      id: r.sareeId,
      weaver: r.weaverName ?? r.factoryLoomNumber ?? "Factory Loom",
      wcode: r.weaverId ?? "",
      batch: r.batchId ?? "—",
      weight: "—",
      color: "—",
      date: new Date(r.qcDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      isoDate: r.qcDate,
      status: QC_RESULT_TO_STATUS[r.result] ?? "Pending QC",
      sareeType: r.sareeTypeName ?? undefined,
    })),
  [qcRecords]);

  const allData: HistoryRow[] = [
    ...liveRecords.map(r => ({ ...r, sareeType: "—" })),
    ...qcHistory,
  ];

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

<<<<<<< HEAD
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

  const SareeRow = ({ h, last }: { h: HistoryRow; last: boolean }) => {
    const checked = selected.has(h.id);
    return (
      <div
        onClick={() => toggleRow(h.id)} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRow(h.id); } }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: last ? "none" : `1px solid rgba(110,15,45,0.06)`, background: checked ? "rgba(110,15,45,0.05)" : "transparent", cursor: "pointer" }}
      >
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {checked ? <CheckSquare size={17} color={C.burg} /> : <Square size={17} color={C.muted} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{h.id}</span>
            <StatusPill taxonomy="production" status={HISTORY_STATUS_TO_PRODUCTION[h.status]} size="sm" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 12, color: C.muted }}>
            {h.sareeType && h.sareeType !== "—" && <>{h.sareeType} · </>}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: h.color?.toLowerCase() || "#CCC", border: "1px solid rgba(0,0,0,0.15)" }} />
              {h.color}
            </span>
            · {h.weight} · {h.batch}
          </div>
        </div>
        {view === "day" && <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, flexShrink: 0 }}>{h.weaver}</div>}
        {view === "weaver" && <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, flexShrink: 0 }}>{h.date}</div>}
      </div>
    );
  };

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

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
        <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saree ID, weaver, batch…"
            iconLeft={Search} className="w-full" />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Select value={filterEntity} onValueChange={setFilterEntity} size="sm">
            <SelectItem value="all">All Weavers / Looms</SelectItem>
            {uniqueEntities.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </Select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Select value={filterBatch} onValueChange={setFilterBatch} size="sm">
            <SelectItem value="all">All Batches</SelectItem>
            {uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </Select>
        </div>
        {filtered.length > 0 && (
          <Button variant="link" onClick={toggleAll} className="gap-1.5 p-0 px-1.5 py-1 text-xs text-[#69635E] whitespace-nowrap">
            {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
            {allChecked ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      {/* Grouped list */}
      <div>
        {view === "day" ? (
          Object.entries(byDay).length === 0
            ? <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No records found.</div>
            : Object.entries(byDay).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, paddingLeft: 2 }}>{date}</div>
                <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                  {items.map((h, i) => <SareeRow key={h.id} h={h} last={i === items.length - 1} />)}
                </div>
              </div>
            ))
        ) : (
          Object.entries(byWeaver).length === 0
            ? <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No records found.</div>
            : Object.entries(byWeaver).map(([weaver, items]) => (
              <div key={weaver} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 2 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{weaver.split(" ").map(p => p[0]).join("").slice(0,2)}</span>
                  </div>
                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>{weaver}</span>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>· {items.length} sarees</span>
                </div>
                <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                  {items.map((h, i) => <SareeRow key={h.id} h={h} last={i === items.length - 1} />)}
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
    </div>
  );
}
