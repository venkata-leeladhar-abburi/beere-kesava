import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronDown as PhCaretDown, Plus as PhPlus, Layers } from "lucide-react";
import { useBatches } from "../../contexts/BatchContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { FILTER_PILLS, VIEW_OPTIONS } from "../data";
import type { Batch, BatchStage, CodeCallbacks, WeaverRef } from "../types";
import { FadeUp, ProductionDialog } from "../common/primitives";
import { Button, Checkbox, SearchInput } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../../shared/ui/overlay";
import { BatchCardGrid, BatchListView, BatchTableView } from "./batches/BatchViews";
import { rowComplete } from "./batches/ContextBatchCard";

export function ActiveBatchesSection({ onNavigate, onOpenTally }: { onNavigate?: (tab: string) => void; onOpenTally?: (batchId: string) => void } & CodeCallbacks) {
  const { batches, setPendingOpenBatchId } = useBatches();
  const contextBatches = batches.filter(b => b.status === "active" || b.status === "draft");

  const [view,   setView]   = useState("card");
  const [filter, setFilter] = useState<BatchStage | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Most Recent First");
  const [batchDialog, setBatchDialog] = useState<{ mode: "slip"; batch?: Batch } | null>(null);

  // Map BatchRecord from context to Batch type
  const mappedContextBatches: Batch[] = contextBatches.map(br => {
    const completeCount = br.rows.filter(rowComplete).length;
    const qcPassedCount = br.rows.filter(r => r.qcPassed).length;
    // "Produced" / "complete" — QC-passed OR finished via the Raise
    // Quotation receive flow (either milestone alone counts a saree as
    // produced). The batch reaches "finishing"/locked-from-edits once every
    // assigned saree is produced by that definition.
    const producedCount = br.rows.filter(r => r.qcPassed === true || r.finished === true).length;
    // Only an explicit QC fail counts as rejected — a saree produced via the
    // Raise Quotation flow without its own QC-pass flag isn't a rejection.
    const rejectedCount = br.rows.filter(r => r.qcPassed === false).length;

    let stage: BatchStage = "weaving";
    if (producedCount > 0 && producedCount === br.totalCount) {
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
      done: producedCount,
      total: br.totalCount,
      qcPassed: qcPassedCount > 0 ? qcPassedCount : undefined,
      rejected: rejectedCount,
      // Not editable once every assigned saree has been produced (finished) —
      // the batch is locked at that point.
      isLive: producedCount < br.totalCount,
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

  // Clicking a batch (card, list row, or its "Tally" action) opens the real
  // per-saree weight/material tally as its own full page instead of jumping
  // straight to the batch-creation table — "Open in Batch Creation" on that
  // page is still there for anyone who actually wants the row-editing table.
  const handleViewBatch = (b: Batch) => {
    if (b.isLive && onOpenTally) {
      onOpenTally(b.id);
    } else {
      handleEditBatch(b);
    }
  };

  return (
    <div id="prod-active-batches" className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 40 }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
          <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
            <div className="flex items-start gap-3.5 sm:gap-4 w-full">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Layers size={26} color="#FFFDF9" />
              </div>
              <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>All Active Production Batches</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>Every active batch currently being worked on by weavers. Each batch is one set of materials given to one or more weavers for a specific design.</div>
                </div>
                <Button onClick={() => onNavigate?.("Batches")} variant="primary" size="sm" iconLeft={PhPlus}
                  className="bg-[#1E6640] hover:bg-[#145230] shadow-[0_4px_12px_rgba(30,102,64,0.2)]">
                  Create New Batch
                </Button>
              </div>
            </div>
          </div>

        <div className="p-3.5 sm:p-6 md:p-7">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto max-w-full pb-1 scrollbar-none whitespace-nowrap">
          {FILTER_PILLS.map(f => (
            <Button key={f.label} onClick={() => setFilter(f.stage)} variant={filter === f.stage ? "primary" : "tertiary"} size="sm"
              className={`rounded-full shrink-0 whitespace-nowrap text-[12px] ${filter === f.stage ? "" : "border border-[rgba(110,15,45,0.18)] text-[var(--text-tertiary)]"}`}>
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-6 w-full max-w-full">
          <div className="w-full sm:flex-1 sm:min-w-[220px]">
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by batch number, weaver name, or design code..." className="h-[44px] w-full" />
          </div>
          
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
              {VIEW_OPTIONS.map(({ key, label, Icon }) => (
                <Button key={key} onClick={() => setView(key)} variant="ghost"
                  className={`h-auto rounded-none gap-1 py-2 px-2.5 sm:px-3.5 text-[12px] sm:text-[13px] font-bold ${view === key ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]" : "bg-white text-[var(--text-tertiary)]"}`}>
                  <Icon size={15} /> {label}
                </Button>
              ))}
            </div>

            <DropdownMenu open={sortOpen} onOpenChange={setSortOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="md" iconRight={PhCaretDown} className="text-[var(--text-tertiary)] text-[12px] sm:text-[13px] shrink-0">
                  Sort: {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!min-w-[190px] !p-0 !rounded-xl !overflow-hidden" style={{ background: "#fff", border: `1px solid ${T.borderDef}` }}>
                {["Most Recent First", "Most Complete", "Least Complete"].map(v => (
                  <DropdownMenuItem key={v} onClick={() => setSortBy(v)} className={`!rounded-none !py-[11px] !px-3.5 !text-sm !font-normal !text-[#3B2314] ${v === sortBy ? "!bg-[#F5E8D0]" : ""}`}>
                    {v}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap max-w-full w-full sm:w-auto">
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
            <label htmlFor="active-only-filter" className="flex items-center gap-1.5 cursor-pointer font-ui text-[12px] sm:text-[13px] text-[#2C0913] bg-[#F7F2EA] border border-[#E8DCC4] px-3 py-2 rounded-xl shrink-0">
              <Checkbox id="active-only-filter" checked={activeOnly} onCheckedChange={c => setActiveOnly(c === true)} />
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
            view === "card" ? <BatchCardGrid batches={visible} onView={handleViewBatch} onSlip={(batch) => setBatchDialog({ mode: "slip", batch })} onEdit={handleEditBatch} /> :
            view === "list" ? <BatchListView batches={visible} onView={handleViewBatch} onEdit={handleEditBatch} /> :
            <BatchTableView batches={visible} onView={handleViewBatch} onEdit={handleEditBatch} />
          )}
        </div>
        </div>
        </div>
      </FadeUp>
      <AnimatePresence>
        {batchDialog && (
          <ProductionDialog open={!!batchDialog} title="Color slip" onClose={() => setBatchDialog(null)}>
            <div style={{ fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.65 }}>
              <b>{batchDialog.batch?.id}</b><br />
              {`Color slip for ${batchDialog.batch?.design}: maroon body, antique-gold border, pallu accent recorded for loom handoff.`}
            </div>
          </ProductionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
