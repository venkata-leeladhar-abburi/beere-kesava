import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { T, F, G, NUM } from '../theme';
import { AnimatedNumber, Card, SectionHeader, Donut, BarChart } from '../ui';

const PROG_BARS = [
  { label: "Production", pct: 72, color: "#6B1A2A" },
  { label: "Inventory", pct: 84, color: "#845E04" },
  { label: "Payments", pct: 46, color: "#A0506A" },
];

export function ProductionProgress() {
  return (
    <Card style={{ flex: "0 0 26%", display: "flex", flexDirection: "column", padding: "32px" }}>
      <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, marginBottom: 4, letterSpacing: "-0.1px", lineHeight: 1.15 }}>
        Production Progress
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 16, letterSpacing: "0.1px" }}>
        Real-time weaving & supply
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200, margin: "10px 0 20px" }}>
        <Donut />
      </div>

      <div style={{ display: "flex", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20, marginTop: "auto" }}>
        {PROG_BARS.map((b, i) => (
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
  return (
    <Card style={{ flex: compact ? undefined : "0 0 44%", display: "flex", flexDirection: "column", padding: compact ? "24px 24px 0" : "32px 32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 18 : 20, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>
          Sarees Produced
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["Week", "Month", "Quarter"].map(p => (
            <motion.button
              key={p}
              onClick={() => setPeriod(p)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ padding: "5px 11px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 12, letterSpacing: "0.1px", background: period === p ? G.button : "rgba(110,15,45,0.06)", color: period === p ? T.warmCream : T.taupe, transition: "all 0.18s" }}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 48 : 60, color: T.luxuryBrown, lineHeight: 1.0, ...NUM }}>
          <AnimatedNumber raw="248" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <TrendingUp size={12} color={T.green} />
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.green, letterSpacing: "0.1px" }}>14% from last month</span>
        </div>
      </div>
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
        {[{ num: "7", label: "Active Batches" }, { num: "6", label: "Weavers Working" }, { num: "84", label: "In Stock" }].map((s, i) => (
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
  return (
    <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Weavers", val: "6 active", vc: T.luxuryBrown, rb: true, bb: true },
          { label: "Saree Codes", val: "24 codes", vc: T.luxuryBrown, rb: false, bb: true },
          { label: "QC Pass", val: "96%", vc: T.green, rb: true, bb: true },
          { label: "Overdue", val: "2 invoices", vc: "#C0392B", rb: false, bb: true, alert: true },
          { label: "Inventory", val: "1,240 pcs", vc: T.luxuryBrown, rb: true, bb: false },
          { label: "Dispatch", val: "18 today", vc: T.antiqueGold, rb: false, bb: false },
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
