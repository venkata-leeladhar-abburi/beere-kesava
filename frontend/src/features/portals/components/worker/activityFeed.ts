/**
 * Worker Staff activity feed.
 * ═══════════════════════════════════════════════════════════════════════════
 * One builder shared by the home page's "Recent Activity" card and the full
 * Activity page, so both render the same events in the same order.
 *
 * Before this existed the home card mapped `qcRecords.slice(0, 5)` straight to
 * rows, which had three visible bugs:
 *   - the list was in whatever order the API returned, so "recent" wasn't
 *   - a `semi` result was labelled "failed" (only passed/failed were handled)
 *   - a saree re-inspected in the same minute produced identical-looking rows
 * All three are fixed here, once, for both call sites.
 */
import type { QcRecord } from "@/features/qc";
import type { BatchRecord } from "@/features/production";

export type WorkerActivityType =
  | "qc-passed" | "qc-semi" | "qc-defective"
  | "received" | "finished" | "tallied";

/** Coarse grouping used by the Activity page's category filter. */
export type WorkerActivityCategory = "qc" | "receipt" | "finishing" | "tally";

export type WorkerActivityTone = "success" | "warning" | "danger" | "brand" | "neutral";

export interface WorkerActivityEvent {
  /** Stable and unique — `${type}:${sourceId}`. Safe as a React key. */
  id: string;
  type: WorkerActivityType;
  category: WorkerActivityCategory;
  label: string;
  description: string;
  tone: WorkerActivityTone;
  isoDate: string;
  sareeId: string;
  batchId: string | null;
  weaverName: string | null;
  sareeTypeName: string | null;
  /** Who performed it, when the record carries it. */
  actor: string | null;
}

export const ACTIVITY_TYPE_LABEL: Record<WorkerActivityType, string> = {
  "qc-passed": "QC passed",
  "qc-semi": "QC semi-approved",
  "qc-defective": "QC defective",
  received: "Saree received",
  finished: "Finishing done",
  tallied: "Tallied",
};

export const ACTIVITY_CATEGORY_LABEL: Record<WorkerActivityCategory, string> = {
  qc: "Quality check",
  receipt: "Saree receipts",
  finishing: "Finishing",
  tally: "Tally",
};

const QC_TYPE: Record<QcRecord["result"], WorkerActivityType> = {
  passed: "qc-passed",
  semi: "qc-semi",
  defective: "qc-defective",
};

const QC_TONE: Record<QcRecord["result"], WorkerActivityTone> = {
  passed: "success",
  semi: "warning",
  defective: "danger",
};

const QC_VERB: Record<QcRecord["result"], string> = {
  passed: "passed quality check",
  semi: "was semi-approved at quality check",
  defective: "failed quality check",
};

function isValidDate(iso: string | null | undefined): iso is string {
  if (!iso) return false;
  return !Number.isNaN(new Date(iso).getTime());
}

/**
 * Flattens QC records and batch rows into one reverse-chronological feed.
 * Rows with no usable timestamp are dropped rather than rendered as
 * "Invalid Date", which is what the old home card did.
 */
export function buildWorkerActivity(
  qcRecords: QcRecord[],
  batches: BatchRecord[],
): WorkerActivityEvent[] {
  const events: WorkerActivityEvent[] = [];

  for (const r of qcRecords) {
    if (!isValidDate(r.qcDate)) continue;
    events.push({
      id: `qc:${r.id}`,
      type: QC_TYPE[r.result],
      category: "qc",
      label: ACTIVITY_TYPE_LABEL[QC_TYPE[r.result]],
      description: `Saree ${r.sareeId} ${QC_VERB[r.result]}`,
      tone: QC_TONE[r.result],
      isoDate: r.qcDate,
      sareeId: r.sareeId,
      batchId: r.batchId,
      weaverName: r.weaverName || r.factoryLoomNumber,
      sareeTypeName: r.sareeTypeName,
      actor: r.inspectedBy || null,
    });
  }

  for (const b of batches) {
    for (const row of b.rows) {
      if (!row.sareeId) continue;
      const common = {
        sareeId: row.sareeId,
        batchId: b.batchId,
        weaverName: row.weaverName || row.factoryLoomNumber || null,
        sareeTypeName: row.sareeTypeName,
      };
      if (isValidDate(row.receivedAt)) {
        events.push({
          ...common,
          id: `received:${b.batchId}:${row.serial}`,
          type: "received",
          category: "receipt",
          label: ACTIVITY_TYPE_LABEL.received,
          description: `Saree ${row.sareeId} received${row.weaverName ? ` from ${row.weaverName}` : ""}`,
          tone: "brand",
          isoDate: row.receivedAt,
          actor: row.receivedBy || null,
        });
      }
      if (isValidDate(row.finishedAt)) {
        events.push({
          ...common,
          id: `finished:${b.batchId}:${row.serial}`,
          type: "finished",
          category: "finishing",
          label: ACTIVITY_TYPE_LABEL.finished,
          description: `Saree ${row.sareeId} completed finishing`,
          tone: "success",
          isoDate: row.finishedAt,
          actor: null,
        });
      }
      if (isValidDate(row.talliedAt)) {
        events.push({
          ...common,
          id: `tallied:${b.batchId}:${row.serial}`,
          type: "tallied",
          category: "tally",
          label: ACTIVITY_TYPE_LABEL.tallied,
          description: `Saree ${row.sareeId} tallied`,
          tone: "neutral",
          isoDate: row.talliedAt,
          actor: row.talliedBy || null,
        });
      }
    }
  }

  events.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

  // Two records for the same saree, same outcome, same minute are a double
  // submit, not two inspections — the home card was showing three identical
  // "RAMARAO-L2-B014-004 passed quality check · 27 Aug, 04:08 pm" rows.
  const seen = new Set<string>();
  return events.filter(e => {
    const minute = e.isoDate.slice(0, 16);
    const sig = `${e.type}|${e.sareeId}|${minute}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

/** "28 Aug 2026, 11:52 am" — the app's en-IN convention. */
export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

/** "2 hours ago" for the feed's leading line. */
export function formatActivityRelative(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatActivityTime(iso);
}
