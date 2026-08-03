import React from "react";
import { motion } from "motion/react";
import { Stack, ArrowRight } from "@phosphor-icons/react";
import { BatchRecord } from "../../contexts/BatchContext";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F, G, rowComplete } from "./constants";

export function DraftsTab({
  batches, batchDateFilter, setBatchDateFilter, setTab, openDraft,
}: {
  batches: BatchRecord[];
  batchDateFilter: DateFilterState;
  setBatchDateFilter: (f: DateFilterState) => void;
  setTab: (t: "new" | "drafts") => void;
  openDraft: (b: BatchRecord) => void;
}) {
  return (
    <div style={{ padding: "28px 56px 64px" }}>
      {batches.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "56px 24px", textAlign: "center" }}>
          <Stack size={40} color={T.taupe} weight="duotone" style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No batches yet.</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginTop: 6 }}>Create a batch to get started.</div>
          <motion.button onClick={() => setTab("new")} whileHover={{ scale: 1.02 }} style={{ marginTop: 20, height: 44, padding: "0 24px", background: G.button, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Create New Batch
          </motion.button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <DateFilterBar filter={batchDateFilter} onChange={setBatchDateFilter} />
          {batches.filter(b => matchesDateFilter(b.createdAt, batchDateFilter)).map(b => {
            const done = b.rows.filter(rowComplete).length;
            const pct = b.totalCount > 0 ? Math.round((done / b.totalCount) * 100) : 0;
            const isDraft = b.status === "draft";
            const isActive = b.status === "active";
            const isCompleted = b.status === "completed";
            const accentColor = isDraft ? T.royalBurgundy : isActive ? T.green : T.taupe;
            const chipBg = isDraft ? "rgba(110,15,45,0.08)" : isActive ? "rgba(30,102,64,0.09)" : "rgba(139,112,96,0.10)";
            const chipLabel = isDraft ? "DRAFT" : isActive ? "ACTIVE" : "COMPLETED";
            return (
              <div key={b.batchId} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, borderLeft: `5px solid ${accentColor}`, padding: "20px 24px", boxShadow: "0 2px 10px rgba(74,6,27,0.05)", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: accentColor }}>{b.batchId}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, background: chipBg, color: accentColor, borderRadius: 6, padding: "2px 9px", fontWeight: 600 }}>{chipLabel}</span>
                    {b.dueDate && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Due: {b.dueDate}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{b.totalCount} sarees total</span>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 600 }}>{done} complete</span>
                    {b.totalCount - done > 0 && <span style={{ fontFamily: F.ui, fontSize: 13, color: T.amber, fontWeight: 600 }}>{b.totalCount - done} incomplete</span>}
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.10)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : accentColor, borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>{pct}% complete · Updated {new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                {!isCompleted && (
                  <motion.button onClick={() => openDraft(b)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", background: G.button, color: "#fff", border: "none", borderRadius: 11, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    {isDraft ? "Continue Editing" : "Open & Edit"} <ArrowRight size={14} weight="bold" />
                  </motion.button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
