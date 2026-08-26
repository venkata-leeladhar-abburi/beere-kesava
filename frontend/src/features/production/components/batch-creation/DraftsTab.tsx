import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Layers as Stack, ArrowRight, Trash2 } from "lucide-react";
import { BatchRecord, useBatches } from "../../contexts/BatchContext";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { ConfirmDialog } from "../../../../shared/ui/ConfirmDialog";
import { ApiError } from "../../../../shared/api/client";
import { T, F } from "./constants";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { SectionCard } from "../common/primitives";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";

export function DraftsTab({
  batches, batchDateFilter, setBatchDateFilter, setTab, openDraft,
}: {
  batches: BatchRecord[];
  batchDateFilter: DateFilterState;
  setBatchDateFilter: (f: DateFilterState) => void;
  setTab: (t: "new" | "drafts") => void;
  openDraft: (b: BatchRecord) => void;
}) {
  const { deleteBatch, isLoading, isError, error, refetch } = useBatches();
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
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 28, paddingBottom: 64 }}>
    <SectionCard icon={Stack} title="All Batches" subtitle="Every batch created so far — drafts, active, and completed.">
      {isLoading ? (
        <LoadingState variant="skeleton" rows={4} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : batches.length === 0 ? (
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
            // "Complete" = QC-passed OR finished via the Raise Quotation
            // receive flow — either milestone alone counts a saree as done.
            const done = b.rows.filter(r => r.qcPassed === true || r.finished === true).length;
            const pct = b.totalCount > 0 ? Math.round((done / b.totalCount) * 100) : 0;
            const isCompleted = b.status === "completed" || (b.totalCount > 0 && done === b.totalCount);
            const isDraft = b.status === "draft" && !isCompleted;

            const accentColor = isCompleted ? T.green : isDraft ? T.royalBurgundy : T.green;
            const chipBg = isCompleted ? "rgba(30,102,64,0.09)" : isDraft ? "rgba(110,15,45,0.08)" : "rgba(30,102,64,0.09)";
            const chipLabel = isCompleted ? "COMPLETED" : isDraft ? "DRAFT" : "ACTIVE";

            const assignedWeavers = Array.from(new Set(b.rows.map(r => r.weaverName).filter(Boolean)));
            const assignedLooms = Array.from(new Set(b.rows.map(r => r.factoryLoomNumber).filter(Boolean)));
            const assignmentText = assignedWeavers.length > 0
              ? `👤 Weaver: ${assignedWeavers.join(", ")}`
              : assignedLooms.length > 0
              ? `🏭 Loom ${assignedLooms.join(", ")}`
              : "Unassigned";

            return (
              <div key={b.batchId}
                className="p-4 sm:p-5 bg-white rounded-2xl border-[1.5px] border-[#E8DCC4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full"
                style={{ boxShadow: "0 2px 10px rgba(44,24,16,0.04)" }}>
                <div className="w-full sm:flex-1">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>{b.batchId}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: accentColor, background: chipBg, borderRadius: 6, padding: "2px 8px", letterSpacing: "0.5px" }}>{chipLabel}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{assignmentText}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{b.totalCount} saree{b.totalCount === 1 ? "" : "s"} total</span>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 600 }}>{done} complete</span>
                    {b.totalCount - done > 0 && <span style={{ fontFamily: F.ui, fontSize: 13, color: T.amber, fontWeight: 600 }}>{b.totalCount - done} incomplete</span>}
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.10)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : accentColor, borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{pct}% complete · Updated {new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                  {isCompleted ? (
                    <Button onClick={() => openDraft(b)} variant="secondary" size="md" className="flex-1 sm:flex-initial justify-center">
                      View <ArrowRight size={14} />
                    </Button>
                  ) : (
                    <Button onClick={() => openDraft(b)} variant="primary" size="md" className="flex-1 sm:flex-initial justify-center bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:opacity-90">
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
    </SectionCard>

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
