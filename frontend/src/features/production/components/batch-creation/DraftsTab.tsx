import React, { useState } from "react";
import { Layers as Stack, ArrowRight, Trash2 } from "lucide-react";
import { BatchRecord, useBatches } from "../../contexts/BatchContext";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { ConfirmDialog } from "../../../../shared/ui/ConfirmDialog";
import { ApiError } from "../../../../shared/api/client";
import { T, F, rowComplete } from "./constants";
import { Button, IconButton } from "../../../../shared/ui/primitives";

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
          <Stack size={40} color={T.taupe} style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No batches yet.</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginTop: 6 }}>Create a batch to get started.</div>
          <Button onClick={() => setTab("new")} variant="primary" size="lg" className="mt-5 bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:opacity-90">
            Create New Batch
          </Button>
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
                    <Button onClick={() => openDraft(b)} variant="primary" size="md" className="shrink-0 bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:opacity-90">
                      {isDraft ? "Continue Editing" : "Open & Edit"} <ArrowRight size={14} />
                    </Button>
                  )}
                  <IconButton onClick={() => setDeletingBatch(b)} icon={Trash2} label="Delete batch" variant="ghost" className="w-[42px] h-[42px] shrink-0 text-[#C0392B] bg-[#C0392B]/10 hover:bg-[#C0392B]/20" />
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
