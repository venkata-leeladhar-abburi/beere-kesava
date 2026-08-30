/**
 * Shop Staff → Reports — shared data + analytics model.
 * ═══════════════════════════════════════════════════════════════════════════
 * Mobile (SalesReport.tsx) and desktop (desktop/ReportsSection.tsx) render very
 * different layouts but must agree on every number, so all fetching, date
 * filtering and metric derivation lives here once.
 *
 * Filtering uses the app-wide DateFilterBar contract (All Time / Specific Date /
 * Date Range / Monthly / Yearly) rather than the old hardcoded
 * Today/Week/Month/3-Months buttons, which were purely decorative — they set
 * state that nothing ever read.
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { salesApi, type BackendSaleRecord, type BackendSaleReturn } from "../../../../shared/api/sales";
import { customersApi } from "../../../../shared/api/customers";
import {
  DEFAULT_DATE_FILTER, matchesDateFilter,
  type DateFilterState,
} from "../../../../shared/ui/DateFilterBar";

export function dateLabel(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** Human label for the active filter — used in section headings so the table
 *  header always says what the rows below are actually scoped to. */
export function dateFilterLabel(f: DateFilterState): string {
  switch (f.mode) {
    case "day":
      return f.day ? new Date(f.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Selected date";
    case "range": {
      const from = f.from ? new Date(f.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start";
      const to = f.to ? new Date(f.to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today";
      return `${from} – ${to}`;
    }
    case "month": {
      if (!f.month) return "Selected month";
      const [y = "", m = ""] = f.month.split("-");
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    }
    case "year":
      return f.year || "Selected year";
    default:
      return "All Time";
  }
}

export interface SalesReportRow {
  key: string;
  saleRef: string;
  sareeId: string;
  date: string;
  dateText: string;
  time: string;
  customer: string;
  design: string;
  channel: "RETAIL" | "WHOLESALE";
  pay: string;
  amount: number;
  soldBy: string | null;
}

export interface ReturnReportRow {
  key: string;
  returnRef: string;
  sareeId: string;
  date: string;
  dateText: string;
  reason: string;
  amount: number;
}

function paymentLabel(method: string | null | undefined) {
  if (!method) return "Counter";
  return method
    .toLowerCase()
    .split(/[\s_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function useSalesReportModel() {
  const [filter, setFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const salesQuery = useQuery({
    queryKey: ["shop-staff-report", "sales"],
    queryFn: () => salesApi.list(500),
  });
  const returnsQuery = useQuery({
    queryKey: ["shop-staff-report", "returns"],
    queryFn: () => salesApi.listReturns(500),
  });
  const customersQuery = useQuery({
    queryKey: ["shop-staff-report", "customers"],
    // The customers endpoint caps pageSize at 100 (ListCustomersQueryDto) —
    // asking for more is a 400, which is what put "Something went wrong" in
    // the Top Customers card. Names come from each sale's own `customer`
    // relation anyway; this list is only the fallback lookup.
    queryFn: () => customersApi.list(100),
  });

  const customerMap = React.useMemo(
    () => new Map((customersQuery.data?.items ?? []).map(c => [c.id, c.name])),
    [customersQuery.data],
  );

  const allSales: BackendSaleRecord[] = React.useMemo(() => salesQuery.data?.items ?? [], [salesQuery.data]);
  const allReturns: BackendSaleReturn[] = React.useMemo(() => returnsQuery.data?.items ?? [], [returnsQuery.data]);

  const salesRows = React.useMemo<SalesReportRow[]>(() => allSales
    .filter(s => matchesDateFilter(s.saleDate, filter))
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
    .map(s => ({
      key: s.saleRef,
      saleRef: s.saleRef,
      sareeId: s.sareeId,
      date: s.saleDate,
      dateText: dateLabel(s.saleDate),
      time: timeLabel(s.saleDate),
      customer: s.customerId
        ? (s.customer?.name ?? customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`)
        : "Walk-in Customer",
      design: s.channel === "WHOLESALE" ? "Wholesale" : "Retail",
      channel: s.channel,
      pay: paymentLabel(s.paymentMethod),
      amount: Number(s.amount) || 0,
      soldBy: s.soldBy ? `${s.soldBy.firstName ?? ""} ${s.soldBy.lastName ?? ""}`.trim() || null : null,
    })), [allSales, customerMap, filter]);

  const returnRows = React.useMemo<ReturnReportRow[]>(() => allReturns
    .filter(r => matchesDateFilter(r.returnDate, filter))
    .sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime())
    .map(r => ({
      key: r.returnRef,
      returnRef: r.returnRef,
      sareeId: r.sareeId,
      date: r.returnDate,
      dateText: dateLabel(r.returnDate),
      reason: r.reason || "Not specified",
      amount: Number(r.refundAmount ?? 0) || 0,
    })), [allReturns, filter]);

  // ── Headline metrics ──────────────────────────────────────────────────────
  const totalSalesCount = salesRows.length;
  const totalRevenue = salesRows.reduce((sum, s) => sum + s.amount, 0);
  const avgRevenue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;
  const refundTotal = returnRows.reduce((sum, r) => sum + r.amount, 0);
  const netRevenue = totalRevenue - refundTotal;
  const returnRate = totalSalesCount > 0 ? (returnRows.length / totalSalesCount) * 100 : 0;
  const highestSale = salesRows.reduce((max, s) => Math.max(max, s.amount), 0);
  const uniqueCustomers = new Set(salesRows.map(s => s.customer)).size;
  const wholesaleCount = salesRows.filter(s => s.channel === "WHOLESALE").length;
  const retailCount = salesRows.filter(s => s.channel === "RETAIL").length;
  const wholesaleRevenue = salesRows.filter(s => s.channel === "WHOLESALE").reduce((a, s) => a + s.amount, 0);
  const retailRevenue = salesRows.filter(s => s.channel === "RETAIL").reduce((a, s) => a + s.amount, 0);

  /** Revenue + count per calendar day, oldest → newest, for the trend chart. */
  const trend = React.useMemo(() => {
    const map = new Map<string, { day: string; label: string; revenue: number; count: number }>();
    for (const s of salesRows) {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = map.get(key) ?? { day: key, label: dateLabel(s.date), revenue: 0, count: 0 };
      entry.revenue += s.amount;
      entry.count += 1;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [salesRows]);

  /** Sale count per payment method. */
  const paymentMix = React.useMemo(() => {
    const map = new Map<string, { method: string; count: number; total: number }>();
    for (const s of salesRows) {
      const entry = map.get(s.pay) ?? { method: s.pay, count: 0, total: 0 };
      entry.count += 1;
      entry.total += s.amount;
      map.set(s.pay, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [salesRows]);

  /** Why sarees came back — drives the returns breakdown. */
  const returnReasons = React.useMemo(() => {
    const map = new Map<string, { reason: string; count: number; total: number }>();
    for (const r of returnRows) {
      const entry = map.get(r.reason) ?? { reason: r.reason, count: 0, total: 0 };
      entry.count += 1;
      entry.total += r.amount;
      map.set(r.reason, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [returnRows]);

  const channelData = React.useMemo(() => ([
    { design: "Retail", count: retailCount },
    { design: "Wholesale", count: wholesaleCount },
    { design: "Returns", count: returnRows.length },
  ]), [retailCount, wholesaleCount, returnRows.length]);

  const topCustomers = React.useMemo(() => {
    const map = new Map<string, { custId: string; name: string; purchases: number; total: number }>();
    for (const s of salesRows) {
      const key = s.customer;
      const existing = map.get(key) ?? { custId: key, name: key, purchases: 0, total: 0 };
      existing.purchases += 1;
      existing.total += s.amount;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [salesRows]);

  /** Best trading day inside the current filter window. */
  const bestDay = React.useMemo(
    () => trend.reduce<{ day: string; label: string; revenue: number; count: number } | null>(
      (best, d) => (!best || d.revenue > best.revenue ? d : best), null),
    [trend],
  );

  return {
    filter, setFilter, filterLabel: dateFilterLabel(filter),

    salesRows, returnRows,
    unfilteredSalesCount: allSales.length,

    isLoading: salesQuery.isLoading || returnsQuery.isLoading || customersQuery.isLoading,
    salesLoading: salesQuery.isLoading,
    returnsLoading: returnsQuery.isLoading,
    customersLoading: customersQuery.isLoading,
    salesError: salesQuery.isError,
    returnsError: returnsQuery.isError,
    customersError: customersQuery.isError,
    refetchSales: () => void salesQuery.refetch(),
    refetchReturns: () => void returnsQuery.refetch(),
    refetchCustomers: () => void customersQuery.refetch(),

    metrics: {
      totalSalesCount, totalRevenue, avgRevenue, refundTotal, netRevenue,
      returnRate, highestSale, uniqueCustomers,
      retailCount, wholesaleCount, retailRevenue, wholesaleRevenue,
      returnsCount: returnRows.length,
      bestDay,
    },

    trend, paymentMix, returnReasons, channelData, topCustomers,
  };
}

export type SalesReportModel = ReturnType<typeof useSalesReportModel>;
