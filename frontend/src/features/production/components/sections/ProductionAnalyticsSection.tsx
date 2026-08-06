import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChartBar, FunnelSimple, Trophy, ShoppingBag, DownloadSimple,
} from "@phosphor-icons/react";
import { T, F } from "../theme";
// WEEKLY_DATA and TOP_WEAVERS_CHART have no backend source yet — there is no
// endpoint for weekly production time-series or a per-weaver sarees-produced
// leaderboard scoped to production. They stay mock (clearly labelled below)
// until such an endpoint exists; STAGE_FUNNEL and ORDER_PROGRESS are derived
// from real batch/bulk-order data.
import { WEEKLY_DATA, TOP_WEAVERS_CHART, ANALYTICS_PERIODS } from "../data";
import { useBatches } from "../../contexts/BatchContext";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { rowComplete } from "./batches/ContextBatchCard";
import { FadeUp, Pip, ProductionDialog } from "../common/primitives";
import { Button, CheckboxField } from "../../../../shared/ui/primitives";

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

  const { batches } = useBatches();
  const { bulkOrders } = useBulkOrders();

  const STAGE_FUNNEL = useMemo(() => {
    const active = batches.filter(b => b.status === "active" || b.status === "draft");
    let weaving = 0, submitted = 0, qcPassed = 0;
    for (const b of active) {
      const completeCount = b.rows.filter(rowComplete).length;
      const qcPassedCount = b.rows.filter(r => r.qcPassed).length;
      if (qcPassedCount > 0 && qcPassedCount === b.totalCount) qcPassed++;
      else if (completeCount === b.totalCount && b.totalCount > 0) submitted++;
      else weaving++;
    }
    const inStock = batches.filter(b => b.status === "completed").length;
    const max = Math.max(weaving, submitted, qcPassed, inStock, 1);
    return [
      { label: "Weaving in Progress",       count: weaving,   color: "#845E04",   widthPct: Math.round((weaving / max) * 100) },
      { label: "Submitted — Waiting QC",    count: submitted, color: T.blueGray,  widthPct: Math.round((submitted / max) * 100) },
      { label: "Quality Check Passed",      count: qcPassed,  color: T.green,     widthPct: Math.round((qcPassed / max) * 100) },
      { label: "In Stock — Ready for Sale", count: inStock,   color: T.green,     widthPct: Math.round((inStock / max) * 100) },
    ];
  }, [batches]);
  const totalActiveBatches = batches.filter(b => b.status === "active" || b.status === "draft").length;

  const ORDER_PROGRESS = useMemo(
    () => bulkOrders.map(o => ({ name: o.customer, done: o.done, total: o.total })),
    [bulkOrders],
  );
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
              <Button key={p} onClick={() => setPeriod(p)} variant={period === p ? "primary" : "tertiary"} size="sm">
                {p}
              </Button>
            ))}
            <Button onClick={() => setShowExportDialog(true)} variant="secondary" size="sm">
              <DownloadSimple size={16} color={T.antiqueGold} weight="bold" /> Export Report
            </Button>
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
              sub={`All ${totalActiveBatches} active batch${totalActiveBatches === 1 ? "" : "es"} by production stage`}
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
              <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{totalActiveBatches}</span>
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
                      <CheckboxField key={key} label={key} checked={checked} onCheckedChange={() => setExportIncludes(prev => ({ ...prev, [key]: !prev[key] }))} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                      <Button key={fmt} onClick={() => setExportFormat(fmt)} variant={exportFormat === fmt ? "primary" : "secondary"} fullWidth>
                        {fmt}
                      </Button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    onClick={() => setShowExportDialog(false)}
                    variant="primary"
                    size="lg"
                    className="flex-[2]"
                  >
                    <DownloadSimple size={18} weight="bold" /> Generate &amp; Download
                  </Button>
                  <Button onClick={() => setShowExportDialog(false)} variant="secondary" size="lg" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>

      </FadeUp>
    </div>
  );
}
