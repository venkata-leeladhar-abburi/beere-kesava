import type { MyBatchEntry } from "./WeaverMobileBatchCard";

/**
 * Whether a single saree row counts as *produced* from the weaver's point of
 * view: it passed QC, or it was finished via the Raise Quotation receive flow.
 * Either milestone alone is enough. A semi-approved saree meets neither — it
 * is back with the weaver for rework.
 *
 * `finished` alone is NOT the test: it's a downstream finishing-stage flag the
 * weaver has no hand in, so a batch whose sarees had all passed QC still read
 * as "Weaving in Progress" on the weaver portal while its own card showed
 * Produced 10/10 and QC 10/10 passed.
 */
export function isRowProduced(r: { qcPassed?: boolean | null; finished?: boolean | null }) {
  return r.qcPassed === true || r.finished === true;
}

/**
 * Whether a batch is done as far as its assigned weaver is concerned: the
 * backend has closed it, or every saree assigned to this weaver is produced.
 *
 * Single source of truth for MyBatchesPage, DesktopWeaverPortal and
 * BatchHistoryPage — these three disagreed before, which shelved the same
 * batch under "Active" in one view and "Completed" in another.
 */
export function isBatchDoneForWeaver(b: Pick<MyBatchEntry, "status" | "myRows">) {
  if (b.status === "completed") return true;
  if (b.myRows.length === 0) return false;
  return b.myRows.every(isRowProduced);
}

/** Backend due dates arrive as ISO timestamps; the portal shows a plain date. */
export function formatDueDate(due: string | null | undefined) {
  if (!due) return null;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return due;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
