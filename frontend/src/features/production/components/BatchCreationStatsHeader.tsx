import React from "react";
import { T, F, G } from "./batch-creation/constants";
import { BatchRecord } from "../contexts/BatchContext";

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
  setRows: (rows: any[]) => void;
  setTotalCount: (v: string) => void;
  setDueDate: (v: string) => void;
  setGenerated: (v: boolean) => void;
  setSelected: (s: Set<number>) => void;
}

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
}: BatchCreationStatsHeaderProps) {
  return (
    <>
      {/* ── Header ── */}
      <div style={{ background: G.header, padding: "32px 56px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, bottom: -60, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.14)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 60, bottom: -10, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 10 }}>
            Since 1999 · Production
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.1 }}>Batch Creation</h1>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontStyle: "italic", color: T.antiqueGold, marginBottom: 12 }}>& Management</div>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 500, margin: 0, lineHeight: 1.6 }}>
            Create a new production batch, assign weavers, design codes, and bulk orders to individual sarees, then finalize or save as draft.
          </p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ padding: "0 48px", marginTop: -36, position: "relative", zIndex: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 14, display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr", boxShadow: "0 8px 28px rgba(44,6,27,0.22)", overflow: "hidden" }}>
          {[
            { label: "Active Batches",   val: active.length    },
            { label: "Draft Batches",    val: drafts.length    },
            { label: "Total Sarees",     val: [...active, ...drafts].reduce((s, b) => s + b.totalCount, 0) },
            { label: "Weavers Active",   val: weaversActiveCount, gold: true },
          ].flatMap((s, i, arr) => {
            const cell = (
              <div key={s.label} style={{ padding: "20px 28px", background: s.gold ? "linear-gradient(135deg, rgba(200,155,71,0.18) 0%, rgba(200,155,71,0.08) 100%)" : undefined, borderTop: s.gold ? `3px solid ${T.antiqueGold}` : undefined }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: s.gold ? T.goldLight : "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: s.gold ? T.goldLight : "#fff", lineHeight: 1 }}>{s.val}</div>
              </div>
            );
            return i < arr.length - 1 ? [cell, <div key={`d${i}`} style={{ background: "rgba(255,255,255,0.08)" }} />] : [cell];
          })}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: "32px 56px 0" }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, width: "fit-content", border: `1px solid ${T.borderDef}` }}>
          <button
            onClick={() => {
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
            }}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: tab === "new" && !editingBatchId ? T.royalBurgundy : "transparent",
              color: tab === "new" && !editingBatchId ? "#fff" : T.taupe,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s"
            }}
          >
            Create New Batch
          </button>

          {editingBatchId && (
            <button
              onClick={() => setTab("new")}
              style={{
                padding: "9px 20px",
                borderRadius: 9,
                border: "none",
                background: tab === "new" ? T.royalBurgundy : "transparent",
                color: tab === "new" ? "#fff" : T.taupe,
                fontFamily: F.ui,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s"
              }}
            >
              Edit {editingBatchId}
            </button>
          )}

          <button
            onClick={() => setTab("drafts")}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: tab === "drafts" ? T.royalBurgundy : "transparent",
              color: tab === "drafts" ? "#fff" : T.taupe,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s"
            }}
          >
            All Batches ({batches.length})
          </button>
        </div>
      </div>
    </>
  );
}
