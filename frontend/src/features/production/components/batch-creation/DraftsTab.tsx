import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Stack, ArrowRight, Trash } from "@phosphor-icons/react";
import { BatchRecord, useBatches } from "../../contexts/BatchContext";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { ConfirmDialog } from "../../../../shared/ui/ConfirmDialog";
import { ApiError } from "../../../../shared/api/client";
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
  const { deleteBatch } = useBatches();
  const [deletingBatch, setDeletingBatch] = useState<BatchRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function cancelDelete() {
    if (deleting) return;
    setDeletingBatch(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    // Guard re-entry: without this, a second click before the first
    // request resolves fires a duplicate DELETE at the same (possibly
    // already-gone) batch id.
    if (!deletingBatch || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBatch(deletingBatch.batchId);
      setDeletingBatch(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : `Could not delete ${deletingBatch.batchId}. Please try again.`);
    } finally {
      setDeleting(false);
    }
  }

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
            const isCompleted = b.status === "completed" || (b.totalCount > 0 && done === b.totalCount);
            const isActive = b.status === "active" && !isCompleted;
            const isDraft = b.status === "draft" && !isCompleted;

            const accentColor = isCompleted ? T.green : isDraft ? T.royalBurgundy : T.green;
            const chipBg = isCompleted ? "rgba(30,102,64,0.09)" : isDraft ? "rgba(110,15,45,0.08)" : "rgba(30,102,64,0.09)";
            const chipLabel = isCompleted ? "COMPLETED" : isDraft ? "DRAFT" : "ACTIVE";

            const assignedWeavers = Array.from(new Set(b.rows.map(r => r.weaverName).filter(Boolean)));
            const assignedLooms = Array.from(new Set(b.rows.map(r => r.factoryLoomNumber).filter(Boolean)));
            const assignmentText = assignedWeavers.length > 0
              ? `👤 Weaver: ${assignedWeavers.join(", ")}`
              : assignedLooms.length > 0
              ? `🏭 Loom: ${assignedLooms.join(", ")}`
              : "⚠️ Unassigned";

            return (
              <div key={b.batchId} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, borderLeft: `5px solid ${accentColor}`, padding: "20px 24px", boxShadow: "0 2px 10px rgba(74,6,27,0.05)", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: accentColor }}>{b.batchId}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, background: chipBg, color: accentColor, borderRadius: 6, padding: "2px 9px", fontWeight: 600 }}>{chipLabel}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(110,15,45,0.04)", color: T.darkBurgundy, border: `1px solid ${T.borderDef}`, borderRadius: 6, padding: "2px 9px", fontWeight: 600 }}>
                      {assignmentText}
                    </span>
                    {b.dueDate && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Due: {new Date(b.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{b.totalCount} saree{b.totalCount === 1 ? "" : "s"} total</span>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 600 }}>{done} complete</span>
                    {b.totalCount - done > 0 && <span style={{ fontFamily: F.ui, fontSize: 13, color: T.amber, fontWeight: 600 }}>{b.totalCount - done} incomplete</span>}
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.10)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : accentColor, borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{pct}% complete · Updated {new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {!isCompleted && (
                    <motion.button onClick={() => openDraft(b)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 20px", background: G.button, color: "#fff", border: "none", borderRadius: 11, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {isDraft ? "Continue Editing" : "Open & Edit"} <ArrowRight size={14} weight="bold" />
                    </motion.button>
                  )}
                  <motion.button onClick={() => setDeletingBatch(b)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    title="Delete batch"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: "rgba(192,57,43,0.08)", color: T.red, border: "1px solid rgba(192,57,43,0.22)", borderRadius: 11, cursor: "pointer" }}>
                    <Trash size={16} weight="bold" />
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {deletingBatch && (
          <ConfirmDialog
            title={`Delete ${deletingBatch.batchId}?`}
            message="This permanently removes the batch and all its saree rows. If materials have already been issued or QC recorded against it, deletion will be blocked."
            confirmLabel="Delete Permanently"
            loading={deleting}
            error={deleteError}
            onConfirm={() => void confirmDelete()}
            onCancel={cancelDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
