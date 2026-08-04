import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MagnifyingGlass, CaretDown as PhCaretDown, Plus as PhPlus } from "@phosphor-icons/react";
import { useBatches } from "../../contexts/BatchContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { FILTER_PILLS, VIEW_OPTIONS } from "../data";
import type { Batch, BatchStage, CodeCallbacks, WeaverRef } from "../types";
import { FadeUp, ProductionDialog } from "../common/primitives";
import { BatchCardGrid, BatchListView, BatchTableView } from "./batches/BatchViews";
import { ContextBatchDetailsDialog, rowComplete } from "./batches/ContextBatchCard";

export function ActiveBatchesSection({ onNavigate }: { onNavigate?: (tab: string) => void } & CodeCallbacks) {
  const { batches, setPendingOpenBatchId } = useBatches();
  const contextBatches = batches.filter(b => b.status === "active" || b.status === "draft");

  const [view,   setView]   = useState("card");
  const [filter, setFilter] = useState<BatchStage | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Most Recent First");
  const [batchDialog, setBatchDialog] = useState<{ mode: "view" | "slip"; batch?: Batch } | null>(null);

  // Map BatchRecord from context to Batch type
  const mappedContextBatches: Batch[] = contextBatches.map(br => {
    const completeCount = br.rows.filter(rowComplete).length;
    const qcPassedCount = br.rows.filter(r => r.qcPassed).length;

    let stage: BatchStage = "weaving";
    if (br.status === "completed") {
      stage = "finishing";
    } else if (qcPassedCount > 0 && qcPassedCount === br.totalCount) {
      stage = "qc-passed";
    } else if (completeCount === br.totalCount) {
      stage = "submitted";
    }

    const weaversMap: Record<string, WeaverRef> = {};
    br.rows.forEach(r => {
      if (r.weaverId && r.weaverName) {
        weaversMap[r.weaverId] = {
          id: r.weaverId,
          name: r.weaverName,
          initials: r.weaverInitials || r.weaverName.split(" ").map(n => n[0]).join("").toUpperCase(),
          bg: T.royalBurgundy
        };
      }
    });
    let weavers = Object.values(weaversMap);
    if (weavers.length === 0) {
      weavers = [{ id: "WV-UNASSIGNED", name: "Unassigned Loom", initials: "??", bg: T.taupe }];
    }

    const firstRowWithSaree = br.rows.find(r => r.sareeTypeCode);
    const sareeCode = firstRowWithSaree?.sareeTypeCode || "SB-001";
    const sareeTypeName = firstRowWithSaree?.sareeTypeName || "Self Brocade";
    const design = firstRowWithSaree?.designCode || "BKB-045";

    const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return "25 May 2026";
      }
    };

    return {
      id: br.batchId,
      stage,
      sareeCode,
      sareeTypeName,
      rate: 450, // default rate
      design,
      designName: "Production Design",
      weavers,
      materials: "Warp: 6 kg · Resham: Red 800g · Jari: Gold 250g",
      started: formatDate(br.createdAt),
      expected: formatDate(br.dueDate),
      submitted: stage === "submitted" || stage === "qc-passed" || stage === "finishing" ? formatDate(br.updatedAt) : undefined,
      done: completeCount,
      total: br.totalCount,
      qcPassed: qcPassedCount > 0 ? qcPassedCount : undefined,
      isLive: true
    };
  });

  const combined: Batch[] = [...mappedContextBatches];

  const visible = combined.filter(b => {
    if (filter && b.stage !== filter) return false;

    const rawBatch = batches.find(br => br.batchId === b.id);
    if (rawBatch && !matchesDateFilter(rawBatch.createdAt, dateFilter)) return false;

    if (activeOnly && (b.stage === "qc-passed" || b.stage === "finishing") && !filter) return false;

    if (search) {
      const q = search.toLowerCase();
      return b.id.toLowerCase().includes(q) || b.weavers.some(w => w.name.toLowerCase().includes(q)) || b.design.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "Most Complete") {
      return (b.done / b.total) - (a.done / a.total);
    } else if (sortBy === "Least Complete") {
      return (a.done / a.total) - (b.done / b.total);
    }
    return a.id.localeCompare(b.id);
  });

  const handleEditBatch = (b: Batch) => {
    setPendingOpenBatchId(b.id);
    onNavigate?.("Batches");
  };

  return (
    <div id="prod-active-batches" style={{ padding: "40px 48px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
            <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>All Active Production Batches</h2>
          </div>
          <motion.button onClick={() => onNavigate?.("Batches")} initial={{ backgroundColor: T.green }} animate={{ backgroundColor: T.green }} whileHover={{ scale: 1.03, backgroundColor: "#145230" }} whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "12px 20px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(30,102,64,0.2)" }}>
            <PhPlus size={16} weight="bold" /> Create New Batch
          </motion.button>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 20px" }}>Every active batch currently being worked on by weavers. Each batch is one set of materials given to one or more weavers for a specific design.</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          {FILTER_PILLS.map(f => (
            <motion.button key={f.label} onClick={() => setFilter(f.stage)} whileHover={{ scale: 1.02 }}
              style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: filter === f.stage ? T.royalBurgundy : "transparent", color: filter === f.stage ? "#FFFDF9" : T.taupe, border: filter === f.stage ? "none" : `1px solid rgba(110,15,45,0.18)`, transition: "all 0.18s" }}>
              {f.label}
            </motion.button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
            <MagnifyingGlass size={18} weight="bold" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by batch number, weaver name, or design code..."
              style={{ width: "100%", height: 46, paddingLeft: 44, paddingRight: 16, fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", background: "#FFFFFF" }}>
            {VIEW_OPTIONS.map(({ key, label, Icon }) => (
              <motion.button key={key} onClick={() => setView(key)} animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }} transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}>
                <Icon size={16} weight={view === key ? "bold" : "regular"} /> {label}
              </motion.button>
            ))}
          </div>
          <div style={{ position: "relative" }}><motion.button onClick={() => setSortOpen(!sortOpen)} whileHover={{ scale: 1.02 }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.taupe, cursor: "pointer" }}>
            Sort By: {sortBy} <PhCaretDown size={14} weight="bold" />
          </motion.button>{sortOpen && <div style={{ position: "absolute", top: 44, right: 0, zIndex: 20, background: "#fff", border: `1px solid ${T.borderDef}`, borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: 190 }}>{["Most Recent First", "Most Complete", "Least Complete"].map(v => <button key={v} onClick={() => { setSortBy(v); setSortOpen(false); }} style={{ display: "block", width: "100%", padding: "11px 14px", background: v === sortBy ? T.warmCream : "#fff", border: "none", textAlign: "left", fontFamily: F.ui, color: T.luxuryBrown, cursor: "pointer" }}>{v}</button>)}</div>}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "9px 12px", borderRadius: 10 }}>
              <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} style={{ cursor: "pointer" }} />
              Active Only
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
            Production Batches — {visible.length} batch{visible.length !== 1 ? "es" : ""}
          </div>
          {visible.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "#FFFFFF", borderRadius: 16, border: `1px dashed ${T.borderDef}`, color: T.taupe, fontFamily: F.ui }}>
              No batches found matching the current filters.
            </div>
          ) : (
            view === "card" ? <BatchCardGrid batches={visible} onView={handleEditBatch} onSlip={(batch) => setBatchDialog({ mode: "slip", batch })} onEdit={handleEditBatch} /> :
            view === "list" ? <BatchListView batches={visible} onView={handleEditBatch} onEdit={handleEditBatch} /> :
            <BatchTableView batches={visible} onView={handleEditBatch} onEdit={handleEditBatch} />
          )}
        </div>
      </FadeUp>
      <AnimatePresence>
        {batchDialog && (
          batchDialog.mode === "view" && batchDialog.batch?.isLive ? (
            (() => {
              const liveRecord = batches.find(br => br.batchId === batchDialog.batch?.id);
              if (!liveRecord) return null;
              return (
                <ContextBatchDetailsDialog
                  b={liveRecord}
                  onClose={() => setBatchDialog(null)}
                  onOpenCreation={() => {
                    setPendingOpenBatchId(liveRecord.batchId);
                    onNavigate?.("Batches");
                    setBatchDialog(null);
                  }}
                />
              );
            })()
          ) : (
            <ProductionDialog open={!!batchDialog} title={batchDialog.mode === "view" ? "Batch details" : "Color slip"} onClose={() => setBatchDialog(null)}>
              <div style={{ fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.65 }}>
                <b>{batchDialog.batch?.id}</b><br />
                {batchDialog.mode === "view"
                  ? `Design ${batchDialog.batch?.design} · ${batchDialog.batch?.done} of ${batchDialog.batch?.total} sarees complete.`
                  : `Color slip for ${batchDialog.batch?.design}: maroon body, antique-gold border, pallu accent recorded for loom handoff.`
                }
              </div>
            </ProductionDialog>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
