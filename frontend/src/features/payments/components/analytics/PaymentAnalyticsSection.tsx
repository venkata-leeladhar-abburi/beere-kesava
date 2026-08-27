import React, { useMemo } from "react";
import { CheckCircle2, CircleAlert, Download, IndianRupee, Scissors, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { analyticsApi } from "../../../../shared/api/analytics";
import { EASE, F, T } from "../../theme";
import { AnimCount, FadeUp } from "../common/motion";
import { SectionCard } from "../common/primitives";
import { CashFlowTooltip } from "./CashFlowTooltip";
import { weaversApi } from "../../../../shared/api/weavers";
import { weaverPaymentsApi, vendorPaymentsApi, supplierPaymentsApi } from "../../../../shared/api/payments";
import { invoicesApi } from "../../../../shared/api/invoices";
import { Button } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { ChartFigure } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

const DIST_PALETTE = ["#4A061B", "#6E0F2D", "#8B3050", "#845E04", "#69635E"];

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  return new Date(year, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function PaymentAnalyticsSection() {

  const { data: cashFlowRes, isLoading: cashFlowLoading, isError: cashFlowError } = useQuery({
    queryKey: ["analytics-cash-flow-monthly"],
    queryFn: () => analyticsApi.getCashFlowMonthly(6),
  });
  const cashFlowData = (cashFlowRes?.items ?? []).map(d => ({
    ...d,
    month: formatMonthLabel(d.month),
  }));

  // Top-5 weaver making-charges distribution, computed live from
  // GET /payments/weavers grouped by weaverId + GET /weavers for names.
  const { data: weaversRes, isLoading: weaversLoading, isError: weaversError, refetch: refetchWeavers } = useQuery({
    queryKey: ["analytics-weavers-roster"],
    queryFn: () => weaversApi.list(),
  });
  const { data: weaverPaymentsRes, isLoading: weaverPaymentsLoading, isError: weaverPaymentsError, refetch: refetchWeaverPayments } = useQuery({
    queryKey: ["analytics-weaver-payments"],
    queryFn: () => weaverPaymentsApi.list(),
  });

  const { data: vendorPaymentsRes } = useQuery({
    queryKey: ["analytics-vendor-payments"],
    queryFn: () => vendorPaymentsApi.list(),
  });
  const { data: supplierPaymentsRes } = useQuery({
    queryKey: ["analytics-supplier-payments"],
    queryFn: () => supplierPaymentsApi.list(),
  });

  const { weaverDistData, totalTop5 } = useMemo(() => {
    const payments = weaverPaymentsRes?.items ?? [];
    if (payments.length === 0) {
      return { weaverDistData: [] as { name: string; amount: number; pct: number; color: string }[], totalTop5: 0 };
    }
    const nameById = new Map((weaversRes?.items ?? []).map(w => [w.id, w.name]));
    const totalsByWeaver = new Map<string, number>();
    for (const p of payments) {
      totalsByWeaver.set(p.weaverId, (totalsByWeaver.get(p.weaverId) ?? 0) + Number(p.amountPaid));
    }
    const top5 = Array.from(totalsByWeaver.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxAmount = top5[0]?.[1] ?? 1;
    const data = top5.map(([weaverId, amount], i) => ({
      name: nameById.get(weaverId) ?? weaverId,
      amount,
      pct: Math.round((amount / maxAmount) * 100),
      color: DIST_PALETTE[i % DIST_PALETTE.length],
    }));
    return { weaverDistData: data, totalTop5: data.reduce((s, d) => s + d.amount, 0) };
  }, [weaverPaymentsRes, weaversRes]);

  // Customer payment compliance (paid/partial/overdue counts), derived live
  // from GET /invoices status field. Falls back to the static demo split
  // only when there are no invoices yet.
  const { data: invoicesRes, isLoading: invoicesLoading, isError: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ["analytics-invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const invoiceCount = invoicesRes?.items.length ?? 0;
  const complianceData = useMemo(() => {
    const items = invoicesRes?.items ?? [];
    if (items.length === 0) return [] as { name: string; value: number; color: string }[];
    const paid = items.filter(i => i.status === "PAID").length;
    const partial = items.filter(i => i.status === "PARTIAL").length;
    const overdue = items.filter(i => i.status === "OVERDUE").length;
    const pending = items.filter(i => i.status === "PENDING").length;
    return [
      { name: "Paid", value: paid, color: "#1E6640" },
      { name: "Partial", value: partial, color: "#845E04" },
      { name: "Overdue", value: overdue, color: "#C0392B" },
      { name: "Pending", value: pending, color: "#69635E" },
    ].filter(d => d.value > 0);
  }, [invoicesRes]);

  // Outstanding from customers = sum(total - paid) across real invoices.
  const outstandingFromCustomers = (invoicesRes?.items ?? []).reduce(
    (s, inv) => s + (Number(inv.total) - Number(inv.paid)), 0,
  );
  // Total vendor payments = sum of GET /payments/vendors amounts (all-time —
  // the backend has no "this period" filter for these endpoints).
  const totalVendorPayments = (vendorPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amount), 0);
  // Net income = real customer collections minus real vendor/supplier/weaver
  // payouts, all-time. There's no backend "this month" aggregation endpoint,
  // so this is a live all-time figure rather than a calendar-month one.
  const netIncome = useMemo(() => {
    const collected = (invoicesRes?.items ?? []).reduce((s, inv) => s + Number(inv.paid), 0);
    const supplierPaid = (supplierPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const weaverPaid = (weaverPaymentsRes?.items ?? []).reduce((s, p) => s + Number(p.amountPaid), 0);
    return collected - totalVendorPayments - supplierPaid - weaverPaid;
  }, [invoicesRes, supplierPaymentsRes, weaverPaymentsRes, totalVendorPayments]);

  const METRICS = [
    {
      icon: <TrendingUp size={22} color={T.green} />,
      iconBg: T.greenBg,
      iconBorder: "rgba(30,102,64,0.18)",
      label: "Net Income (All-Time)",
      value: `${netIncome < 0 ? "−" : ""}${formatMoney(rupees(Math.abs(netIncome)))}`,
      sub: "Customer collections minus vendor/supplier/weaver payouts",
      color: netIncome >= 0 ? T.green : T.crimson,
      hi: false,
    },
    {
      icon: <CircleAlert size={22} color={T.crimson} />,
      iconBg: T.crimsonBg,
      iconBorder: "rgba(192,57,43,0.18)",
      label: "Outstanding from Customers",
      value: formatMoney(rupees(outstandingFromCustomers)),
      sub: "Pending invoice collections",
      color: T.crimson,
      hi: false,
    },
    {
      icon: <Scissors size={22} color={T.royalBurgundy} />,
      iconBg: "rgba(110,15,45,0.08)",
      iconBorder: T.borderDef,
      label: "Paid to Top 5 Weavers",
      value: formatMoney(rupees(totalTop5)),
      sub: "Making charges · all recorded payments",
      color: T.royalBurgundy,
      hi: false,
    },
    {
      icon: <IndianRupee size={22} color={T.antiqueGold} />,
      iconBg: "rgba(200,155,71,0.12)",
      iconBorder: T.borderGold,
      label: "Total Vendor Payments",
      value: formatMoney(rupees(totalVendorPayments)),
      sub: "Raw materials & supplies",
      color: T.antiqueGold,
      hi: true,
    },
  ];

  return (
    <div id="pay-analytics" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36, paddingBottom: 40 }}>
      <FadeUp>
      <SectionCard
        icon={TrendingUp}
        title="Payment Analytics & Insights"
        subtitle="Visual breakdown of cash flow, customer compliance, and top weaver earnings."
        actions={
          <DownloadGate>
            <Button variant="secondary" size="md" iconLeft={Download}
              className="rounded-[10px] border-[1.5px] border-[rgba(200,155,71,0.22)] bg-gradient-to-br from-[rgba(200,155,71,0.15)] to-[rgba(200,155,71,0.05)] text-[#C89B47] hover:from-[rgba(200,155,71,0.22)] hover:to-[rgba(200,155,71,0.08)]">
              Export Report
            </Button>
          </DownloadGate>
        }
      >

        {/* ── 4 summary stat cards ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 18, marginBottom: 24, alignItems: "stretch" }}>
          {METRICS.map((m, _i) => (
            <div key={m.label} style={{ position: "relative", borderRadius: 14, border: `1px solid ${T.borderDef}`, background: "#FFFDF9", boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 6px 30px rgba(0,0,0,0.04)", overflow: "visible", display: "flex", flexDirection: "column" as const, alignItems: "center", minHeight: 236, containerType: "inline-size" }}>
              {/* ── Header — royal burgundy gradient ── */}
              <svg
                viewBox="0 0 300 90"
                preserveAspectRatio="none"
                style={{ width: "100%", height: 44, display: "block", borderRadius: "12px 12px 0 0", flexShrink: 0 }}
              >
                <defs>
                  <linearGradient id={`bk-head-analytics-${_i}`} x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#7A1232" />
                    <stop offset="40%" stopColor={T.royalBurgundy} />
                    <stop offset="100%" stopColor={T.deepWine} />
                  </linearGradient>
                  <linearGradient id={`bk-shim-analytics-${_i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(200,155,71,0)" />
                    <stop offset="50%" stopColor="rgba(200,155,71,0.08)" />
                    <stop offset="100%" stopColor="rgba(200,155,71,0)" />
                  </linearGradient>
                </defs>
                <path d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z" fill={`url(#bk-head-analytics-${_i})`} />
                <path d="M0,0 L300,0 L300,32 C230,36 190,85 150,88 C110,85 70,36 0,32 Z" fill={`url(#bk-shim-analytics-${_i})`} opacity="0.4" />
                <path d="M0,32 C70,36 110,85 150,88 C190,85 230,36 300,32" fill="none" stroke="rgba(200,155,71,0.30)" strokeWidth="0.7" />
                <g transform="translate(150,86)" opacity="0.45">
                  <path d="M-6,0 C-8,-3 -11,-2 -10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M6,0 C8,-3 11,-2 10,0" fill="none" stroke={T.antiqueGold} strokeWidth="0.8" strokeLinecap="round" />
                  {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament (a peacock-feather flourish), not a chart data mark */}
                  <rect x="-2" y="-2" width="4" height="4" rx="0.3" fill={T.antiqueGold} transform="rotate(45)" />
                </g>
              </svg>

              {/* ── Circular icon badge ── */}
              <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(155deg, #7A1232 0%, #6E0F2D 40%, #4A061B 100%)", border: `2.5px solid rgba(200,155,71,0.45)`, boxShadow: "0 4px 14px rgba(74,6,27,0.25), 0 0 0 3px rgba(255,253,249,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.cloneElement(m.icon as React.ReactElement, { color: T.antiqueGold })}
                </div>
              </div>

              {/* ── Card body content ── */}
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, padding: "34px 20px 0", width: "100%" }}>
                <div style={{ fontFamily: F.ui, fontSize: "clamp(10px, 4cqw, 13px)", fontWeight: 700, color: T.royalBurgundy, letterSpacing: 1, textTransform: "uppercase" as const, textAlign: "center" as const, lineHeight: 1.45 }}>{m.label}</div>
                <div style={{ fontFamily: F.display, fontSize: "clamp(24px, 10cqw, 36px)", fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginTop: 14, textAlign: "center" as const }}>
                  <AnimCount raw={m.value} />
                </div>
                <div style={{ width: "45%", display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0 12px" }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                  <div style={{ width: 5, height: 5, background: "rgba(110,15,45,0.22)", transform: "rotate(45deg)", flexShrink: 0, margin: "0 4px" }} />
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(110,15,45,0.14), transparent)` }} />
                </div>
                <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 4.5cqw, 14px)", color: T.taupe, textAlign: "center" as const, lineHeight: 1.4 }}>{m.sub}</div>
              </div>

              {/* ── Footer strip — royal burgundy ── */}
              <div style={{ width: "100%", marginTop: "auto", position: "relative", overflow: "hidden", borderRadius: "0 0 12px 12px", height: 30, flexShrink: 0 }}>
                <svg viewBox="0 0 300 40" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", position: "absolute", top: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`bk-foot-analytics-${_i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.royalBurgundy} />
                      <stop offset="50%" stopColor="#5A0A22" />
                      <stop offset="100%" stopColor={T.deepWine} />
                    </linearGradient>
                  </defs>
                  <path d="M0,28 C60,28 100,10 150,8 C200,10 240,28 300,28 L300,40 L0,40 Z" fill={`url(#bk-foot-analytics-${_i})`} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyItems: "center", justifyContent: "center", paddingBottom: 0 }}>
                  <img src="/assets/gold-fleur-footer.png" alt="Ornament" style={{ height: 26, maxWidth: "100%", objectFit: "contain", opacity: 0.9, transform: "translateY(1px)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 3-column chart grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 22, alignItems: "stretch" }}>

          {/* Chart 1 — Cash Flow Overview */}
          <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: T.greenBg, border: "1px solid rgba(30,102,64,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TrendingUp size={22} color={T.green} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Cash Flow Overview</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Income vs. expenses · Last 6 months</div>
                </div>
              </div>
            </div>
            {/* Chart body */}
            <div style={{ flex: 1, padding: "18px 10px 14px" }}>
              {cashFlowLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  Loading cash flow…
                </div>
              ) : cashFlowError ? (
                <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
                  Failed to load cash flow data.
                </div>
              ) : cashFlowData.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  No cash flow data yet.
                </div>
              ) : (
              <>
              <ChartFigure title="Cash Flow Overview" summary={`Income vs. expenses across the last ${cashFlowData.length} months.`}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={cashFlowData} barGap={4} barCategoryGap="28%">
                    <CartesianGrid key="cf-grid"     strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                    <XAxis         key="cf-xaxis"    dataKey="month" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                    <YAxis         key="cf-yaxis"    tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatMoney(rupees(v), { compact: true })} width={46} />
                    <Tooltip       key="cf-tooltip"  content={<CashFlowTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
                    <Bar           key="cf-income"   dataKey="income"   name="Income"   fill={T.green}  radius={[5,5,0,0] as [number, number, number, number]} />
                    <Bar           key="cf-expenses" dataKey="expenses" name="Expenses" fill={T.crimson} radius={[5,5,0,0] as [number, number, number, number]} opacity={0.80} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFigure>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
                {[{ color: T.green, label: "Income" }, { color: T.crimson, label: "Expenses" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 4, background: l.color }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{l.label}</span>
                  </div>
                ))}
              </div>
              </>
              )}
            </div>
          </div>

          {/* Chart 2 — Customer Payment Compliance */}
          <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={22} color={T.antiqueGold} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Payment Compliance</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Invoice status breakdown · May 2026</div>
                </div>
              </div>
            </div>
            {/* Chart body */}
            <div style={{ flex: 1, padding: "18px 10px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {invoicesLoading ? (
                <LoadingState variant="skeleton" rows={3} />
              ) : invoicesError ? (
                <ErrorState error={undefined} onRetry={() => void refetchInvoices()} />
              ) : complianceData.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  No invoices recorded yet.
                </div>
              ) : (
              <>
              <ChartFigure title="Payment Compliance" summary={`${invoiceCount} invoices: ${complianceData.map(d => `${d.name} ${d.value}`).join(", ")}.`}>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie key="compliance-pie" data={complianceData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                      dataKey="value" stroke="none" paddingAngle={4}>
                      {complianceData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip key="compliance-tooltip" formatter={(val: number, name: string) => [`${val} invoice${val > 1 ? "s" : ""}`, name]}
                      contentStyle={{ fontFamily: F.ui, fontSize: 13, borderRadius: 9, border: `1px solid ${T.borderDef}` }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartFigure>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", padding: "0 18px", marginTop: 4 }}>
                {complianceData.map(d => {
                  const pct = invoiceCount > 0 ? Math.round((d.value / invoiceCount) * 100) : 0;
                  return (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 11, height: 11, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, flex: 1 }}>{d.name}</span>
                      <div style={{ flex: 2, height: 6, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: d.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 700, width: 34, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
              </>
              )}
            </div>
          </div>

          {/* Chart 3 — Top Weaver Making Distribution */}
          <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(110,15,45,0.08)", border: T.borderDef, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users size={22} color={T.royalBurgundy} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Top Weaver Earnings</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Highest-paid weavers · May 2026</div>
                </div>
              </div>
            </div>
            {/* Weaver list */}
            <div style={{ flex: 1, padding: "20px 22px" }}>
              {(weaversLoading || weaverPaymentsLoading) ? (
                <LoadingState variant="skeleton" rows={3} />
              ) : (weaversError || weaverPaymentsError) ? (
                <ErrorState error={undefined} onRetry={() => { void refetchWeavers(); void refetchWeaverPayments(); }} />
              ) : weaverDistData.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  No weaver payments recorded yet.
                </div>
              ) : null}
              {!weaversLoading && !weaverPaymentsLoading && !weaversError && !weaverPaymentsError && weaverDistData.map((d, i) => (
                <div key={d.name} style={{ marginBottom: i < weaverDistData.length - 1 ? 18 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: d.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.18)" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFDF9" }}>{d.name.split(" ").map((w: string) => w[0]).join("").slice(0,2)}</span>
                      </div>
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(d.amount)} /></span>
                  </div>
                  <div style={{ height: 7, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${d.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: i * 0.1, ease: EASE }}
                      style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${d.color},${d.color}88)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </SectionCard>
      </FadeUp>
    </div>
  );
}
