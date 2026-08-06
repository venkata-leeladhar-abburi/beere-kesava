import React from "react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Flower2, ChevronRight } from "lucide-react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Package, Wallet, ArrowUpRight } from "lucide-react";

// ─── Shared tokens (local copy for this file) ────────────────────────────────
const C = {
  burg: "#6B1A2A", dark: "#3D0E1A", gold: "#C4923A", green: "#1E6640",
  crim: "#C0392B", text: "#1A0A0F", muted: "#69635E",
  bdr: "rgba(139,26,46,0.12)", cream: "#F0E8D0",
};
const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

// ─── Notification Types ───────────────────────────────────────────────────────
export type WNPriority = "critical" | "warning" | "info" | "success";
export type WNCategory = "batch" | "payment" | "warp";
export type WNFilter = "all" | WNPriority;

export interface WeaverNotif {
  id: number; priority: WNPriority; category: WNCategory;
  title: string; body: string; time: string; date: string; read: boolean; action?: string;
}

export const WN_T = {
  silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B", antiqueGold: "#C89B47", goldLight: "#E7C983",
  luxuryBrown: "#3B2314", taupe: "#69635E", warmCream: "#F5E8D0",
  green: "#1E6640", borderDef: "rgba(110,15,45,0.10)",
};
export const WN_G = {
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
};
export const WN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const WN_NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

export const WN_DATA: WeaverNotif[] = [];

export const WN_PRIORITY: Record<WNPriority, { color: string; bg: string; border: string; Icon: React.ElementType; label: string }> = {
  critical: { color: "#B91C1C", bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.20)", Icon: AlertTriangle, label: "Critical" },
  warning:  { color: "#B45309", bg: "rgba(180,83,9,0.08)",  border: "rgba(180,83,9,0.20)",  Icon: AlertCircle,   label: "Warning"  },
  info:     { color: "#1D4ED8", bg: "rgba(29,78,216,0.07)", border: "rgba(29,78,216,0.18)", Icon: Info,          label: "Info"     },
  success:  { color: "#1E6640", bg: "rgba(30,102,64,0.07)", border: "rgba(30,102,64,0.18)", Icon: CheckCircle2,  label: "Success"  },
};

export const WN_CATEGORY: Record<WNCategory, { Icon: React.ElementType; label: string; color: string }> = {
  batch:   { Icon: Package,      label: "Batch & Materials", color: "#6E0F2D" },
  payment: { Icon: Wallet,       label: "Payment",           color: "#1D4ED8" },
  warp:    { Icon: ArrowUpRight, label: "Warp Request",      color: "#7B3F00" },
};

export const WN_FILTERS: { key: WNFilter; label: string }[] = [
  { key: "all",      label: "All"      },
  { key: "critical", label: "Critical" },
  { key: "warning",  label: "Warning"  },
  { key: "success",  label: "Success"  },
  { key: "info",     label: "Info"     },
];

export function WNFadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}>
      {children}
    </motion.div>
  );
}

// ─── WeaverBatch type & data ──────────────────────────────────────────────────
export interface WeaverBatch {
  id: string; design: string; name: string; status: "active" | "completed" | "qc";
  done: number; total: number; pct: number; passRate: number;
  amount: string | null; month: string; gradient: string; accentColor: string;
}

