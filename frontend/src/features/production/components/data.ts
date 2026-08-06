import type React from "react";
import { CheckCircle, WarningCircle, XCircle, SquaresFour, ListDashes, List as PhList } from "@phosphor-icons/react";
import { T } from "./theme";
import type { BulkOrder, OrderStatus, BatchStage, Batch, HistoryBatch } from "./types";

// ─── SECTION 2 — Stats strip ───────────────────────────────────────────────────
export const STATS = [
  { label: "TOTAL BATCHES ACTIVE RIGHT NOW",    value: "24",  sub: "Across all weavers currently",       highlight: false, crimson: false, goldVal: false },
  { label: "SAREES BEING PRODUCED",             value: "186", sub: "In progress across all batches",      highlight: false, crimson: false, goldVal: false },
  { label: "SAREES WAITING FOR QUALITY CHECK",  value: "32",  sub: "⚠ Need quality check today",          highlight: false, crimson: true },
];

export const BULK_ORDERS: BulkOrder[] = [];

export const ORDER_CFG: Record<OrderStatus, {
  strip: string; badgeBg: string; badgeColor: string;
  PhIcon: React.ElementType; iconBg: string; iconColor: string;
  barColor: string;
}> = {
  "on-track": { strip: T.green,       badgeBg: "rgba(30,102,64,0.10)",   badgeColor: T.green,       PhIcon: CheckCircle,   iconBg: "rgba(30,102,64,0.12)",   iconColor: T.green,       barColor: T.green       },
  "at-risk":  { strip: T.antiqueGold, badgeBg: "rgba(200,155,71,0.12)", badgeColor: "#8B6018",     PhIcon: WarningCircle, iconBg: "rgba(200,155,71,0.12)",  iconColor: T.antiqueGold, barColor: T.antiqueGold },
  "overdue":  { strip: T.crimson,     badgeBg: "rgba(192,57,43,0.10)",  badgeColor: T.crimson,     PhIcon: XCircle,       iconBg: "rgba(192,57,43,0.10)",   iconColor: T.crimson,     barColor: T.crimson     },
};

export const STATUS_LABELS: Record<OrderStatus, (o: BulkOrder) => string> = {
  "on-track": () => "On Track",
  "at-risk":  o => `At Risk — ${o.daysLeft} day${o.daysLeft === 1 ? "" : "s"} left`,
  "overdue":  o => `Past Deadline — ${o.overdueBy} day${o.overdueBy === 1 ? "" : "s"} overdue`,
};

// ─── SECTION 4 — Active batches ─────────────────────────────────────────────────
export const STAGE_CFG: Record<BatchStage, { label: string; border: string; badgeBg: string; badgeColor: string }> = {
  "weaving":   { label: "Weaving in Progress",                        border: "#C4923A", badgeBg: "rgba(196,146,58,0.12)", badgeColor: "#8B6018" },
  "submitted": { label: "Sarees Submitted — Waiting Quality Check",   border: T.blueGray, badgeBg: "rgba(74,107,138,0.10)", badgeColor: T.blueGray },
  "qc-passed": { label: "Quality Check Passed — Moved to Stock",      border: T.green,   badgeBg: "rgba(30,102,64,0.10)", badgeColor: T.green   },
  "finishing": { label: "In Stock — Ready for Sale",                  border: T.green,   badgeBg: "rgba(30,102,64,0.10)", badgeColor: T.green   },
};

export const FILTER_PILLS: { label: string; stage: BatchStage | null }[] = [
  { label: "All Batches",                             stage: null          },
  { label: "Material Issued — Weaving in Progress",   stage: "weaving"     },
  { label: "Sarees Submitted",                        stage: "submitted"   },
  { label: "Quality Check Passed",                    stage: "qc-passed"   },
  { label: "In Stock — Ready for Sale",               stage: "finishing"   },
];

export const BATCHES: Batch[] = [];

export const VIEW_OPTIONS = [
  { key: "card",  label: "Card View",  Icon: SquaresFour },
  { key: "list",  label: "List View",  Icon: ListDashes },
  { key: "table", label: "Table View", Icon: PhList },
];

// ─── Defective sarees ───────────────────────────────────────────────────────────
export const DEFECTIVE_DATA: any[] = [];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const WEEKLY_DATA: any[] = [];
export const STAGE_FUNNEL: any[] = [];
export const TOP_WEAVERS_CHART: any[] = [];
export const ORDER_PROGRESS: any[] = [];
export const ANALYTICS_PERIODS = ["This Week", "This Month", "Last 3 Months", "This Year"];

// ─── Production history ─────────────────────────────────────────────────────────
export const HISTORY_BATCHES: HistoryBatch[] = [];
