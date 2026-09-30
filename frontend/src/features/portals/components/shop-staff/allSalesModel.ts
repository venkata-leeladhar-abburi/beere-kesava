/**
 * Shop Staff → All Sales — data model.
 * ═══════════════════════════════════════════════════════════════════════════
 * Everything the All Sales page shows is derived here: every sale on record
 * (all pages, not the first 100), which of them came back, how they group into
 * counter bills, and the filter/sort pipeline. The page itself only renders.
 *
 * Bills: the backend records one SaleRecord per saree. Newer sales carry the
 * `billId` the counter checkout stamped on every saree of the bill, and are
 * grouped by it exactly. Older rows have none: a counter checkout writes its
 * sarees back to back, for one customer, with one payment and one cashier —
 * so consecutive sales sharing all of those, within BILL_WINDOW_MS of each
 * other, are read as one bill. Either way the bill is numbered by its first
 * sale reference, exactly as the New Sale flow numbers the bill it prints.
 *
 * GST: `amount` is what was paid for the saree and includes its share of the
 * bill's GST, when GST was charged — see lib/domain/saleGst.
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { salesApi, type BackendSaleRecord, type BackendSaleReturn } from "../../../../shared/api/sales";
import {
  DEFAULT_DATE_FILTER, matchesDateFilter, type DateFilterState,
} from "../../../../shared/ui/DateFilterBar";
import { sareeTypeText } from "./stock-format";
import { billGstFromSales, saleGstAmount, saleGstRate, saleTaxable } from "../../../../lib/domain/saleGst";
import { dateFilterLabel } from "./salesReportModel";

const BILL_WINDOW_MS = 5 * 60 * 1000;

export const ALL = "all";

export interface SaleLineRow {
  key: string;
  saleRef: string;
  billRef: string;
  sareeId: string;
  date: string;
  time: number;
  customerId: string | null;
  customer: string;
  customerPhone: string | null;
  customerAddress: string | null;
  customerCode: string | null;
  channel: "RETAIL" | "WHOLESALE";
  channelLabel: "Retail" | "Wholesale";
  sareeType: string;
  design: string | null;
  payKey: string;
  pay: string;
  payRef: string | null;
  /** Counter bill id stamped at checkout; null on older rows. */
  billId: string | null;
  /** What was paid for the saree — GST included when the bill charged it. */
  amount: number;
  /** The price before GST (equals `amount` when none was charged). */
  taxable: number;
  /** GST rate (%), or null when the bill charged none. */
  gstRate: number | null;
  /** This saree's share of the bill's GST. */
  gst: number;
  customerGstin: string | null;
  sellerGstin: string | null;
  soldById: string | null;
  soldBy: string | null;
  returned: boolean;
  returnRef: string | null;
  refund: number;
}

export interface BillRow {
  key: string;
  billRef: string;
  date: string;
  time: number;
  customer: string;
  customerPhone: string | null;
  customerAddress: string | null;
  channel: "RETAIL" | "WHOLESALE";
  channelLabel: "Retail" | "Wholesale";
  pay: string;
  payKey: string;
  payRef: string | null;
  soldBy: string | null;
  lines: SaleLineRow[];
  pieces: number;
  /** What the customer paid — GST included. */
  total: number;
  /** GST on the bill (0 when none was charged). */
  gst: number;
  gstRate: number | null;
  customerGstin: string | null;
  sellerGstin: string | null;
  returnedCount: number;
}

export type StatusFilter = "all" | "sold" | "returned";
export type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc";

export interface AllSalesFilters {
  search: string;
  date: DateFilterState;
  channel: string;
  payment: string;
  customer: string;
  sareeType: string;
  soldBy: string;
  status: StatusFilter;
  minAmount: string;
  maxAmount: string;
  sort: SortKey;
}

export const DEFAULT_FILTERS: AllSalesFilters = {
  search: "",
  date: DEFAULT_DATE_FILTER,
  channel: ALL,
  payment: ALL,
  customer: ALL,
  sareeType: ALL,
  soldBy: ALL,
  status: "all",
  minAmount: "",
  maxAmount: "",
  sort: "newest",
};