export const BATCH_LIST: WeaverBatch[] = [
  { id: "BATCH-086", design: "BKB-045", name: "Cream Zari Border Saree",  status: "active",    done: 3, total: 5,  pct: 60,  passRate: 97,  amount: null,     month: "Jun 2026", gradient: "linear-gradient(135deg, #E8D5B0 0%, #C9A86C 100%)", accentColor: C.burg },
  { id: "BATCH-089", design: "BKB-031", name: "Red Silk Kanjivaram",       status: "active",    done: 4, total: 8,  pct: 50,  passRate: 97,  amount: null,     month: "Jun 2026", gradient: "linear-gradient(135deg, #8B2020 0%, #C0392B 100%)", accentColor: C.gold },
  { id: "BATCH-072", design: "BKB-038", name: "Purple Silk Traditional",   status: "completed", done: 6, total: 6,  pct: 100, passRate: 100, amount: "₹2,700", month: "Apr 2026", gradient: "linear-gradient(135deg, #5A3E6B 0%, #7B5F9B 100%)", accentColor: "#5A3E6B" },
  { id: "BATCH-061", design: "BKB-022", name: "Green Peacock Motif",       status: "completed", done: 4, total: 5,  pct: 80,  passRate: 88,  amount: "₹1,960", month: "Apr 2026", gradient: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", accentColor: "#2D6B6B" },
  { id: "BATCH-054", design: "BKB-045", name: "Cream Zari Border Saree",  status: "completed", done: 7, total: 7,  pct: 100, passRate: 100, amount: "₹3,150", month: "Mar 2026", gradient: "linear-gradient(135deg, #E8D5B0 0%, #C9A86C 100%)", accentColor: C.burg },
  { id: "BATCH-046", design: "BKB-012", name: "Blue Silk Plain",           status: "completed", done: 5, total: 5,  pct: 100, passRate: 95,  amount: "₹2,250", month: "Feb 2026", gradient: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)", accentColor: "#1565C0" },
  { id: "BATCH-039", design: "BKB-022", name: "Green Peacock Motif",       status: "completed", done: 6, total: 6,  pct: 100, passRate: 100, amount: "₹2,700", month: "Jan 2026", gradient: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", accentColor: "#2D6B6B" },
  { id: "BATCH-031", design: "BKB-031", name: "Red Silk Kanjivaram",       status: "completed", done: 7, total: 8,  pct: 87,  passRate: 96,  amount: "₹3,360", month: "Jan 2026", gradient: "linear-gradient(135deg, #8B2020 0%, #C0392B 100%)", accentColor: C.gold },
  { id: "BATCH-024", design: "BKB-045", name: "Cream Zari Border Saree",  status: "completed", done: 8, total: 8,  pct: 100, passRate: 99,  amount: "₹3,600", month: "Dec 2025", gradient: "linear-gradient(135deg, #E8D5B0 0%, #C9A86C 100%)", accentColor: C.burg },
  { id: "BATCH-016", design: "BKB-038", name: "Purple Silk Traditional",   status: "completed", done: 5, total: 6,  pct: 83,  passRate: 92,  amount: "₹2,100", month: "Nov 2025", gradient: "linear-gradient(135deg, #5A3E6B 0%, #7B5F9B 100%)", accentColor: "#5A3E6B" },
  { id: "BATCH-009", design: "BKB-022", name: "Green Peacock Motif",       status: "completed", done: 6, total: 6,  pct: 100, passRate: 98,  amount: "₹2,700", month: "Oct 2025", gradient: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", accentColor: "#2D6B6B" },
  { id: "BATCH-003", design: "BKB-031", name: "Red Silk Kanjivaram",       status: "completed", done: 8, total: 8,  pct: 100, passRate: 100, amount: "₹3,840", month: "Sep 2025", gradient: "linear-gradient(135deg, #8B2020 0%, #C0392B 100%)", accentColor: C.gold },
];

export const BATCH_STATUS_CFG = {
  active:    { label: "Weaving in Progress", dot: C.green,   textColor: C.green },
  completed: { label: "Completed",           dot: "#1D4ED8", textColor: "#1D4ED8" },
  qc:        { label: "Pending QC",          dot: "#8B6018", textColor: "#8B6018" },
};

export function BatchCard({ b }: { b: WeaverBatch }) {
  const cfg = BATCH_STATUS_CFG[b.status];
  const qcColor = b.passRate >= 95 ? C.green : b.passRate >= 85 ? "#8B6018" : C.crim;
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0px 28px 72px rgba(74,6,27,0.16)" }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{ background: "#FFFDF9", borderRadius: 24, border: "1px solid rgba(110,15,45,0.10)", boxShadow: "0px 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" as const }}
    >
      <div style={{ height: 160, flexShrink: 0, overflow: "hidden", position: "relative" as const, background: b.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Flower2 size={56} color="rgba(255,255,255,0.22)" />
        <div style={{ position: "absolute" as const, top: 0, left: 0, right: 0, height: 3, background: b.accentColor }} />
        <div style={{ position: "absolute" as const, top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,253,249,0.92)", backdropFilter: "blur(8px)", border: "1px solid rgba(110,15,45,0.10)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
          <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: cfg.dot }}>{cfg.label}</span>
        </div>
        <div style={{ position: "absolute" as const, bottom: 10, left: 14, background: "rgba(0,0,0,0.38)", borderRadius: 6, padding: "3px 10px" }}>
          <span style={{ fontFamily: F.m, fontSize: 12, color: "rgba(255,255,255,0.90)" }}>{b.design}</span>
        </div>
      </div>
      <div style={{ padding: "18px 20px 22px", display: "flex", flexDirection: "column" as const, flex: 1, gap: 12 }}>
        <div>
          <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: "#6E0F2D", lineHeight: 1.2, marginBottom: 3 }}>{b.id}</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "#69635E" }}>{b.name}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Sarees",  val: `${b.done} of ${b.total}`, color: "#3B2314" },
            { label: "QC Pass", val: `${b.passRate}%`,           color: qcColor },
            { label: "Month",   val: b.month,                    color: "#3B2314" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#F7F2EA", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(110,15,45,0.10)" }}>
              <div style={{ fontFamily: F.m, fontSize: 12, color: "#69635E", letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>{stat.label}</div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: stat.color }}>{stat.val}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, color: "#69635E" }}>Progress</span>
            <span style={{ fontFamily: F.m, fontSize: 12, color: "#3B2314", fontWeight: 600 }}>{b.pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(110,15,45,0.07)" }}>
            <div style={{ width: `${b.pct}%`, height: "100%", borderRadius: 999, background: b.accentColor, transition: "width 0.6s ease" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid rgba(110,15,45,0.08)" }}>
          <span style={{ fontFamily: F.u, fontSize: 12, color: "#69635E" }}>{b.month}</span>
          <motion.div whileHover={{ x: 3 }} style={{ display: "flex", alignItems: "center", gap: 4, color: "#6E0F2D", cursor: "pointer" }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600 }}>View</span>
            <ChevronRight size={13} color="#6E0F2D" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function FadeUpBatch({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}>
      {children}
    </motion.div>
  );
}

export const BG_IMAGE = "https://images.unsplash.com/photo-1707978932202-751b08324daf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";
export const FABRIC_BG = "https://images.unsplash.com/photo-1569909115134-a0426936c879?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";
