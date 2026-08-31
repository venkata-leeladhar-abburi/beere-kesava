import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { brand } from "@/design-system/tokens";
import { T, F, EASE } from "../theme";

// ═══════════════════════════════════════════════════════════════════════════════
// CHART DESIGN SYSTEM
// Mirrors the Overview → Performance Overview cards: warm-ivory surface, hairline
// burgundy border, 28px radius, soft long shadow, display-serif headings, taupe
// uppercase micro-labels, tabular numerals, and a two-hue brand palette
// (burgundy = primary series, gold = secondary series). No other hues are used
// for data — only text/status colours stay semantic.
// ═══════════════════════════════════════════════════════════════════════════════

export const CHART = {
  primary:      T.royalBurgundy,
  primaryDeep:  "#3D1020",
  secondary:    T.antiqueGold,
  secondaryLite: T.goldLight,
  // Completion is the one place a non-house hue earns its keep: "done" is
  // universally read as green, and it ties the bulk-order bars to their band.
  done:         brand.green[800],
  doneLite:     brand.green[600],
  track:        "rgba(110,15,45,0.07)",
  grid:         "rgba(0,0,0,0.05)",
  // Sequential burgundy→gold ramp for ordered stages. Reading left→right along
  // the pipeline the colour warms, so the stage order is legible at a glance
  // instead of being encoded in four unrelated hues.
  ramp: ["#4A061B", "#6E0F2D", "#A0506A", "#C89B47"],
};

/**
 * Header-band accents, taken straight from the design-system ramps.
 *
 * These cards now sit *inside* the deep-wine Production Analytics container, so
 * the bands are deliberately light: a dark plaque on a dark banner reads muddy,
 * and four saturated plaques in one container is colour noise. The band ground
 * is the same warm ivory for all four — the accent survives only in the icon
 * tile, the hairline under the band, and the hint rule. Hierarchy comes from
 * value (dark parent, light children), not from four competing hues.
 */
export const BAND = {
  output: {
    tile: `linear-gradient(135deg, ${brand.burgundy[950]} 0%, ${brand.burgundy[900]} 100%)`,
    hairline: brand.burgundy[900],
    wash: "rgba(110,15,45,0.05)",
    icon: brand.gold[300],
  },
  pipeline: {
    tile: `linear-gradient(135deg, ${brand.burgundy[900]} 0%, ${brand.burgundy[800]} 100%)`,
    hairline: brand.burgundy[800],
    wash: "rgba(135,45,68,0.05)",
    icon: brand.burgundy[100],
  },
  weavers: {
    tile: `linear-gradient(135deg, ${brand.gold[900]} 0%, ${brand.gold[700]} 100%)`,
    hairline: brand.gold[700],
    wash: "rgba(132,94,4,0.05)",
    icon: brand.gold[200],
  },
  orders: {
    tile: `linear-gradient(135deg, ${brand.green[950]} 0%, ${brand.green[800]} 100%)`,
    hairline: brand.green[800],
    wash: "rgba(21,96,61,0.05)",
    icon: brand.green[200],
  },
} as const;

export type BandTone = keyof typeof BAND;

export const NUM: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

/** Counts up to the target once scrolled into view. */
export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setN(Math.round((1 - Math.pow(1 - p, 4)) * value));
      if (p < 1) requestAnimationFrame(step);
      else setN(value);
    };
    requestAnimationFrame(step);
  }, [inView, value, duration]);
  return <span ref={ref}>{n}</span>;
}

/**
 * Elevated chart surface. Layered on top of the Performance Overview shell:
 * a woven-cream gradient ground, a hairline gold rule along the top edge, and a
 * two-stage shadow (tight contact + wide ambient) so the card reads as pressed
 * silk rather than a flat panel. Padding is deliberately tighter than the
 * Overview cards — these sit four-up, so every 8px of chrome costs a scroll.
 */
