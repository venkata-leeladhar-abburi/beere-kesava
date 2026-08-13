import React from "react";
import { T, F, G } from "./batch-creation/constants";
import { BatchRecord } from "../contexts/BatchContext";
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
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110, flex: "0 0 100%", maxWidth: "100%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
            Since 1999 · Production
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Batch Creation</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Management</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
            Create a new production batch, assign weavers, design codes, and bulk orders to individual sarees, then finalize or save as draft.
          </p>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]" style={{ position: "relative", zIndex: 20 }}>
        <div className="grid grid-cols-2 xl:flex" style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { label: "ACTIVE BATCHES",   val: active.length,                                                                   Icon: Layers,   hi: false, sub: "Currently weaving" },
            { label: "DRAFT BATCHES",    val: drafts.length,                                                                   Icon: FileEdit, hi: false, sub: "In preparation" },
            { label: "TOTAL SAREES",     val: [...active, ...drafts].reduce((s, b) => s + b.totalCount, 0),                    Icon: Hash,     hi: false, sub: "Across all batches" },
            { label: "WEAVERS ACTIVE",   val: weaversActiveCount,                                                              Icon: Users,    hi: true,  sub: "Assigned to batches" },
          ].map((m, i) => (
            <div
              key={m.label}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.Icon size={20} color={m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                    {m.sub}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32 }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, width: "fit-content", border: `1px solid ${T.borderDef}` }}>
          <Button
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
            variant={tab === "new" && !editingBatchId ? "primary" : "tertiary"}
            size="sm"
          >
            Create New Batch
          </Button>

          {editingBatchId && (
            <Button
              onClick={() => setTab("new")}
              variant={tab === "new" ? "primary" : "tertiary"}
              size="sm"
            >
              Edit {editingBatchId}
            </Button>
          )}

          <Button
            onClick={() => setTab("drafts")}
            variant={tab === "drafts" ? "primary" : "tertiary"}
            size="sm"
          >
            All Batches ({batches.length})
          </Button>
        </div>
      </div>
    </>
  );
}
