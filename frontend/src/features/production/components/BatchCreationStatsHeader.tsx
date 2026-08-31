import { T, F } from "./batch-creation/constants";
import { BatchRecord, SareeRow } from "../contexts/BatchContext";
import { Button } from "../../../shared/ui/primitives";
import { Layers, FileEdit, Hash, Users } from "lucide-react";

interface BatchCreationStatsHeaderProps {
  active: BatchRecord[];
  drafts: BatchRecord[];
  batches: BatchRecord[];
  weaversActiveCount: number;
  tab: "new" | "drafts";
  setTab: (tab: "new" | "drafts") => void;
  editingBatchId: string | null;
  setEditingBatchId: (id: string | null) => void;
  setBatchId: (id: string) => void;
  nextBatchId: string;
  setRows: (rows: SareeRow[]) => void;
  setTotalCount: (v: string) => void;
  setDueDate: (v: string) => void;
  setGenerated: (v: boolean) => void;
  setSelected: (s: Set<number>) => void;
  /** Runs `go` only once unsaved edits are saved or explicitly discarded. */
  guardLeave: (go: () => void) => void;
}

import { LuxuryStatsCard } from "../../../shared/ui/LuxuryStatsCard";

export function BatchCreationStatsHeader({
  active,
  drafts,
  batches,
  weaversActiveCount,
  tab,
  setTab,
  editingBatchId,
  setEditingBatchId,
  setBatchId,
  nextBatchId,
  setRows,
  setTotalCount,
  setDueDate,
  setGenerated,
  setSelected,
  guardLeave,
}: BatchCreationStatsHeaderProps) {
  const statItems = [
    { label: "ACTIVE BATCHES", value: String(active.length), icon: <Layers size={22} color={T.warmCream} />, sub: "Currently weaving", highlight: false },
    { label: "DRAFT BATCHES", value: String(drafts.length), icon: <FileEdit size={22} color={T.warmCream} />, sub: "In preparation", highlight: false },
    { label: "TOTAL SAREES", value: String([...active, ...drafts].reduce((s, b) => s + b.totalCount, 0)), icon: <Hash size={22} color={T.warmCream} />, sub: "Across all batches", highlight: false },
    { label: "WEAVERS ACTIVE", value: String(weaversActiveCount), icon: <Users size={22} color={T.warmCream} />, sub: "Assigned to batches", highlight: true },
  ];

  return (
    <>
      {/* ── Header ── */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110, flex: "0 0 100%", maxWidth: "100%" }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
            Since 1999 · Production
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Batch Creation</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Management</span>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: 0, lineHeight: 1.6 }}>
            Create a new production batch, assign weavers, design codes, and bulk orders to individual sarees, then finalize or save as draft.
          </p>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]" style={{ position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={statItems} />
      </div>

      {/* ── Tab bar ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32 }}>
        <div
          className="max-w-full overflow-x-auto whitespace-nowrap scrollbar-none"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "#fff",
            borderRadius: 12,
            padding: 4,
            width: "fit-content",
            border: `1px solid ${T.borderDef}`,
          }}
        >
          <Button
            onClick={() => guardLeave(() => {
              if (editingBatchId) {
                setEditingBatchId(null);
                setBatchId(nextBatchId);
                setRows([]);
                setTotalCount("");
                setDueDate("");
                setGenerated(false);
                setSelected(new Set());
              }
              setTab("new");
            })}
            variant={tab === "new" && !editingBatchId ? "primary" : "tertiary"}
            size="sm"
            className="shrink-0"
          >
            Create New Batch
          </Button>

          {editingBatchId && (
            <Button
              onClick={() => setTab("new")}
              variant={tab === "new" ? "primary" : "tertiary"}
              size="sm"
              className="shrink-0"
            >
              Edit {editingBatchId}
            </Button>
          )}

          <Button
            onClick={() => guardLeave(() => setTab("drafts"))}
            variant={tab === "drafts" ? "primary" : "tertiary"}
            size="sm"
            className="shrink-0"
          >
            All Batches ({batches.length})
          </Button>
        </div>
      </div>
    </>
  );
}
