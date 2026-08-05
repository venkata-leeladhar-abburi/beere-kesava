import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";
import { Download, FileText, Calendar } from "lucide-react";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F, EASE } from "../theme";

export function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }} style={style}>
      {children}
    </motion.div>
  );
}

export function AnimCount({ raw }: { raw: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [disp, setDisp] = useState(() => {
    const m = raw.match(/[\d.]+/);
    return m ? raw.replace(m[0], raw.includes(".") ? "0.0" : "0") : raw;
  });
  useEffect(() => {
    if (!inView) return;
    const m = raw.match(/[\d.]+/);
    if (!m) { setDisp(raw); return; }
    const target = parseFloat(m[0]);
    const isFloat = m[0].includes(".");
    const idx = raw.indexOf(m[0]);
    const pre = raw.slice(0, idx), suf = raw.slice(idx + m[0].length);
    const dur = 1400; let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setDisp(`${pre}${isFloat ? (e * target).toFixed(1) : Math.round(e * target)}${suf}`);
      if (p < 1) requestAnimationFrame(step); else setDisp(raw);
    };
    requestAnimationFrame(step);
  }, [inView, raw]);
  return <span ref={ref}>{disp}</span>;
}

export function AnimBar({ pct, color, height = 6, delay = 0 }: { pct: number; color: string; height?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 99, background: "rgba(110,15,45,0.08)", overflow: "hidden" }}>
      <motion.div initial={{ width: "0%" }} animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.2, delay: 0.2 + delay, ease: EASE }}
        style={{ height: "100%", borderRadius: 99, background: color }} />
    </div>
  );
}

// ── Shared Table Styles ───────────────────────────────────────────────────────
export const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", padding: "13px 14px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
export const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "13px 14px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

