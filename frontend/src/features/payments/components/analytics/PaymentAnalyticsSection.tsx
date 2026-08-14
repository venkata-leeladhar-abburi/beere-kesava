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
  const { data: weaversRes } = useQuery({
    queryKey: ["analytics-weavers-roster"],
    queryFn: () => weaversApi.list(),
  });
  const { data: weaverPaymentsRes } = useQuery({
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
  const { data: invoicesRes } = useQuery({
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
            <motion.div
              key={m.label}
              whileHover={{ y: -5, boxShadow: m.hi ? "0 8px 24px rgba(200,155,71,0.18)" : "0 8px 20px rgba(74,6,27,0.10)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                display: "flex", flexDirection: "column", gap: 10,
                background: m.hi ? `linear-gradient(145deg, ${T.warmCream}, #FDF6E4)` : T.warmIvory,
                borderRadius: 18,
                border: m.hi ? `1.5px solid ${T.borderGold}` : `1.5px solid ${T.borderDef}`,
                borderTop: m.hi ? `3px solid ${T.antiqueGold}` : `1.5px solid ${T.borderDef}`,
                boxShadow: m.hi ? "0 4px 20px rgba(200,155,71,0.12)" : "0 2px 12px rgba(74,6,27,0.06)",
                padding: "20px",
              }}
            >
              {/* Icon box */}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: m.iconBg, border: `1px solid ${m.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.icon}
              </div>
              {/* Label */}
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.taupe, lineHeight: 1.4 }}>{m.label}</div>
              {/* Value */}
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: m.color, lineHeight: 1.1 }}>
                <AnimCount raw={m.value} />
              </div>
              {/* Sub */}
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: "auto" }}>{m.sub}</div>
            </motion.div>
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
              {complianceData.length === 0 ? (
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
              {weaverDistData.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  No weaver payments recorded yet.
                </div>
              )}
              {weaverDistData.map((d, i) => (
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