export function ChartCard({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 250, damping: 25, opacity: { duration: 0.45 } }}
      style={{
        background: "linear-gradient(162deg, #FFFDF9 0%, #FDF8F1 58%, #FBF3E8 100%)",
        borderRadius: 16,
        border: `2px solid rgba(200,155,71,0.5)`,
        boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Warm burgundy bloom in the top-right, kept under 4% so it never
          competes with the data ink. */}
      <span aria-hidden style={{
        position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
        pointerEvents: "none",
      }} />
      {children}
    </motion.div>
  );
}

/**
 * Full-bleed header band — the same device as the "All Active Production
 * Batches" card, but in a light key so it sits *under* the section banner in the
 * visual hierarchy instead of fighting it.
 */
export function ChartBand({ tone, icon, title, sub }: {
  tone: BandTone; icon: React.ReactNode; title: string; sub: string;
}) {
  const b = BAND[tone];
  return (
    <div style={{
      position: "relative", overflow: "hidden", padding: "14px 18px",
      background: `linear-gradient(104deg, #FFFDF9 0%, #FCF7EF 100%)`,
      borderBottom: `1px solid ${T.borderDef}`,
    }}>
      {/* Faintest accent wash, so each card is identifiable at a glance without
          carrying a slab of colour. */}
      <span aria-hidden style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(104deg, ${b.wash} 0%, rgba(255,255,255,0) 65%)`,
        pointerEvents: "none",
      }} />
      {/* Accent hairline riding the bottom edge — the card's colour signature. */}
      <span aria-hidden style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${b.hairline} 0%, ${b.hairline} 28%, rgba(200,155,71,0) 100%)`,
        opacity: 0.5,
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: b.tile,
          boxShadow: "0 2px 6px rgba(74,6,27,0.18), inset 0 1px 0 rgba(255,255,255,0.16)",
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 17, color: T.luxuryBrown, letterSpacing: "-0.1px", lineHeight: 1.2 }}>
            {title}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 2, lineHeight: 1.4 }}>
            {sub}
          </div>
        </div>
      </div>
    </div>
  );
}

/** One-line reading hint, sitting on the cream ground under the band. */
export function ChartHint({ children, tone }: { children: React.ReactNode; tone: BandTone }) {
  return (
    <div style={{
      paddingLeft: 9, marginBottom: 14,
      borderLeft: `2px solid ${BAND[tone].hairline}`,
      opacity: 0.92,
      fontFamily: F.ui, fontSize: 11.5, color: T.taupe, lineHeight: 1.45, fontStyle: "italic",
    }}>
      {children}
    </div>
  );
}

/** Big headline figure with a caption underneath, as on “Sarees Produced”. */
export function HeroStat({ value, caption, icon, unit, secondary }: { value: number; caption: string; icon?: React.ReactNode; unit?: string; secondary?: { value: number; unit: string } }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 40, color: T.luxuryBrown, lineHeight: 1.0, ...NUM }}>
            <CountUp value={value} />
          </span>
          {unit && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{unit}</span>}
        </div>
        {secondary && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span aria-hidden style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginRight: 2 }}>+</span>
            <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, color: T.luxuryBrown, lineHeight: 1.0, ...NUM }}>
              <CountUp value={secondary.value} />
            </span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{secondary.unit}</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
        {icon}
        <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, letterSpacing: "0.1px" }}>{caption}</span>
      </div>
    </div>
  );
}

export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 8 }}>
      {items.map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
          <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{l.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Divided footer stat strip. Sits on a faint burgundy inset with a gold hairline
 * above it, so the summary figures read as a plinth under the chart rather than
 * as three more floating numbers.
 */
export function StatFooter({ stats }: { stats: { num: React.ReactNode; label: string }[] }) {
  return (
    <div style={{ marginTop: "auto", paddingTop: 14 }}>
      <div aria-hidden style={{
        height: 1, marginBottom: 14,
        background: "linear-gradient(90deg, rgba(200,155,71,0) 0%, rgba(200,155,71,0.30) 50%, rgba(200,155,71,0) 100%)",
      }} />
      <div style={{ display: "flex" }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: "center", padding: "0 6px",
            borderRight: i < stats.length - 1 ? `1px solid ${T.borderDef}` : "none",
          }}>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 26, color: T.luxuryBrown, lineHeight: 1.1, ...NUM }}>{s.num}</div>
            <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11, color: T.taupe, marginTop: 4, textTransform: "uppercase", letterSpacing: "1.2px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Uppercase micro-label used above grouped rows. */
export function MicroLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 10, color: color ?? T.taupe, textTransform: "uppercase", letterSpacing: "1.2px" }}>
      {children}
    </span>
  );
}