// ── ChartCard ─────────────────────────────────────────────────────────────────
export function ChartCard({ title, sub, icon, children }: { title: string; sub?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
      <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
        {icon ? (
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(110,15,45,0.07)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
              {sub && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 3 }}>{sub}</div>}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
            {sub && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 3 }}>{sub}</div>}
          </>
        )}
      </div>
      <div style={{ flex: 1, padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

// ── SumCard ───────────────────────────────────────────────────────────────────
export function SumCard({ icon, label, value, sub, hi = false, crimsonHi = false, greenHi = false }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  hi?: boolean; crimsonHi?: boolean; greenHi?: boolean;
}) {
  const valColor = hi ? T.antiqueGold : crimsonHi ? T.crimson : greenHi ? T.green : T.luxuryBrown;
  const iconBg   = hi ? "rgba(200,155,71,0.12)" : crimsonHi ? T.crimsonBg : greenHi ? T.greenBg : "rgba(110,15,45,0.07)";
  const iconBdr  = hi ? T.borderGold : crimsonHi ? "rgba(192,57,43,0.18)" : greenHi ? "rgba(30,102,64,0.18)" : T.borderDef;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      background: hi ? `linear-gradient(145deg,${T.warmCream},#FDF6E4)` : T.warmIvory,
      borderRadius: 16,
      border: `1px solid ${hi ? T.borderGold : crimsonHi ? "rgba(192,57,43,0.18)" : greenHi ? "rgba(30,102,64,0.18)" : T.borderDef}`,
      borderTop: hi ? `3px solid ${T.antiqueGold}` : crimsonHi ? `3px solid ${T.crimson}` : greenHi ? `3px solid ${T.green}` : `1px solid ${T.borderDef}`,
      boxShadow: hi ? "0 4px 20px rgba(200,155,71,0.12)" : "0 2px 10px rgba(74,6,27,0.05)",
      padding: "22px 22px 20px",
      minHeight: 175,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: iconBg, border: `1px solid ${iconBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, lineHeight: 1.4 }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: valColor, lineHeight: 1.1 }}>
        <AnimCount raw={value} />
      </div>
      {sub && <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginTop: "auto" }}>{sub}</div>}
    </div>
  );
}

// ── Report Download Bar ───────────────────────────────────────────────────────
export function ReportDLBar({ period = "May 2026", compared = "April 2026" }: { period?: string; compared?: string }) {
  return (
    <div style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(74,6,27,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={17} color={T.antiqueGold} />
        </div>
        <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
          Showing: <span style={{ fontFamily: F.display, fontWeight: 700, color: T.luxuryBrown }}>{period}</span>
          {compared && <> · Compared with: <span style={{ fontFamily: F.display, fontWeight: 700, color: T.antiqueGold }}>{compared}</span></>}
        </span>
      </div>
      <DownloadGate>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", border: `1.5px solid ${T.borderDef}`, borderRadius: 9, background: "#FFFFFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
            <FileText size={14} />Download PDF
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", border: "none", borderRadius: 9, background: T.royalBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFFDF9", cursor: "pointer" }}>
            <Download size={14} />Download Excel
          </button>
        </div>
      </DownloadGate>
    </div>
  );
}

// ── Tab Section Title ─────────────────────────────────────────────────────────
export function TabTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99, flexShrink: 0 }} />
        <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "0 0 0 16px", maxWidth: 760, lineHeight: 1.65 }}>{sub}</p>
    </div>
  );
}

// ── Shared Chart Tooltip ──────────────────────────────────────────────────────
export function ChartTip({ active, payload, label, prefix = "", suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "10px 14px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      {label && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill || p.stroke }} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.name}:</span>
          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{prefix}{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

// ── Mini SVG Donut ────────────────────────────────────────────────────────────
export function MiniDonut({ value, max, color, label, unit = "kg", badge, badgeType = "ok", footNote }: {
  value: number; max: number; color: string; label: string;
  unit?: string; badge?: string; badgeType?: "ok" | "low" | "out"; footNote?: string;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 30; const circ = 2 * Math.PI * r;
  const dash = pct * circ; const gap = circ - dash;
  const badgeBg = badgeType === "out" ? T.crimsonBg : badgeType === "low" ? "rgba(200,155,71,0.12)" : T.greenBg;
  const badgeColor = badgeType === "out" ? T.crimson : badgeType === "low" ? "#8B6018" : T.green;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(110,15,45,0.08)" strokeWidth="10" />
          {pct > 0 && (
            <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
              transform="rotate(-90 40 40)" />
          )}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{value}</span>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{unit}</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 3 }}>{label}</div>
        {footNote && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginBottom: 3 }}>{footNote}</div>}
        {badge && <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, background: badgeBg, color: badgeColor, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>{badge}</span>}
      </div>
    </div>
  );
}

// ── Table pagination footer ───────────────────────────────────────────────────
export function TablePager({ total, showing }: { total: number; showing: number }) {
  return (
    <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmIvory }}>
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {showing} of {total} records</span>
      <div style={{ display: "flex", gap: 5 }}>
        {["Prev", "1", "2", "3", "Next"].map(p => (
          <button key={p} style={{ padding: "7px 13px", borderRadius: 7, border: `1px solid ${p === "1" ? T.royalBurgundy : T.borderDef}`, background: p === "1" ? T.royalBurgundy : "#fff", color: p === "1" ? "#FFFDF9" : T.luxuryBrown, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{p}</button>
        ))}
      </div>
    </div>
  );
}

// ── StatusPill ────────────────────────────────────────────────────────────────
export function StatusPill({ label, type = "neutral" }: { label: string; type?: "ok" | "warn" | "bad" | "neutral" | "gold" }) {
  const map = {
    ok:      { bg: "rgba(30,102,64,0.10)",  color: T.green },
    warn:    { bg: "rgba(200,155,71,0.13)", color: "#8B6018" },
    bad:     { bg: "rgba(192,57,43,0.10)",  color: T.crimson },
    neutral: { bg: "rgba(110,15,45,0.06)",  color: T.taupe },
    gold:    { bg: "rgba(200,155,71,0.13)", color: T.antiqueGold },
  };
  const c = map[type];
  return (
    <span style={{ display: "inline-block", padding: "4px 11px", borderRadius: 20, fontFamily: F.mono, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: "nowrap" as const }}>{label}</span>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 3, height: 22, background: T.antiqueGold, borderRadius: 99 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, margin: 0 }}>{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}
