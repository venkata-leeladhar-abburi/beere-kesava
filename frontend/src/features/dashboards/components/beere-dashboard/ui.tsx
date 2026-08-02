
import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { T, F, NUM, G, EASE , DARK_MAROON } from './theme';

function FadeUp({
  children, delay = 0, style,
}: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({
  children, delay = 0, style,
}: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.65, delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function AnimatedBar({
  pct, color, height = 5, trackBg = "rgba(110,15,45,0.07)",
}: { pct: number; color: string; height?: number; trackBg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 999, background: trackBg }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : undefined}
        transition={{ duration: 1.4, delay: 0.18, ease: EASE }}
        style={{ height: "100%", borderRadius: 999, background: color }}
      />
    </div>
  );
}

function AnimatedNumber({ raw }: { raw: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(() => {
    const m = raw.match(/(\d+(?:\.\d+)?)/);
    if (!m) return raw;
    const isFloat = m[1].includes(".");
    return raw.replace(m[1], isFloat ? "0.0" : "0");
  });

  useEffect(() => {
    if (!inView) return;
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    if (!match) { setDisplayed(raw); return; }
    const numStr = match[1];
    const target = parseFloat(numStr);
    const isFloat = numStr.includes(".");
    const idx = raw.indexOf(numStr);
    const pre = raw.slice(0, idx);
    const suf = raw.slice(idx + numStr.length);
    const dur = 1600;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setDisplayed(`${pre}${isFloat ? (e * target).toFixed(1) : Math.round(e * target)}${suf}`);
      if (p < 1) requestAnimationFrame(step);
      else setDisplayed(raw);
    };
    requestAnimationFrame(step);
  }, [inView, raw]);

  return <span ref={ref}>{displayed}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function IcoRawMaterial({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="7.5" cy="16" rx="5" ry="3.2" stroke={col} strokeWidth="1.4" />
      <ellipse cx="16.5" cy="16" rx="5" ry="3.2" stroke={col} strokeWidth="1.4" />
      <ellipse cx="12" cy="12" rx="4" ry="2.8" stroke={col} strokeWidth="1.4" />
      <path d="M12 9.2 C13 5 18.5 3.5 17.5 8" stroke={col} strokeWidth="1.4" />
      <path d="M14.5 5.5 C14 7 12.5 8.5 12 9.2" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoYarnInventory({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20.5 L5.2 3 L8.8 3 L11 20.5Z" stroke={col} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="3.4" y1="17"   x2="10.6" y2="17"   stroke={col} strokeWidth="1.1" />
      <line x1="4"   y1="13.5" x2="10"   y2="13.5" stroke={col} strokeWidth="1.1" />
      <line x1="4.6" y1="10"   x2="9.4"  y2="10"   stroke={col} strokeWidth="1.1" />
      <line x1="5.2" y1="6.5"  x2="8.8"  y2="6.5"  stroke={col} strokeWidth="1.1" />
      <path d="M13 20.5 L15.2 3 L18.8 3 L21 20.5Z" stroke={col} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="13.4" y1="17"   x2="20.6" y2="17"   stroke={col} strokeWidth="1.1" />
      <line x1="14"   y1="13.5" x2="20"   y2="13.5" stroke={col} strokeWidth="1.1" />
      <line x1="14.6" y1="10"   x2="19.4" y2="10"   stroke={col} strokeWidth="1.1" />
      <line x1="15.2" y1="6.5"  x2="18.8" y2="6.5"  stroke={col} strokeWidth="1.1" />
    </svg>
  );
}
function IcoFabricRoll({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="7" cy="12" rx="4" ry="7" stroke={col} strokeWidth="1.4" />
      <line x1="7" y1="5"  x2="21" y2="4"  stroke={col} strokeWidth="1.4" />
      <line x1="7" y1="19" x2="21" y2="20" stroke={col} strokeWidth="1.4" />
      <line x1="21" y1="4" x2="21" y2="20" stroke={col} strokeWidth="1.4" />
      <line x1="11"   y1="4.4"  x2="11"   y2="19.6" stroke={col} strokeWidth="0.9" />
      <line x1="15"   y1="4.2"  x2="15"   y2="19.8" stroke={col} strokeWidth="0.9" />
      <line x1="18.5" y1="4.1"  x2="18.5" y2="19.9" stroke={col} strokeWidth="0.9" />
    </svg>
  );
}
function IcoQualityCheck({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 27 27" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3" width="15" height="19" rx="1.5" stroke={col} strokeWidth="1.4" />
      <path d="M8 3 L8 1 L13 1 L13 3" stroke={col} strokeWidth="1.3" />
      <line x1="6.5" y1="9"    x2="8.5"  y2="9"    stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="9"    x2="14.5" y2="9"    stroke={col} strokeWidth="1.2" />
      <line x1="6.5" y1="12.5" x2="8.5"  y2="12.5" stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="12.5" x2="14.5" y2="12.5" stroke={col} strokeWidth="1.2" />
      <line x1="6.5" y1="16"   x2="8.5"  y2="16"   stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="16"   x2="12.5" y2="16"   stroke={col} strokeWidth="1.2" />
      <circle cx="21" cy="21" r="5.5" stroke={col} strokeWidth="1.4" />
      <path d="M18 21 L20 23 L24.5 17.5" stroke={col} strokeWidth="1.7" />
    </svg>
  );
}
function IcoTruck({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="7" width="13" height="9" rx="1" stroke={col} strokeWidth="1.4" />
      <path d="M14 10.5 L14 16 L22.5 16 L22.5 11.5 L19.5 7.5 L14 7.5Z" stroke={col} strokeWidth="1.4" />
      <circle cx="5.5"  cy="17.5" r="1.7" stroke={col} strokeWidth="1.4" />
      <circle cx="18.5" cy="17.5" r="1.7" stroke={col} strokeWidth="1.4" />
    </svg>
  );
}
function IcoInvoice({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2 L15.5 2 L19 5.5 L19 22 L5 22 Z" stroke={col} strokeWidth="1.4" />
      <path d="M15.5 2 L15.5 5.5 L19 5.5" stroke={col} strokeWidth="1.3" />
      <line x1="8" y1="9"  x2="16" y2="9"  stroke={col} strokeWidth="1.2" />
      <line x1="8" y1="12" x2="16" y2="12" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoResourceMgmt({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3.2" stroke={col} strokeWidth="1.4" />
      <path d="M2 21 C2 16.5 5 14 9 14 C10.2 14 11.3 14.3 12.3 14.9" stroke={col} strokeWidth="1.4" />
      <circle cx="18" cy="18" r="2.8" stroke={col} strokeWidth="1.3" />
      {[0,60,120,180,240,300].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return <line key={i} x1={18+2.8*Math.cos(r)} y1={18+2.8*Math.sin(r)} x2={18+4.2*Math.cos(r)} y2={18+4.2*Math.sin(r)} stroke={col} strokeWidth="1.8" />;
      })}
    </svg>
  );
}
function IcoWarehouse({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10 L12 3 L23 10" stroke={col} strokeWidth="1.4" />
      <rect x="3" y="10" width="18" height="12" stroke={col} strokeWidth="1.4" />
      <rect x="9.5" y="15" width="5" height="7" rx="0.5" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoHandshake({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17 L7 12 L10 12 L13.5 8.5" stroke={col} strokeWidth="1.4" />
      <path d="M2 17 C2 17 5 20 8 19.5 L13.5 19.5 C15.5 19.5 17 18 17 16 L13.5 12.5" stroke={col} strokeWidth="1.4" />
      <path d="M22 17 L17 12 L13.5 12" stroke={col} strokeWidth="1.4" />
      <path d="M22 17 C22 17 19 20 16 19.5" stroke={col} strokeWidth="1.4" />
    </svg>
  );
}
function IcoProductionPlan({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="1.5" stroke={col} strokeWidth="1.4" />
      <path d="M9 4 L9 2 L15 2 L15 4" stroke={col} strokeWidth="1.3" />
      <line x1="7"  y1="19" x2="7"  y2="13" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="9"  stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="19" x2="17" y2="15" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="5"  y1="19" x2="19" y2="19" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}

function Lotus({ sz = 28, col = T.crimson }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 32 32" fill="none">
      <path d="M16 3C16 3 10 9 10 15C10 18.31 12.69 21 16 21C19.31 21 22 18.31 22 15C22 9 16 3 16 3Z" fill={col} opacity=".9" />
      <path d="M16 21C16 21 7 15 3 18C3 18 6 26 16 28C26 26 29 18 29 18C25 15 16 21 16 21Z" fill={col} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARTS — with entrance animations
// ═══════════════════════════════════════════════════════════════════════════════
function Donut({ pct = 72, size }: { pct?: number; size?: number | string }) {
  const r = 62, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true });

  // Custom size style
  const svgStyle: React.CSSProperties = size 
    ? { width: size, height: size } 
    : { width: "100%", height: "100%", maxWidth: 250, maxHeight: 250 };

  return (
    <div ref={wrapRef} style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 160 160" style={svgStyle}>
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={T.royalBurgundy} />
            <stop offset="100%" stopColor={T.antiqueGold} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={T.royalBurgundy} floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer decorative dashed ring */}
        <circle cx={cx} cy={cy} r={74} fill="none" stroke="rgba(110,15,45,0.08)" strokeWidth="1" strokeDasharray="3 4" />
        
        {/* Inner decorative fine ring */}
        <circle cx={cx} cy={cy} r={50} fill="none" stroke="rgba(110,15,45,0.04)" strokeWidth="1" />

        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(110,15,45,0.06)" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(200,155,71,0.10)" strokeWidth="13" />

        {/* Active progress track */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth={13}
          strokeLinecap="round"
          filter="url(#shadow)"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={inView ? { strokeDasharray: `${filled} ${circ - filled}` } : undefined}
          transition={{ duration: 1.8, delay: 0.35, ease: EASE }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* Animated glowing tip dot */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={inView ? { rotate: -90 + (pct / 100) * 360 } : undefined}
          transition={{ duration: 1.8, delay: 0.35, ease: EASE }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Outer glowing halo */}
          <circle cx={cx} cy={cy - r} r="8.5" fill={T.antiqueGold} opacity="0.6" filter="url(#glow)" />
          {/* Inner solid dot */}
          <circle cx={cx} cy={cy - r} r="4.5" fill="#FFFDF9" stroke={T.royalBurgundy} strokeWidth="2.5" />
        </motion.g>

        {/* Center Typography */}
        <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="central"
          fontFamily={F.display} fontWeight="800" fontSize="42" fill={T.royalBurgundy}
          style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>
          {pct}%
        </text>
        <text x={cx} y={cy + 19} textAnchor="middle" dominantBaseline="central"
          fontFamily={F.ui} fontWeight="700" fontSize="8.5" fill={T.taupe} letterSpacing="1.5">
          IN PROGRESS
        </text>
      </svg>
    </div>
  );
}

const BARS = [
  { w: "W1", p: 155, d: 90  },
  { w: "W2", p: 225, d: 185 },
  { w: "W3", p: 265, d: 200 },
  { w: "W4", p: 210, d: 160 },
];

function BarChart() {
  const W = 380, H = 148, PB = 26, PT = 10, PL = 30;
  const iW = W - PL, iH = H - PB - PT;
  const maxV = 300;
  const yTicks = [0, 100, 200, 300];
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "-40px 0px" });
  return (
    <div ref={wrapRef}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={T.royalBurgundy} />
            <stop offset="100%" stopColor={DARK_MAROON} />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={T.goldLight} />
            <stop offset="100%" stopColor={T.antiqueGold} />
          </linearGradient>
        </defs>
        {yTicks.map(v => {
          const y = PT + iH * (1 - v / maxV);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
              <text x={PL - 5} y={y + 3.5} textAnchor="end"
                fontFamily={F.ui} fontSize={8.5} fontWeight="500" fill={T.taupe}
                style={{ fontVariantNumeric: "tabular-nums" }}>{v}</text>
            </g>
          );
        })}
        {BARS.map((d, i) => {
          const gW = iW / BARS.length;
          const gx = PL + i * gW + gW / 2;
          const bW = 14, gap = 5;
          const baseY = PT + iH;
          const h1 = (d.p / maxV) * iH;
          const h2 = (d.d / maxV) * iH;
          return (
            <g key={`g${i}`}>
              <motion.rect
                x={gx - bW - gap / 2} width={bW} rx={5} fill="url(#barGrad1)"
                initial={{ y: baseY, height: 0 }}
                animate={inView ? { y: baseY - h1, height: h1 } : undefined}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: EASE }}
              />
              <motion.rect
                x={gx + gap / 2} width={bW} rx={5} fill="url(#barGrad2)"
                initial={{ y: baseY, height: 0 }}
                animate={inView ? { y: baseY - h2, height: h2 } : undefined}
                transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: EASE }}
              />
              <text x={gx} y={H - 6} textAnchor="middle"
                fontFamily={F.ui} fontSize={9} fontWeight="500" fill={T.taupe}>{d.w}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════════════════════
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED DATA
// ═══════════════════════════════════════════════════════════════════════════════
function Label({ col, children, sz = 10, spacing = "2.5px" }: { col?: string; children: React.ReactNode; sz?: number; spacing?: string }) {
  return (
    <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: sz, color: col ?? T.taupe, letterSpacing: spacing, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function Body({ col, children, s = 14 }: { col?: string; children: React.ReactNode; s?: number }) {
  return (
    <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: s, color: col ?? T.burgundy, lineHeight: 1.75 }}>
      {children}
    </span>
  );
}

function SectionHeader({ title, actionText = "View All →", small, onAction }: {
  title: string; action?: string; actionText?: string; small?: boolean; onAction?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: EASE }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: small ? 18 : 32 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          style={{ width: 3, height: small ? 18 : 22, borderRadius: 2, background: G.gold, flexShrink: 0, transformOrigin: "top" }}
        />
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: small ? 22 : 30, color: T.luxuryBrown, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
          {title}
        </span>
      </div>
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.04, backgroundColor: "rgba(110,15,45,0.06)", x: onAction ? 0 : 3 }}
        whileTap={onAction ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.18 }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.royalBurgundy,
          cursor: onAction ? "pointer" : "default",
          padding: "7px 16px", borderRadius: 10,
          border: `1px solid ${onAction ? "rgba(110,15,45,0.16)" : "transparent"}`,
          background: onAction ? "rgba(110,15,45,0.04)" : "rgba(0,0,0,0)",
          letterSpacing: "0.1px",
        }}
      >
        {actionText}
      </motion.button>
    </motion.div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.92, filter: "blur(8px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.07)" }}
      animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.07)" } : undefined}
      whileHover={{ y: -7, scale: 1.008, boxShadow: "0px 32px 80px rgba(74,6,27,0.16)" }}
      transition={{
        type: "spring", stiffness: 240, damping: 22,
        opacity: { duration: 0.5 },
        filter: { duration: 0.55 },
      }}
      style={{
        background: T.warmIvory, borderRadius: 28, border: `1px solid ${T.borderDef}`,
        boxShadow: "0px 10px 40px rgba(74,6,27,0.07)", ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — TOP NAV (grouped)
// ═══════════════════════════════════════════════════════════════════════════════
type NavPage  = { key: string; label: string };
type NavGroup = { key: string; label: string; icon: React.ComponentType<{ size?: number; color?: string }>; pages: NavPage[] };


export { FadeUp, FadeIn, AnimatedBar, AnimatedNumber, IcoRawMaterial, IcoYarnInventory, IcoFabricRoll, IcoQualityCheck, IcoTruck, IcoInvoice, IcoResourceMgmt, IcoWarehouse, IcoHandshake, IcoProductionPlan, Lotus, Donut, BarChart, Label, Body, SectionHeader, Card };
