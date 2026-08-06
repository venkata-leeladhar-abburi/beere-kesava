import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { T, F, G, NUM } from '../theme';
import { AnimatedNumber, Card, SectionHeader, Donut, BarChart } from '../ui';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import { Button } from '../../../../../shared/ui/primitives';

export function ProductionProgress() {
  const { qcPassRate, paymentsCollectedPct, isLoading } = useDashboardAnalytics();

  // "Inventory" has no backend source — raw-material stock tracking is not
  // implemented (same documented gap as the Materials feature). Left as a
  // fixed placeholder rather than inventing a number.
  const progBars = [
    { label: "Production (QC Pass)", pct: isLoading ? 0 : qcPassRate, color: "#6B1A2A" },
    { label: "Inventory", pct: 0, color: "#845E04" },
    { label: "Payments Collected", pct: isLoading ? 0 : paymentsCollectedPct, color: "#A0506A" },
  ];

  return (
    <Card style={{ flex: "0 0 26%", display: "flex", flexDirection: "column", padding: "32px" }}>
      <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, marginBottom: 4, letterSpacing: "-0.1px", lineHeight: 1.15 }}>
        Production Progress
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 16, letterSpacing: "0.1px" }}>
        Real-time weaving & supply
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200, margin: "10px 0 20px" }}>
        <Donut pct={isLoading ? 0 : qcPassRate} />
      </div>

      <div style={{ display: "flex", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20, marginTop: "auto" }}>
        {progBars.map((b, i) => (
          <div key={b.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
              {b.label}
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: b.color, ...NUM }}>
              {b.pct}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SareesProduced({ compact }: { compact?: boolean }) {
  const [period, setPeriod] = useState("Month");
  const { totalSareesProduced, activeBatchesCount, weaversWorkingCount, isLoading } = useDashboardAnalytics();
  return (
    <Card style={{ flex: compact ? undefined : "0 0 44%", display: "flex", flexDirection: "column", padding: compact ? "24px 24px 0" : "32px 32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 18 : 20, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>
          Sarees Produced
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["Week", "Month", "Quarter"].map(p => (
            <motion.div key={p} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ borderRadius: 999 }}>
              <Button
                onClick={() => setPeriod(p)}
                variant="tertiary"
                className={`!py-[5px] !px-[11px] !rounded-full !border-none !text-xs !font-medium !tracking-[0.1px] ${
                  period === p
                    ? "!bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] !text-[#F5E8D0] hover:!bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:!text-[#F5E8D0]"
                    : "!bg-[rgba(110,15,45,0.06)] !text-[#69635E] hover:!bg-[rgba(110,15,45,0.10)] hover:!text-[#69635E]"
                }`}
              >
                {p}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 48 : 60, color: T.luxuryBrown, lineHeight: 1.0, ...NUM }}>
          <AnimatedNumber raw={String(isLoading ? 0 : totalSareesProduced)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <TrendingUp size={12} color={T.green} />
          {/* Period-over-period trend requires a time-series endpoint that
              doesn't exist yet (same gap as the weekly bar chart below). */}
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, letterSpacing: "0.1px" }}>Total to date</span>
        </div>
      </div>
      {/* BarChart shows a fixed illustrative weekly produced-vs-dispatched
          split — there is no backend endpoint for per-week production/
          dispatch time-series (documented gap, consistent with the rest of
          this sweep having no monthly cash-flow time-series either). */}
      <div style={{ flex: 1, minHeight: 130 }}><BarChart /></div>
      <div style={{ display: "flex", gap: 22, paddingBottom: 14 }}>
        {[{ dot: T.royalBurgundy, label: "Produced" }, { dot: T.antiqueGold, label: "Dispatched" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot, flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe }}>{l.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20, paddingBottom: 28 }}>
        {[
          { num: String(isLoading ? 0 : activeBatchesCount), label: "Active Batches" },
          { num: String(isLoading ? 0 : weaversWorkingCount), label: "Weavers Working" },
          { num: "—", label: "In Stock" }, // no raw-material/finished-stock backend — documented gap
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 38, color: T.luxuryBrown, lineHeight: 1.1, ...NUM }}>
              <AnimatedNumber raw={s.num} />
            </div>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, marginTop: 3, letterSpacing: "0.1px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FeaturedProduct({ compact }: { compact?: boolean }) {
  const { weaversWorkingCount, designCodesCount, qcPassRate, overdueInvoicesCount, isLoading } = useDashboardAnalytics();
  const v = (n: number) => (isLoading ? "—" : String(n));
  return (
    <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Weavers", val: `${v(weaversWorkingCount)} active`, vc: T.luxuryBrown, rb: true, bb: true },
          { label: "Saree Codes", val: `${v(designCodesCount)} codes`, vc: T.luxuryBrown, rb: false, bb: true },
          { label: "QC Pass", val: `${v(qcPassRate)}%`, vc: T.green, rb: true, bb: true },
          { label: "Overdue", val: `${v(overdueInvoicesCount)} invoices`, vc: "#C0392B", rb: false, bb: true, alert: overdueInvoicesCount > 0 },
          { label: "Inventory", val: "No data", vc: T.taupe, rb: true, bb: false }, // no raw-material stock backend
          { label: "Dispatch", val: "No data", vc: T.taupe, rb: false, bb: false }, // no per-day dispatch tracking backend
        ].map((s, idx) => (
          <div key={s.label} style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: compact ? "16px 20px" : "24px 32px",
            borderRight: s.rb ? `1px solid ${T.borderDef}` : "none",
            borderBottom: s.bb ? `1px solid ${T.borderDef}` : "none",
            background: idx % 2 === 0 ? "transparent" : "rgba(110,15,45,0.01)"
          }}>
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: compact ? 10 : 11, color: T.taupe, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1.5px" }}>{s.label}</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 20 : 24, color: s.vc, lineHeight: 1.1, ...NUM, display: "flex", alignItems: "center", gap: 6 }}>
              {(s as any).alert && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C0392B", flexShrink: 0, display: "inline-block" }} />}
              {s.val}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ThreeCol({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section style={{ padding: "56px 48px 36px", background: T.silkCream }}>
      <SectionHeader title="Performance Overview" actionText="Full Analytics →" onAction={() => onNavigate("Reports")} />
      <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
        <ProductionProgress />
        <SareesProduced />
        <FeaturedProduct />
      </div>
    </section>
  );
}