/**
 * Rounded track + animated fill, the single bar idiom used across every card.
 * The track carries a faint inner shadow and the fill a top sheen, which is what
 * separates a "premium" bar from a flat rectangle at this size.
 */
export function TrackBar({ pct, fill, height = 9, delay = 0 }: {
  pct: number; fill: string; height?: number; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div ref={ref} style={{
      height, background: CHART.track, borderRadius: 999, overflow: "hidden",
      boxShadow: "inset 0 1px 2px rgba(74,6,27,0.06)",
    }}>
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${clamped}%` } : undefined}
        transition={{ duration: 0.9, delay, ease: EASE }}
        style={{
          height: "100%", borderRadius: 999, background: fill,
          boxShadow: clamped > 0 ? "inset 0 1px 0 rgba(255,255,255,0.22)" : "none",
        }}
      />
    </div>
  );
}

export interface GroupedBarPoint { label: string; a: number; b: number }

/**
 * Two-series grouped column chart with a real y-axis and baseline gridlines —
 * the same construction as the Overview chart, so a value can be read off the
 * axis instead of hunting for a number floating above each bar.
 */
export function GroupedBarChart({ data, height = 168 }: { data: GroupedBarPoint[]; height?: number }) {
  const W = 420, H = 162, PB = 22, PT = 10, PL = 30;
  const iW = W - PL, iH = H - PB - PT;
  const rawMax = Math.max(1, ...data.map(d => Math.max(d.a, d.b)));
  // Round the axis up to a friendly increment so ticks are whole numbers.
  const step = Math.max(1, Math.ceil(rawMax / 3 / 5) * 5);
  const maxV = step * 3;
  const ticks = [0, step, step * 2, maxV];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });

  return (
    <div ref={ref} style={{ width: "100%", minHeight: height }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="prodBarA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={CHART.primary} />
            <stop offset="100%" stopColor={CHART.primaryDeep} />
          </linearGradient>
          <linearGradient id="prodBarB" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={CHART.secondaryLite} />
            <stop offset="100%" stopColor={CHART.secondary} />
          </linearGradient>
          {/* Grounds the columns on the baseline so they sit in the card
              instead of floating on it. */}
          <filter id="prodBarShadow" x="-60%" y="-20%" width="220%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#4A061B" floodOpacity="0.18" />
          </filter>
        </defs>

        {ticks.map(v => {
          const y = PT + iH * (1 - v / maxV);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W} y2={y} stroke={CHART.grid} strokeWidth={1} strokeDasharray={v === 0 ? "0" : "2 4"} />
              <text x={PL - 6} y={y + 3.5} textAnchor="end" fontFamily={F.ui} fontSize={8.5} fontWeight="500" fill={T.taupe} style={NUM}>
                {v}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const gW = iW / data.length;
          const gx = PL + i * gW + gW / 2;
          const bW = Math.min(16, gW / 3), gap = 5;
          const baseY = PT + iH;
          const hA = (d.a / maxV) * iH;
          const hB = (d.b / maxV) * iH;
          return (
            <g key={d.label}>
              <title>{`${d.label} — produced ${d.a}, QC passed ${d.b}`}</title>
              <motion.rect
                x={gx - bW - gap / 2} width={bW} rx={bW / 2} fill="url(#prodBarA)" filter="url(#prodBarShadow)"
                initial={{ y: baseY, height: 0 }}
                animate={inView ? { y: baseY - hA, height: hA } : undefined}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.08, ease: EASE }}
              />
              <motion.rect
                x={gx + gap / 2} width={bW} rx={bW / 2} fill="url(#prodBarB)" filter="url(#prodBarShadow)"
                initial={{ y: baseY, height: 0 }}
                animate={inView ? { y: baseY - hB, height: hB } : undefined}
                transition={{ duration: 0.9, delay: 0.33 + i * 0.08, ease: EASE }}
              />
              <text x={gx} y={H - 5} textAnchor="middle" fontFamily={F.ui} fontSize={9} fontWeight="500" fill={T.taupe} letterSpacing="0.6">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export interface SingleBarPoint { label: string; value: number; unit?: string }

export function SingleBarChart({ data, height = 168, fillId = "prodBarA" }: { data: SingleBarPoint[]; height?: number; fillId?: string }) {
  const W = 420, H = 162, PB = 30, PT = 32, PL = 30;
  const iW = W - PL, iH = H - PB - PT;
  const rawMax = Math.max(1, ...data.map(d => d.value));
  const step = Math.max(1, Math.ceil(rawMax / 3 / 5) * 5);
  const maxV = step * 3;
  const ticks = [0, step, step * 2, maxV];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });

  return (
    <div ref={ref} style={{ width: "100%", minHeight: height }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="singleBarPrimary" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={CHART.primary} />
            <stop offset="100%" stopColor={CHART.primaryDeep} />
          </linearGradient>
          <linearGradient id="singleBarSecondary" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={CHART.secondaryLite} />
            <stop offset="100%" stopColor={CHART.secondary} />
          </linearGradient>
          <filter id="singleBarShadow" x="-60%" y="-20%" width="220%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#4A061B" floodOpacity="0.18" />
          </filter>
        </defs>

        {ticks.map(v => {
          const y = PT + iH * (1 - v / maxV);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W} y2={y} stroke={CHART.grid} strokeWidth={1} strokeDasharray={v === 0 ? "0" : "2 4"} />
              <text x={PL - 6} y={y + 3.5} textAnchor="end" fontFamily={F.ui} fontSize={8.5} fontWeight="500" fill={T.taupe} style={NUM}>
                {v}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const gW = iW / data.length;
          const gx = PL + i * gW + gW / 2;
          const bW = Math.min(24, gW / 2);
          const baseY = PT + iH;
          const hV = (d.value / maxV) * iH;
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${d.value}${d.unit ? " " + d.unit : ""}`}</title>
              <motion.rect
                x={gx - bW / 2} width={bW} rx={bW / 2} fill={`url(#${fillId})`} filter="url(#singleBarShadow)"
                initial={{ y: baseY, height: 0 }}
                animate={inView ? { y: baseY - hV, height: hV } : undefined}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.08, ease: EASE }}
              />
              <text
                x={gx} y={baseY - hV - 8} textAnchor="middle"
                fontFamily={F.ui} fontSize={15} fontWeight="700" fill={T.luxuryBrown} style={NUM}
              >
                {d.value}
              </text>
              <text x={gx} y={H - (d.unit ? 15 : 6)} textAnchor="middle" fontFamily={F.ui} fontSize={12} fontWeight="600" fill={T.taupe} letterSpacing="0.6">
                {d.label}
              </text>
              {d.unit && (
                <text x={gx} y={H - 3} textAnchor="middle" fontFamily={F.ui} fontSize={8} fontWeight="500" fill={T.taupe} letterSpacing="0.4">
                  {d.unit}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Consistent loading / error / empty state so all four cards behave alike. */
export function ChartState({ kind, message }: { kind: "loading" | "error" | "empty"; message: string }) {
  return (
    <div style={{
      flex: 1, minHeight: 160, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center",
    }}>
      <span style={{
        fontFamily: F.ui, fontSize: 13,
        color: kind === "error" ? T.crimson : T.taupe,
      }}>
        {message}
      </span>
    </div>
  );
}
