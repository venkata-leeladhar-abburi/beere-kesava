import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChartBar, FunnelSimple, Trophy, ShoppingBag, DownloadSimple,
} from "@phosphor-icons/react";
import { T, F } from "../theme";
import { WEEKLY_DATA, STAGE_FUNNEL, TOP_WEAVERS_CHART, ORDER_PROGRESS, ANALYTICS_PERIODS } from "../data";
import { FadeUp, Pip, ProductionDialog } from "../common/primitives";

const CARD_STYLE: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 18,
  border: `1.5px solid ${T.borderDef}`,
  padding: "24px 26px",
  boxShadow: "0 4px 18px rgba(74,6,27,0.07)",
  display: "flex",
  flexDirection: "column",
};

function ChartCardHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 3 }}>{title}</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.4 }}>{sub}</div>
      </div>
    </div>
  );
}

export function ProductionAnalyticsSection() {
  const [period, setPeriod] = useState("This Month");
  const maxWeekly = Math.max(...WEEKLY_DATA.map(d => d.produced));
  const maxWeaverSarees = TOP_WEAVERS_CHART[0]?.sarees ?? 1;
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("PDF");
  const [exportIncludes, setExportIncludes] = useState<Record<string, boolean>>({
    "Weekly Production": true,
    "Stage Pipeline": true,
    "Top Weavers": true,
    "Design-wise Breakdown": true,
    "Bulk Order Progress": false,
  });

  return (
    <div id="prod-analytics" style={{ padding: "32px 40px 0" }}>
      <FadeUp>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, letterSpacing: "-0.2px" }}>Production Analytics</h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 0 16px", lineHeight: 1.6 }}>
              Charts and numbers showing how production is going this month — weekly output, stage pipeline, top weavers, designs, and bulk orders.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginTop: 4 }}>
            {ANALYTICS_PERIODS.map(p => (
              <motion.button key={p} onClick={() => setPeriod(p)} whileHover={{ scale: 1.02 }}
                style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: period === p ? T.royalBurgundy : "transparent", color: period === p ? "#FFFDF9" : T.taupe, border: period === p ? "none" : `1px solid rgba(110,15,45,0.18)`, transition: "all 0.18s" }}>
                {p}
              </motion.button>
            ))}
            <motion.button onClick={() => setShowExportDialog(true)} whileHover={{ scale: 1.02, backgroundColor: "rgba(200,155,71,0.20)" }} style={{ display: "flex", alignItems: "center", gap: 7, background: T.warmCream, border: `1.5px solid ${T.borderGold}`, borderRadius: 10, padding: "8px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer" }}>
              <DownloadSimple size={16} color={T.antiqueGold} weight="bold" /> Export Report
            </motion.button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20, alignItems: "stretch" }}>

          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<ChartBar size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Sarees Produced Each Week"
              sub="Produced vs dispatched — this month"
            />

            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flex: 1, minHeight: 180 }}>
              {WEEKLY_DATA.map(d => (
                <div key={d.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{d.produced}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>/{d.dispatched}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130, width: "100%", justifyContent: "center" }}>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(d.produced / maxWeekly) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ width: 22, background: `linear-gradient(180deg, ${T.royalBurgundy} 0%, #9A1A40 100%)`, borderRadius: "5px 5px 0 0", minHeight: 6 }}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(d.dispatched / maxWeekly) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ width: 22, background: `linear-gradient(180deg, ${T.antiqueGold} 0%, #B88730 100%)`, borderRadius: "5px 5px 0 0", minHeight: 6, opacity: 0.9 }}
                    />
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe }}>{d.week}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 20, marginTop: 16, justifyContent: "center" }}>
              {[{ color: T.royalBurgundy, label: "Produced" }, { color: T.antiqueGold, label: "Dispatched" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<FunnelSimple size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Where Are All Batches Right Now"
              sub="All 24 active batches by production stage"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "center" }}>
              {STAGE_FUNNEL.map((s, i) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{s.label}</span>
                    <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: s.color, minWidth: 32, textAlign: "right" }}>{s.count}</span>
                  </div>
                  <div style={{ height: 14, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.widthPct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ height: "100%", background: s.color, borderRadius: 99 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, background: T.warmCream, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>Total active batches</span>
              <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>24</span>
            </div>
          </div>

          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<Trophy size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Top 5 Weavers This Month"
              sub="Ranked by number of sarees produced"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
              {TOP_WEAVERS_CHART.map((w, i) => (
                <div key={w.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? "rgba(200,155,71,0.18)" : "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: i === 0 ? T.antiqueGold : T.taupe }}>{i + 1}</span>
                  </div>
                  <Pip initials={w.initials} bg={w.bg} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 700, marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                    <div style={{ height: 9, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(w.sarees / maxWeaverSarees) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ height: "100%", background: `linear-gradient(90deg,${T.royalBurgundy},#A04060)`, borderRadius: 99 }}
                      />
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{w.sarees}</span>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>sarees</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, alignItems: "stretch" }}>

          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<ShoppingBag size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Bulk Order Production Progress"
              sub="Sarees produced so far for each wholesale order"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
              {ORDER_PROGRESS.map(o => {
                const pct = Math.round((o.done / o.total) * 100);
                const color = pct > 80 ? T.green : pct >= 50 ? "#C4923A" : T.crimson;
                return (
                  <div key={o.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 700 }}>{o.name}</span>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{o.done}/{o.total}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color, minWidth: 42, textAlign: "right" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 12, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ height: "100%", background: color, borderRadius: 99 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showExportDialog && (
            <ProductionDialog open title="Export Production Report" onClose={() => setShowExportDialog(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ background: T.warmCream, borderRadius: 11, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <ChartBar size={18} color={T.royalBurgundy} weight="duotone" />
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Reporting Period</div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{period}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Include in Report</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(exportIncludes).map(([key, checked]) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: checked ? "rgba(110,15,45,0.05)" : "transparent", border: `1px solid ${checked ? "rgba(110,15,45,0.18)" : T.borderDef}`, transition: "all 0.15s" }}>
                        <input type="checkbox" checked={checked} onChange={() => setExportIncludes(prev => ({ ...prev, [key]: !prev[key] }))}
                          style={{ width: 16, height: 16, accentColor: T.royalBurgundy, cursor: "pointer" }} />
                        <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? T.luxuryBrown : T.taupe }}>{key}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                      <motion.button key={fmt} onClick={() => setExportFormat(fmt)} whileHover={{ scale: 1.03 }}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: exportFormat === fmt ? "none" : `1.5px solid ${T.borderDef}`, background: exportFormat === fmt ? T.royalBurgundy : "transparent", color: exportFormat === fmt ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
                        {fmt}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowExportDialog(false)}
                    style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${T.antiqueGold} 0%, #B88730 100%)`, color: T.deepWine, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(200,155,71,0.28)" }}>
                    <DownloadSimple size={18} weight="bold" /> Generate &amp; Download
                  </motion.button>
                  <motion.button onClick={() => setShowExportDialog(false)} whileHover={{ scale: 1.02 }}
                    style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                    Cancel
                  </motion.button>
                </div>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>

      </FadeUp>
    </div>
  );
}
