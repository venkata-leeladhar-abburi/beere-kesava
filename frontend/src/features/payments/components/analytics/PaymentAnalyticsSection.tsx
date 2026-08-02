import React, { useState } from "react";
import { CheckCircle2, CircleAlert, Download, IndianRupee, Scissors, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { CASH_FLOW_DATA, COMPLIANCE_DATA, TOTAL_TOP5, WEAVER_DIST_DATA } from "../../data/analytics";
import { INVOICES } from "../../data/invoices";
import { EASE, F, T } from "../../theme";
import { Invoice } from "../../types";
import { AnimCount, FadeUp } from "../common/motion";
import { CashFlowTooltip } from "./CashFlowTooltip";

export function PaymentAnalyticsSection() {
  const [exportModal, setExportModal] = useState(false);
  const METRICS = [
    {
      icon: <TrendingUp size={22} color={T.green} />,
      iconBg: T.greenBg,
      iconBorder: "rgba(30,102,64,0.18)",
      label: "Net Income This Month",
      value: "₹19,80,000",
      sub: "After all deductions · May 2026",
      color: T.green,
      hi: false,
    },
    {
      icon: <CircleAlert size={22} color={T.crimson} />,
      iconBg: T.crimsonBg,
      iconBorder: "rgba(192,57,43,0.18)",
      label: "Outstanding from Customers",
      value: "₹18,41,000",
      sub: "Pending invoice collections",
      color: T.crimson,
      hi: false,
    },
    {
      icon: <Scissors size={22} color={T.royalBurgundy} />,
      iconBg: "rgba(110,15,45,0.08)",
      iconBorder: T.borderDef,
      label: "Paid to Top 5 Weavers",
      value: `₹${TOTAL_TOP5.toLocaleString("en-IN")}`,
      sub: "Making charges · May 2026",
      color: T.royalBurgundy,
      hi: false,
    },
    {
      icon: <IndianRupee size={22} color={T.antiqueGold} />,
      iconBg: "rgba(200,155,71,0.12)",
      iconBorder: T.borderGold,
      label: "Total Vendor Payments",
      value: "₹8,60,000",
      sub: "Raw materials & supplies",
      color: T.antiqueGold,
      hi: true,
    },
  ];

  return (
    <div id="pay-analytics" style={{ padding: "36px 40px 40px" }}>
      <FadeUp>
        {/* ── Section header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99, flexShrink: 0 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Payment Analytics &amp; Insights
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Visual breakdown of cash flow, customer compliance, and top weaver earnings.
            </p>
          </div>
          <DownloadGate>
            <button
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
                background: "linear-gradient(135deg, rgba(200,155,71,0.15), rgba(200,155,71,0.05))",
                border: `1.5px solid ${T.borderGold}`, borderRadius: 10, cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(200,155,71,0.22), rgba(200,155,71,0.08))"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(200,155,71,0.15), rgba(200,155,71,0.05))"; }}
            >
              <Download size={15} color={T.antiqueGold} />
              <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.antiqueGold }}>Export Report</span>
            </button>
          </DownloadGate>
        </div>

        {/* ── 4 summary stat cards ───────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18, marginBottom: 24, alignItems: "stretch" }}>
          {METRICS.map((m, i) => (
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
              <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 800, color: m.color, lineHeight: 1.1 }}>
                <AnimCount raw={m.value} />
              </div>
              {/* Sub */}
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: "auto" }}>{m.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── 3-column chart grid ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, alignItems: "stretch" }}>

          {/* Chart 1 — Cash Flow Overview */}
          <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: T.greenBg, border: "1px solid rgba(30,102,64,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TrendingUp size={22} color={T.green} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>Cash Flow Overview</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Income vs. expenses · ₹ Lakhs</div>
                </div>
              </div>
            </div>
            {/* Chart body */}
            <div style={{ flex: 1, padding: "18px 10px 14px" }}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={CASH_FLOW_DATA} barGap={4} barCategoryGap="28%">
                  <CartesianGrid key="cf-grid"     strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                  <XAxis         key="cf-xaxis"    dataKey="month" tick={{ fontFamily: F.mono, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis         key="cf-yaxis"    tick={{ fontFamily: F.mono, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v}L`} width={46} />
                  <Tooltip       key="cf-tooltip"  content={<CashFlowTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
                  <Bar           key="cf-income"   dataKey="income"   name="Income"   fill={T.green}  radius={[5,5,0,0] as any} />
                  <Bar           key="cf-expenses" dataKey="expenses" name="Expenses" fill={T.crimson} radius={[5,5,0,0] as any} opacity={0.80} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
                {[{ color: T.green, label: "Income" }, { color: T.crimson, label: "Expenses" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 4, background: l.color }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{l.label}</span>
                  </div>
                ))}
              </div>
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
                  <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>Payment Compliance</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Invoice status breakdown · May 2026</div>
                </div>
              </div>
            </div>
            {/* Chart body */}
            <div style={{ flex: 1, padding: "18px 10px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie key="compliance-pie" data={COMPLIANCE_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    dataKey="value" stroke="none" paddingAngle={4}>
                    {COMPLIANCE_DATA.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip key="compliance-tooltip" formatter={(val: any, name: any) => [`${val} invoice${val > 1 ? "s" : ""}`, name]}
                    contentStyle={{ fontFamily: F.ui, fontSize: 13, borderRadius: 9, border: `1px solid ${T.borderDef}` }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", padding: "0 18px", marginTop: 4 }}>
                {COMPLIANCE_DATA.map(d => {
                  const pct = Math.round((d.value / INVOICES.length) * 100);
                  return (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 11, height: 11, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, flex: 1 }}>{d.name}</span>
                      <div style={{ flex: 2, height: 6, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: d.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 700, width: 34, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
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
                  <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>Top Weaver Earnings</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Highest-paid weavers · May 2026</div>
                </div>
              </div>
            </div>
            {/* Weaver list */}
            <div style={{ flex: 1, padding: "20px 22px" }}>
              {WEAVER_DIST_DATA.map((d, i) => (
                <div key={d.name} style={{ marginBottom: i < WEAVER_DIST_DATA.length - 1 ? 18 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: d.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.18)" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9" }}>{d.name.split(" ").map((w: string) => w[0]).join("").slice(0,2)}</span>
                      </div>
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>₹{d.amount.toLocaleString("en-IN")}</span>
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
      </FadeUp>
    </div>
  );
}
