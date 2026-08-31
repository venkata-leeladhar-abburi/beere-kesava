/**
 * Helpers shared by the Accountant Directory and one accountant's page.
 *
 * The authority for any figure a reader treats as a total is the server's
 * staff-summary endpoint, which aggregates in the database. What lives here
 * is the presentation layer around it: the period translation both screens
 * send, the per-day series behind the charts, and the row-level reductions
 * that are genuinely about the rows in hand.
 */
import {
  UNATTRIBUTED_ID,
  type StaffFinanceTotals,
  type StaffLedgerKind,
  type StaffLedgerRow,
} from "@/shared/api/staff-finance";

export interface KindConfig {
  label: string;
  /** Short form for a badge in a narrow column. */
  short: string;
  direction: "OUT" | "IN";
  /** Whose name lands in the "Party" column for this kind. */
  partyLabel: string;
}

export const KIND_CONFIG: Record<StaffLedgerKind, KindConfig> = {
  WEAVER: { label: "Weaver payment", short: "Weaver", direction: "OUT", partyLabel: "Weaver" },
  VENDOR: { label: "Vendor payment", short: "Vendor", direction: "OUT", partyLabel: "Vendor" },
  SUPPLIER: { label: "Supplier payment", short: "Supplier", direction: "OUT", partyLabel: "Supplier" },
  RETAIL_SALE: { label: "Retail collection", short: "Retail", direction: "IN", partyLabel: "Customer" },
};

export const KIND_ORDER: StaffLedgerKind[] = ["WEAVER", "VENDOR", "SUPPLIER", "RETAIL_SALE"];

/** Exactly what GET /payments/staff-summary returns for one person, minus
 *  the recorder id — so a locally-reduced total and a server-aggregated one
 *  are the same shape and are interchangeable at every call site. */
export type LedgerTotals = Omit<StaffFinanceTotals, "recordedById">;

/** A fresh zeroed total. A shared constant would be one stray mutation away
 *  from corrupting every person who happens to have no money this period. */
export function emptyTotals(): LedgerTotals {
  return { paidOut: 0, collectedIn: 0, txns: 0, avgTxn: 0, lastActivity: null, byKind: emptyByKind() };
}

/**
 * A DateFilterState as the server understands it.
 *
 * The bar's five modes all collapse to one inclusive instant range, computed
 * from the reader's local calendar so "August" means their August. Filtering
 * server-side is what lets a total cover the whole period instead of just the
 * rows that fit under the ledger's row cap.
 */
// dateFilterToRange now lives beside DateFilterBar in shared/ui — it converts
// that component's state into server bounds and is not accountant-specific.
// Re-exported here so existing importers (and its tests) are unaffected.
export { dateFilterToRange } from "../../../../../shared/ui/DateFilterBar";

function emptyByKind(): LedgerTotals["byKind"] {
  return {
    WEAVER: { amount: 0, count: 0 },
    VENDOR: { amount: 0, count: 0 },
    SUPPLIER: { amount: 0, count: 0 },
    RETAIL_SALE: { amount: 0, count: 0 },
  };
}

/**
 * Totals reduced from a list of rows.
 *
 * The server's staff-summary is the authority for anything a reader treats as
 * a figure; this exists for the cases that are genuinely about the rows in
 * hand — a search-filtered table's own subtotal.
 */
export function summarise(rows: StaffLedgerRow[]): LedgerTotals {
  const byKind = emptyByKind();
  let paidOut = 0;
  let collectedIn = 0;
  let lastActivity: string | null = null;

  for (const row of rows) {
    byKind[row.kind].amount += row.amount;
    byKind[row.kind].count += 1;
    if (row.direction === "OUT") paidOut += row.amount;
    else collectedIn += row.amount;
    if (!lastActivity || row.date > lastActivity) lastActivity = row.date;
  }

  const txns = rows.length;
  return {
    paidOut,
    collectedIn,
    txns,
    avgTxn: txns === 0 ? 0 : (paidOut + collectedIn) / txns,
    lastActivity,
    byKind,
  };
}

/** Ledger rows bucketed per recorder; unattributed rows share one bucket. */
export function groupByRecorder(rows: StaffLedgerRow[]): Map<string, StaffLedgerRow[]> {
  const grouped = new Map<string, StaffLedgerRow[]>();
  for (const row of rows) {
    const key = row.recordedById ?? UNATTRIBUTED_ID;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(row);
    else grouped.set(key, [row]);
  }
  return grouped;
}

export interface DayPoint {
  /** yyyy-mm-dd, local time — matches how a day reads on the shop floor. */
  date: string;
  out: number;
  in: number;
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * A dense day-by-day series, dense rather than sparse so a quiet day renders
 * as a genuine gap instead of being silently skipped, which would flatter a
 * patchy record.
 *
 * The window ends at `endDate` — the caller passes the newest row it is
 * showing whenever a period filter is active, because a window pinned to
 * today would render an empty chart above tiles full of real figures the
 * moment someone filters to an earlier month.
 */
export function dailySeries(rows: StaffLedgerRow[], days = 14, endDate?: string | null): DayPoint[] {
  const buckets = new Map<string, DayPoint>();
  const end = endDate ? new Date(endDate) : new Date();
  if (Number.isNaN(end.getTime())) end.setTime(Date.now());
  end.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const key = isoDay(d);
    buckets.set(key, { date: key, out: 0, in: 0 });
  }

  for (const row of rows) {
    const parsed = new Date(row.date);
    if (Number.isNaN(parsed.getTime())) continue;
    const bucket = buckets.get(isoDay(parsed));
    if (!bucket) continue;
    if (row.direction === "OUT") bucket.out += row.amount;
    else bucket.in += row.amount;
  }

  return [...buckets.values()];
}

/** Free-text match across everything a reader would plausibly type. */
export function matchesLedgerSearch(row: StaffLedgerRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    (row.partyName ?? "").toLowerCase().includes(q) ||
    (row.partyCode ?? "").toLowerCase().includes(q) ||
    (row.reference ?? "").toLowerCase().includes(q) ||
    (row.method ?? "").toLowerCase().includes(q) ||
    (row.firmName ?? "").toLowerCase().includes(q) ||
    KIND_CONFIG[row.kind].label.toLowerCase().includes(q)
  );
}
