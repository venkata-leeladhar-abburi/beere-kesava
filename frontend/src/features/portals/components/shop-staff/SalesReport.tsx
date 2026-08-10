import { XAxis, YAxis, Tooltip, Cell } from "recharts";
import { SectionNavigator, PAGE_SECTIONS } from "../../../../shared/ui/SectionNavigator";
const SHOP_MOBILE_HEADER_H = 60;
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { SectionTitle } from "./theme";
import { FileText, Check } from "lucide-react";
import { semantic } from "../../../../design-system/tokens";


import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Modal } from "../../../../shared/ui/overlay";
import {
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown
} from 'lucide-react';

import { C, F, TEAL, Card, Btn, Chip, useCanSeePrices } from './theme';
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../shared/api/sales";
import { customersApi } from "../../../../shared/api/customers";
import { ChartFigure } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

function dateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function SalesReport() {
  const canSeePrices = useCanSeePrices();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "3months">("today");
  const periods = [{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "3months", label: "Last 3 Months" }] as const;

  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [exportDone, setExportDone] = useState(false);

  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-report"],
    queryFn: () => salesApi.list(100),
  });

  const { data: returnsRes } = useQuery({
    queryKey: ["returns-list-report"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: customersRes } = useQuery({
    queryKey: ["customers-list-report"],
    queryFn: () => customersApi.list(100),
  });

  const salesList = salesRes?.items ?? [];
  const returnsList = returnsRes?.items ?? [];
  const customerMap = new Map((customersRes?.items ?? []).map(c => [c.id, c.name]));

  const dailySales = salesList.map(s => ({
    time: timeLabel(s.saleDate),
    id: s.sareeId,
    design: s.channel === "WHOLESALE" ? "Wholesale" : "Retail",
    customer: s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Walk-in Customer",
    pay: "Counter",
    amt: formatMoney(rupees(Number(s.amount))),
    src: "factory",
  }));

  const totalToday = salesList.reduce((sum, s) => sum + Number(s.amount), 0);
  const fmtINR = (n: number) => formatMoney(rupees(n));

  const designData = [
    { design: "Retail Sales", count: salesList.filter(s => s.channel === "RETAIL").length },
    { design: "Wholesale Sales", count: salesList.filter(s => s.channel === "WHOLESALE").length },
    { design: "Returns", count: returnsList.length },
  ];

  const currentMonth = new Date().getMonth();
  const totalMonthSales = salesList.filter(s => new Date(s.saleDate).getMonth() === currentMonth);
  const totalMonthReturns = returnsList.filter(r => new Date(r.returnDate).getMonth() === currentMonth);
  const monthRevenue = totalMonthSales.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const avgSale = totalMonthSales.length > 0 ? Math.round(monthRevenue / totalMonthSales.length) : 0;
  const monthReturnsAmount = totalMonthReturns.reduce((acc, curr) => acc + Number(curr.refundAmount || 0), 0);

  const designMap = new Map<string, number>();
  totalMonthSales.forEach(s => {
      designMap.set(s.sareeId, (designMap.get(s.sareeId) || 0) + 1);
  });
  let topDesign = "None";
  let maxCount = 0;
  designMap.forEach((count, id) => {
      if (count > maxCount) { maxCount = count; topDesign = id; }
  });

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; purchases: number; total: number }>();
    for (const s of salesList) {
      const custId = s.customerId ?? "walkin";
      const name = s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Walk-in Counter Customer";
      const existing = map.get(custId) ?? { name, purchases: 0, total: 0 };
      existing.purchases += 1;
      existing.total += Number(s.amount);
      map.set(custId, existing);
    }
    const sorted = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    if (sorted.length === 0 && customersRes?.items) {
      return customersRes.items.slice(0, 5).map(c => ({
        name: c.name,
        purchases: 0,
        amt: formatMoney(rupees(0)),
      }));
    }
    return sorted.map(c => ({
      name: c.name,
      purchases: c.purchases,
      amt: formatMoney(rupees(c.total)),
    }));
  }, [salesList, customerMap, customersRes]);

  const returns = returnsList.map(r => ({
    date: dateLabel(r.returnDate),
    id: r.sareeId,
    customer: "Returned Item",
    reason: r.reason,
    amt: r.refundAmount ? formatMoney(rupees(Number(r.refundAmount))) : formatMoney(rupees(0)),
  }));

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · SALES REPORT</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Sales Report</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold, marginBottom: 10 }}>Daily and monthly overview</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.60)", lineHeight: 1.5 }}>This report is also visible to Admin and Superadmin.</div>
      </div>

      <SectionNavigator
        sections={PAGE_SECTIONS.ShopSalesReport}
        stickyTop={SHOP_MOBILE_HEADER_H}
        activeColor={C.burg}
        mutedColor={C.muted}
        borderColor={C.bdr}
        fontFamily={F.u}
        padding="8px 16px"
        layoutId="shop-report-section-pill"
      />

      {/* Stats — stacked cards, no wrapping/truncation */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <div style={{ flex: "1 1 100%", background: C.dark, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "rgba(255,255,255,0.60)", marginBottom: 6 }}>Sarees Sold Today</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: "#FFF", lineHeight: 1 }}>{dailySales.length}</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
        {canSeePrices && (
          <>
            <div style={{ flex: "1 1 calc(50% - 5px)", background: C.gold, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: "rgba(26,10,15,0.65)", marginBottom: 6 }}>Revenue Today</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1.2 }}>{fmtINR(totalToday)}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>{dailySales.length} transactions</div>
            </div>
            <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.burg, marginBottom: 6 }}>This Month Revenue</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.burg, lineHeight: 1.2 }}>{fmtINR(monthRevenue)}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>{new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
            </div>
          </>
        )}
        <div style={{ flex: "1 1 100%", background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.crim, marginBottom: 6 }}>Returns This Month</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.crim, lineHeight: 1.1 }}>{totalMonthReturns.length} returns</div>
          </div>
          {canSeePrices && <div style={{ fontFamily: F.u, fontSize: 13, color: C.crim, opacity: 0.85 }}>{fmtINR(monthReturnsAmount)}</div>}
        </div>
      </div>

      {/* Period toggle */}
      <div style={{ padding: "16px 20px 4px", display: "flex", gap: 8 }}>
        {periods.map(p => (
          <Button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={
              "flex-1 py-2.5 h-auto rounded-full border whitespace-nowrap " +
              (period === p.id ? "border-[#6B1A2A] bg-[#6B1A2A] text-white font-semibold" : "border-[rgba(139,26,46,0.12)] bg-white text-[#69635E] font-semibold")
            }
          >{p.label}</Button>
        ))}
      </div>

      {/* Daily Sales Table */}
      <div id="shoprep-today-sales" style={{ display: "flex", alignItems: "center", margin: "20px 20px 12px", gap: 10 }}>
        <div style={{ width: 4, height: 20, background: C.burg, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, flex: 1 }}>Today's Sales — {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        <Button onClick={() => { setExportDone(false); setShowExport(true); }} size="sm" className="gap-1.5 rounded-full bg-[#6B1A2A] border-none font-semibold text-[13px] text-white shadow-[0_2px_10px_rgba(107,26,42,0.28)] shrink-0">
          <FileText size={14} color="#FFF" /> Export
        </Button>
      </div>
      <Card style={{ margin: "0 20px", overflow: "hidden", padding: 0 }}>
        {dailySales.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "16px", borderBottom: i < dailySales.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, marginBottom: 4 }}>
                <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{s.id}</span>
                <Chip label={s.src === "factory" ? "Factory" : "External"} color={s.src === "factory" ? C.green : C.gold} bg={s.src === "factory" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)"} />
              </div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{s.customer}</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 3 }}>{s.time} · {s.pay}</div>
            </div>
            {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0, textAlign: "right" as const }}>{s.amt}</div>}
          </div>
        ))}
        {/* Total row */}
        {canSeePrices && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: C.cream }}>
            <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Total (Today)</span>
            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{fmtINR(totalToday)}</span>
          </div>
        )}
      </Card>

      {/* Monthly Totals */}
      <SectionTitle id="shoprep-monthly-totals" title={`This Month — ${new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`} />
      <div style={{ margin: "0 20px", display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
        {[
          { label: "Total Sales", val: `${totalMonthSales.length} sarees` },
          ...(canSeePrices ? [
            { label: "Revenue", val: fmtINR(monthRevenue) },
            { label: "Avg per sale", val: fmtINR(avgSale) },
          ] : []),
          { label: "Returns", val: `${totalMonthReturns.length} sarees` },
          ...(canSeePrices ? [{ label: "Net Revenue", val: fmtINR(monthRevenue - monthReturnsAmount) }] : []),
          { label: "Most sold", val: topDesign },
        ].map((s, i) => (
          <Card key={i} style={{ flex: "1 1 calc(50% - 5px)", padding: "14px 16px" }}>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: i < 3 ? C.text : C.crim }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* Top Customers */}
      <SectionTitle id="shoprep-top-customers" title="Top 5 Customers This Month" />
      <Card style={{ margin: "0 20px", padding: 0, overflow: "hidden" }}>
        {topCustomers.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: i < topCustomers.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ fontFamily: F.d, fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? 26 : 21, color: i === 0 ? C.gold : C.text, width: 30, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{c.name}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>{c.purchases} purchases</div>
            </div>
            {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: C.gold, flexShrink: 0 }}>{c.amt}</div>}
          </div>
        ))}
      </Card>

      {/* Design Sales Bar Chart */}
      <SectionTitle id="shoprep-by-design" title="Sales by Design" />
      <Card style={{ margin: "0 20px", padding: "18px 12px" }}>
        <ChartFigure title="Sales by Design" summary={designData.map(d => `${d.design} ${d.count}`).join(", ") + "."}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={designData} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontFamily: F.m, fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="design" tick={{ fontFamily: F.m, fontSize: 12, fill: C.burg }} axisLine={false} tickLine={false} width={68} />
              <Tooltip
                contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 8 }}
                formatter={(v: number) => [`${v} sarees`, "Sold"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {designData.map((entry, i) => <Cell key={`cell-${entry.design}`} fill={semantic.chart.series[i % semantic.chart.series.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFigure>
      </Card>

      {/* Returns Summary */}
      <SectionTitle id="shoprep-returns" title="Returns This Month" />
      {returns.map((r, i) => (
        <div key={i} style={{ margin: "0 20px 10px", background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.crim}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 8 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
              <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.date}</span>
              <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{r.id}</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 3 }}>{r.customer} · {r.reason}</div>
          </div>
          {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 14, color: C.crim }}>{r.amt}</div>}
        </div>
      ))}

      {/* ══════ MODAL: EXPORT REPORT ══════ */}
      <Modal open={showExport} onOpenChange={o => { if (!o) { setShowExport(false); setExportDone(false); } }} size="sm">
              <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "16px 20px 24px", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(196,146,58,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={24} color={C.gold} />
                </div>
                <div style={{ flex: 1 }}>
                  <Dialog.Title asChild>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Export Report</div>
                  </Dialog.Title>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Today's Sales</div>
                </div>
                <Dialog.Close asChild>
                  <IconButton
                    icon={X}
                    label="Close"
                    variant="ghost"
                    shape="circle"
                    className="bg-white/10 text-white/70 w-9 h-9 shrink-0"
                  />
                </Dialog.Close>
              </div>
              <div style={{ padding: "22px 20px 28px", overflowY: "auto" as const }}>
                {exportDone ? (
                  <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <Check size={32} color={C.green} />
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 8 }}>Export Ready!</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 22 }}>
                      Your <strong style={{ color: C.text }}>Today's Sales</strong> report has been exported as <strong style={{ color: C.text }}>{exportFormat.toUpperCase()}</strong>. Check your downloads folder.
                    </div>
                    <Button onClick={() => { setShowExport(false); setExportDone(false); }} fullWidth className="h-[52px] rounded-full border-none bg-[#6B1A2A] font-bold text-sm text-white">Done</Button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>Export format</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {([
                          { key: "pdf" as const, label: "PDF", icon: "📄", desc: "Print-ready" },
                          { key: "csv" as const, label: "CSV", icon: "📊", desc: "Spreadsheet" },
                          { key: "excel" as const, label: "Excel", icon: "📗", desc: "Advanced" },
                        ]).map(f => (
                          <Button
                            key={f.key}
                            onClick={() => setExportFormat(f.key)}
                            variant="ghost"
                            className={
                              "flex-1 h-auto py-3.5 px-2 rounded-2xl border-2 text-center flex-col " +
                              (exportFormat === f.key ? "border-[#6B1A2A] bg-[rgba(107,26,42,0.06)]" : "border-[rgba(139,26,46,0.12)] bg-white")
                            }
                          >
                            <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
                            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: exportFormat === f.key ? C.burg : C.text, marginBottom: 2 }}>{f.label}</div>
                            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{f.desc}</div>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "#F8F4F0", borderRadius: 14, padding: "14px 16px", marginBottom: 22 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Includes</div>
                      {["Sale ID, customer name, design code", "Payment method and amount", "Timestamp and date", "Running totals and subtotals"].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                          <Check size={14} color={C.green} />
                          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                      <Button onClick={() => setExportDone(true)} fullWidth className="h-[52px] rounded-full border-none bg-[#6B1A2A] font-bold text-sm text-white gap-2 shadow-[0_4px_16px_rgba(107,26,42,0.30)]">
                        <FileText size={17} /> Export as {exportFormat.toUpperCase()}
                      </Button>
                      <Button onClick={() => { setShowExport(false); setExportDone(false); }} fullWidth className="h-[50px] rounded-full border-[1.5px] border-[rgba(139,26,46,0.12)] bg-white font-semibold text-sm text-[#69635E]">Cancel</Button>
                    </div>
                  </>
                )}
              </div>
      </Modal>
    </div>
  );
}

// ─── SHELL WRAPPER ────────────────────────────────────────────────────────────
interface ShopStaffPortalProps { onBack?: () => void }

type ShopCustomer = { name: string; phone: string; purchases: number; total: string; last: string; regular: boolean; initials: string };

export { SalesReport };