function paymentLabel(method: string | null | undefined): string {
  const m = (method ?? "").trim();
  if (!m) return "Not recorded";
  if (m.toLowerCase() === "upi") return "UPI";
  return m
    .toLowerCase()
    .split(/[\s_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function actorName(actor: BackendSaleRecord["soldBy"]): string | null {
  if (!actor) return null;
  return [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() || null;
}

function toTime(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** A return counts against a sale when it is for the same saree and was
 *  recorded after that sale — a saree resold after a return is a new sale. */
function latestReturnAfter(returns: BackendSaleReturn[] | undefined, saleTime: number): BackendSaleReturn | null {
  if (!returns) return null;
  let best: BackendSaleReturn | null = null;
  for (const r of returns) {
    const t = toTime(r.returnDate);
    if (t >= saleTime && (!best || t > toTime(best.returnDate))) best = r;
  }
  return best;
}

function toLine(s: BackendSaleRecord, returnsBySaree: Map<string, BackendSaleReturn[]>): Omit<SaleLineRow, "billRef"> {
  const time = toTime(s.saleDate);
  const ret = latestReturnAfter(returnsBySaree.get(s.sareeId), time);
  const channel = s.channel === "WHOLESALE" ? "WHOLESALE" : "RETAIL";
  const typeText = sareeTypeText({
    sareeTypeCode: s.saree?.sareeTypeCode ?? null,
    sareeTypeLabel: s.saree?.sareeType?.type ?? s.externalSareeType ?? null,
  });
  return {
    key: s.saleRef,
    saleRef: s.saleRef,
    sareeId: s.sareeId,
    date: s.saleDate,
    time,
    customerId: s.customerId,
    customer: s.customer?.name?.trim() || (s.customerId ? `Customer ${s.customerId.slice(0, 6)}` : "Walk-in Customer"),
    customerPhone: s.customer?.phone ?? null,
    customerAddress: [s.customer?.address, s.customer?.city].filter(Boolean).join(", ") || null,
    customerCode: s.customer?.code ?? null,
    channel,
    channelLabel: channel === "WHOLESALE" ? "Wholesale" : "Retail",
    sareeType: typeText,
    design: s.saree?.designCode ?? null,
    payKey: (s.paymentMethod ?? "").trim().toLowerCase() || "none",
    pay: paymentLabel(s.paymentMethod),
    payRef: s.paymentRef ?? null,
    billId: s.billId ?? null,
    amount: Number(s.amount) || 0,
    taxable: saleTaxable(s),
    gstRate: saleGstRate(s),
    gst: saleGstAmount(s),
    customerGstin: s.customerGstin ?? null,
    sellerGstin: s.sellerGstin ?? null,
    soldById: s.soldBy?.id ?? null,
    soldBy: actorName(s.soldBy),
    returned: ret !== null,
    returnRef: ret?.returnRef ?? null,
    refund: ret ? Number(ret.refundAmount ?? 0) || 0 : 0,
  };
}

/** Groups sale lines into counter bills — see the file header. */
export function groupIntoBills(lines: Omit<SaleLineRow, "billRef">[]): { lines: SaleLineRow[]; bills: BillRow[] } {
  const ordered = [...lines].sort((a, b) => a.time - b.time || a.saleRef.localeCompare(b.saleRef));
  const open = new Map<string, { bill: BillRow; lastTime: number }>();
  const bills: BillRow[] = [];
  const out: SaleLineRow[] = [];

  for (const l of ordered) {
    // A stamped bill id is the bill; the time window only guesses for rows
    // recorded before it existed.
    const groupKey = l.billId
      ? `bill|${l.billId}`
      : [l.channel, l.customerId ?? "", l.payKey, l.payRef ?? "", l.soldById ?? ""].join("|");
    const current = open.get(groupKey);
    let bill: BillRow;
    if (current && (l.billId || l.time - current.lastTime <= BILL_WINDOW_MS)) {
      bill = current.bill;
    } else {
      bill = {
        key: l.saleRef,
        billRef: l.saleRef,
        date: l.date,
        time: l.time,
        customer: l.customer,
        customerPhone: l.customerPhone,
        customerAddress: l.customerAddress,
        channel: l.channel,
        channelLabel: l.channelLabel,
        pay: l.pay,
        payKey: l.payKey,
        payRef: l.payRef,
        soldBy: l.soldBy,
        lines: [],
        pieces: 0,
        total: 0,
        gst: 0,
        gstRate: null,
        customerGstin: null,
        sellerGstin: null,
        returnedCount: 0,
      };
      bills.push(bill);
    }
    open.set(groupKey, { bill, lastTime: l.time });
    const row: SaleLineRow = { ...l, billRef: bill.billRef };
    bill.lines.push(row);
    bill.pieces += 1;
    if (row.returned) bill.returnedCount += 1;
    out.push(row);
  }
  // Money totals on paise: GST shares carry paise, and float sums would not.
  for (const bill of bills) {
    bill.total = bill.lines.reduce((sum, l) => sum + Math.round(l.amount * 100), 0) / 100;
    const tax = billGstFromSales(bill.lines.map(l => ({
      amount: l.amount, gstRate: l.gstRate, gstAmount: l.gst,
      customerGstin: l.customerGstin, sellerGstin: l.sellerGstin,
    })));
    if (tax) {
      bill.gst = tax.amount;
      bill.gstRate = tax.rate;
      bill.customerGstin = tax.customerGstin ?? null;
      bill.sellerGstin = tax.sellerGstin ?? null;
    }
  }
  return { lines: out, bills };
}

function lineMatches(l: SaleLineRow, f: AllSalesFilters, q: string, min: number | null, max: number | null): boolean {
  if (!matchesDateFilter(l.date, f.date)) return false;
  if (f.channel !== ALL && l.channel !== f.channel) return false;
  if (f.payment !== ALL && l.payKey !== f.payment) return false;
  if (f.customer !== ALL && (l.customerId ?? "") !== f.customer) return false;
  if (f.sareeType !== ALL && l.sareeType !== f.sareeType) return false;
  if (f.soldBy !== ALL && (l.soldById ?? "none") !== f.soldBy) return false;
  if (f.status === "sold" && l.returned) return false;
  if (f.status === "returned" && !l.returned) return false;
  if (min !== null && l.amount < min) return false;
  if (max !== null && l.amount > max) return false;
  if (q) {
    const hay = [
      l.saleRef, l.billRef, l.sareeId, l.customer, l.customerPhone, l.customerCode,
      l.sareeType, l.design, l.pay, l.payRef, l.soldBy, l.returnRef, l.customerGstin,
    ];
    if (!hay.some(v => (v ?? "").toLowerCase().includes(q))) return false;
  }
  return true;
}

function parseAmount(v: string): number | null {
  const n = Number(v.replace(/[,\s₹]/g, ""));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

function compare<T extends { time: number }>(sort: SortKey, amount: (x: T) => number) {
  return (a: T, b: T) => {
    switch (sort) {
      case "oldest": return a.time - b.time;
      case "amount-desc": return amount(b) - amount(a) || b.time - a.time;
      case "amount-asc": return amount(a) - amount(b) || b.time - a.time;
      default: return b.time - a.time;
    }
  };
}

export interface Option { value: string; label: string; hint?: string; keywords?: string[] }

export function useAllSalesModel(canSeePrices: boolean) {
  const [filters, setFilters] = React.useState<AllSalesFilters>(DEFAULT_FILTERS);
  const patch = React.useCallback(
    (p: Partial<AllSalesFilters>) => setFilters(prev => ({ ...prev, ...p })),
    [],
  );
  const reset = React.useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const salesQ = useQuery({ queryKey: ["shop-all-sales", "sales"], queryFn: () => salesApi.listAll() });
  // Returns only drive the "Returned" badge — a failure here must not take
  // the sales list down with it.
  const returnsQ = useQuery({ queryKey: ["shop-all-sales", "returns"], queryFn: () => salesApi.listAllReturns() });

  const { lines: allLines, bills: allBills } = React.useMemo(() => {
    const bySaree = new Map<string, BackendSaleReturn[]>();
    for (const r of returnsQ.data ?? []) {
      const arr = bySaree.get(r.sareeId);
      if (arr) arr.push(r); else bySaree.set(r.sareeId, [r]);
    }
    return groupIntoBills((salesQ.data ?? []).map(s => toLine(s, bySaree)));
  }, [salesQ.data, returnsQ.data]);

  // ── Dropdown options, built from what is actually on record ──────────────
  const options = React.useMemo(() => {
    const pay = new Map<string, string>();
    const cust = new Map<string, Option & { count: number }>();
    const types = new Map<string, number>();
    const staff = new Map<string, string>();
    for (const l of allLines) {
      pay.set(l.payKey, l.pay);
      const cid = l.customerId ?? "";
      const c = cust.get(cid);
      if (c) c.count += 1;
      else cust.set(cid, {
        value: cid, label: l.customer, count: 1,
        keywords: [l.customerPhone, l.customerCode].filter((x): x is string => !!x),
      });
      types.set(l.sareeType, (types.get(l.sareeType) ?? 0) + 1);
      staff.set(l.soldById ?? "none", l.soldBy ?? "Not recorded");
    }
    const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label);
    return {
      payments: [...pay].map(([value, label]) => ({ value, label })).sort(byLabel),
      customers: [...cust.values()]
        .map(c => ({ value: c.value, label: c.label, hint: `${c.count} saree${c.count === 1 ? "" : "s"}${c.keywords?.[0] ? ` · ${c.keywords[0]}` : ""}`, keywords: c.keywords }))
        .sort(byLabel),
      sareeTypes: [...types].map(([value, n]) => ({ value, label: value, hint: String(n) })).sort(byLabel),
      staff: [...staff].map(([value, label]) => ({ value, label })).sort(byLabel),
    };
  }, [allLines]);

  // ── Filter + sort ────────────────────────────────────────────────────────
  const q = filters.search.trim().toLowerCase();
  const min = canSeePrices ? parseAmount(filters.minAmount) : null;
  const max = canSeePrices ? parseAmount(filters.maxAmount) : null;
  const sort: SortKey = !canSeePrices && filters.sort.startsWith("amount") ? "newest" : filters.sort;

  const lines = React.useMemo(
    () => allLines.filter(l => lineMatches(l, filters, q, min, max)).sort(compare<SaleLineRow>(sort, l => l.amount)),
    [allLines, filters, q, min, max, sort],
  );

  // A bill is shown when any of its sarees match; its totals stay whole so a
  // reprinted bill always reads exactly as the customer received it.
  const bills = React.useMemo(() => {
    const hit = new Set(lines.map(l => l.billRef));
    return allBills.filter(b => hit.has(b.billRef)).sort(compare<BillRow>(sort, b => b.total));
  }, [allBills, lines, sort]);

  const billByRef = React.useMemo(() => new Map(allBills.map(b => [b.billRef, b])), [allBills]);

  const metrics = React.useMemo(() => {
    const revenue = lines.reduce((s, l) => s + Math.round(l.amount * 100), 0) / 100;
    const gst = lines.reduce((s, l) => s + Math.round(l.gst * 100), 0) / 100;
    const returned = lines.filter(l => l.returned);
    const refunded = returned.reduce((s, l) => s + l.refund, 0);
    const billCount = new Set(lines.map(l => l.billRef)).size;
    return {
      sarees: lines.length,
      bills: billCount,
      revenue,
      gst,
      refunded,
      net: revenue - refunded,
      returned: returned.length,
      customers: new Set(lines.map(l => l.customerId ?? l.customer)).size,
      avgBill: billCount ? Math.round(revenue / billCount) : 0,
      retail: lines.filter(l => l.channel === "RETAIL").length,
      wholesale: lines.filter(l => l.channel === "WHOLESALE").length,
    };
  }, [lines]);

  const activeFilterCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.date.mode !== "all" ? 1 : 0) +
    (filters.channel !== ALL ? 1 : 0) +
    (filters.payment !== ALL ? 1 : 0) +
    (filters.customer !== ALL ? 1 : 0) +
    (filters.sareeType !== ALL ? 1 : 0) +
    (filters.soldBy !== ALL ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (min !== null ? 1 : 0) +
    (max !== null ? 1 : 0);

  return {
    filters, patch, reset, activeFilterCount,
    dateLabel: dateFilterLabel(filters.date),
    options,
    lines, bills, billByRef, metrics,
    totalOnRecord: allLines.length,
    loading: salesQ.isLoading,
    error: salesQ.isError,
    fetching: salesQ.isFetching || returnsQ.isFetching,
    returnsError: returnsQ.isError,
    refetch: () => { void salesQ.refetch(); void returnsQ.refetch(); },
  };
}

export type AllSalesModel = ReturnType<typeof useAllSalesModel>;
