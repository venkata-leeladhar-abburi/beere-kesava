import React, { useContext, useState } from "react";
import { motion } from "motion/react";
import { PieChart, Pie, Cell } from "recharts";
import { Layers, Tag, Sparkles, Calculator, Users, IndianRupee, Download } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { T, F, EASE, MobileCtx } from "../theme";
import { VENDOR_DATA, MONTHLY_DATA, SPEND_DATA, MAT_TAG } from "../data";
import { SectionHeader, FadeUp, AnimatedBar } from "../common/primitives";

export function PurchaseHistorySection({ onDownloadReport }: { onDownloadReport: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  return (
    <section id="mat-purchase-history" style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader
        title="Purchase History From All Vendors"
        action="Download Report"
        actionIcon={<Download size={15} />}
        onAction={onDownloadReport}
        actionVariant="gold"
      />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: T.taupe, margin: "0 0 16px", lineHeight: 1.6 }}>
        This shows everything that was ever purchased and received — from the day this system was started until today. You can also filter by a specific date range.
      </p>

      <FadeUp>
        <div style={{ marginBottom: 24 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, 1fr)", gap: isMobile ? 12 : 18, marginBottom: 26, alignItems: "stretch" }}>
        {[
          { Icon: Layers,      label: "Total Warp Purchased",   amount: "2,840 kg", cost: "₹14,20,000", sub: "From 4 vendors", dark: false },
          { Icon: Tag,         label: "Total Resham Purchased", amount: "1,240 kg", cost: "₹18,60,000", sub: "From 3 vendors", dark: false },
          { Icon: Sparkles,    label: "Total Jari Purchased",   amount: "680 Reels", cost: "₹24,48,000", sub: "From 2 vendors", dark: false },
          { Icon: Calculator,  label: "Average Order Value",    amount: "₹1,24,000", cost: "", sub: "Average value per PO", dark: false },
          { Icon: Users,       label: "Active Vendors",         amount: "8 Vendors", cost: "", sub: "Vendors with history", dark: false },
          { Icon: IndianRupee, label: "TOTAL AMOUNT SPENT",     amount: "₹57,28,000", cost: "", sub: "Total raw materials", dark: true },
        ].map((card, i) => (
          <FadeUp key={card.label} delay={i * 0.09} style={{ height: "100%" }}>
            <div style={{ background: card.dark ? T.darkBurgundy : "#FFFFFF", borderRadius: 16, border: `1px solid ${card.dark ? "transparent" : T.borderDef}`, padding: "22px 22px 20px", boxShadow: card.dark ? "0 8px 32px rgba(61,14,26,0.30)" : "0 2px 12px rgba(74,6,27,0.06)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
              {card.dark && <>
                <div style={{ position: "absolute", top: "-30%", right: "-10%", width: 140, height: 140, borderRadius: "50%", background: "rgba(200,155,71,0.07)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 100, height: 100, borderRadius: "50%", background: "rgba(200,155,71,0.05)", pointerEvents: "none" }} />
              </>}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: card.dark ? "rgba(200,155,71,0.12)" : "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <card.Icon size={19} color={card.dark ? T.antiqueGold : T.royalBurgundy} />
                </div>
                <span style={{ fontFamily: card.dark ? F.mono : F.ui, fontWeight: 600, fontSize: card.dark ? 10 : 13, color: card.dark ? "rgba(200,155,71,0.85)" : T.taupe, letterSpacing: card.dark ? "2px" : 0, textTransform: card.dark ? "uppercase" : "none", lineHeight: 1.3 }}>{card.label}</span>
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: card.dark ? 32 : 28, color: card.dark ? T.goldLight : T.luxuryBrown, lineHeight: 1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{card.amount}</div>
              {card.cost && <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 16, color: T.antiqueGold, marginBottom: 8 }}>{card.cost}</div>}
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: card.dark ? "rgba(255,253,249,0.55)" : T.taupe, lineHeight: 1.5, marginTop: "auto" }}>{card.sub}</div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 16px rgba(74,6,27,0.06)", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "22px 26px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>How Much Was Bought From Each Vendor</div>
            <div style={{ fontFamily: F.ui, fontSize: 14.5, color: T.taupe, lineHeight: 1.55 }}>Each vendor listed separately — what material they supplied, how much, and what it cost in total.</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: T.silkCream }}>
                  {["Vendor Name", "Material Supplied", "Total Purchased", "Total Paid", "Orders", "Last Purchase"].map(h => (
                    <th key={h} style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", padding: "14px 18px", textAlign: "left", borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VENDOR_DATA.map((v, i) => (
                  <motion.tr
                    key={v.name}
                    initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.05, ease: EASE }}
                    style={{ background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory }}
                  >
                    <td style={{ padding: "15px 18px", fontFamily: F.ui, fontWeight: 700, fontSize: 14.5, color: T.luxuryBrown, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.name}</td>
                    <td style={{ padding: "15px 18px", borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                        {v.materials.map(m => {
                          const mt = MAT_TAG[m.type as keyof typeof MAT_TAG] || MAT_TAG.Warp;
                          return <span key={m.label} style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 500, color: mt.col, background: mt.bg, padding: "4px 11px", borderRadius: 7, letterSpacing: "1.2px", whiteSpace: "nowrap" }}>{m.label}</span>;
                        })}
                      </div>
                    </td>
                    <td style={{ padding: "15px 18px", fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                        {v.totals.map((t, idx) => <div key={idx}>{t}</div>)}
                      </div>
                    </td>
                    <td style={{ padding: "15px 18px", fontFamily: F.mono, fontWeight: 700, fontSize: 14.5, color: T.antiqueGold, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.paid}</td>
                    <td style={{ padding: "15px 18px", fontFamily: F.ui, fontSize: 14.5, color: T.taupe, textAlign: "center", borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.orders}</td>
                    <td style={{ padding: "15px 18px", fontFamily: F.mono, fontSize: 13, color: T.taupe, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.last}</td>
                  </motion.tr>
                ))}
                <tr style={{ background: T.warmCream }}>
                  <td colSpan={3} style={{ padding: "16px 18px", fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: T.taupe }}>Grand Total across all vendors:</td>
                  <td colSpan={3} style={{ padding: "16px 18px", fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.antiqueGold, textAlign: "right" }}>₹57,28,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 22 }}>
        <FadeUp>
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "24px 26px 22px", boxShadow: "0 2px 16px rgba(74,6,27,0.06)", height: "100%" }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>How Much Was Purchased Each Month</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 22, lineHeight: 1.5 }}>Last 6 months — Warp, Resham, and Jari compared side by side</div>
            {(() => {
              const maxVal = Math.max(...MONTHLY_DATA.flatMap(d => [d.Warp, d.Resham, d.Jari]));
              return (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200, paddingBottom: 4 }}>
                  {MONTHLY_DATA.map(d => (
                    <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 164, width: "100%", justifyContent: "center" }}>
                        <motion.div initial={{ height: 0 }} whileInView={{ height: `${(d.Warp / maxVal) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }} style={{ width: 12, background: T.royalBurgundy, borderRadius: "4px 4px 0 0", minHeight: 2 }} />
                        <motion.div initial={{ height: 0 }} whileInView={{ height: `${(d.Resham / maxVal) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }} style={{ width: 12, background: T.antiqueGold, borderRadius: "4px 4px 0 0", minHeight: 2 }} />
                        <motion.div initial={{ height: 0 }} whileInView={{ height: `${(d.Jari / maxVal) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.16, ease: EASE }} style={{ width: 12, background: T.luxuryBrown, borderRadius: "4px 4px 0 0", minHeight: 2 }} />
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, letterSpacing: "0.5px" }}>{d.month}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
              {[["Warp", T.royalBurgundy], ["Resham", T.antiqueGold], ["Jari", T.luxuryBrown]].map(([name, color]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "24px 26px 22px", boxShadow: "0 2px 16px rgba(74,6,27,0.06)", height: "100%" }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>Total Spend Split</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 22, lineHeight: 1.5 }}>How much of your total spend goes to each material type</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flexShrink: 0 }}>
                <PieChart width={160} height={160}>
                  <Pie data={SPEND_DATA} cx={80} cy={80} innerRadius={48} outerRadius={72} dataKey="pct" paddingAngle={3}>
                    {SPEND_DATA.map((entry) => <Cell key={`spend-cell-${entry.name}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {SPEND_DATA.map(s => (
                  <div key={s.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: T.luxuryBrown, flex: 1 }}>{s.name}</span>
                      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: s.color }}>{s.pct}%</span>
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 13.5, color: T.antiqueGold, paddingLeft: 22 }}>{s.value}</div>
                    <AnimatedBar pct={s.pct} color={s.color} height={5} trackBg="rgba(110,15,45,0.07)" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
