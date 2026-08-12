import React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { brand, fonts, semantic } from "@/design-system/tokens";

/**
 * Shared staff-portal chrome, mirroring the admin dashboard's own primitives
 * so both portals read as one product:
 *
 *   PageHero      ← features/production/.../PageHeaderAndStats.tsx `PageHeader`
 *   StatsStrip    ← the same file's `StatsStrip`
 *   SectionCard   ← features/dashboards/.../beere-dashboard/primitives.tsx
 *   SectionHeading← the gold-rule + serif heading used across admin sections
 *
 * Hero/metric display type uses the design-system display face (Fraunces).
 * The admin originals ask for 'DM Serif Display', but Phase 1 retired that
 * family and styles/fonts.css no longer loads it — those call sites are silently
 * falling back to generic serif today, so matching the token is both correct and
 * closer to what admin actually renders.
 */
const F = { d: fonts.display, u: fonts.ui, m: fonts.code };
const C = {
  gold:  brand.gold[500],
  goldL: "#E7C983",
  wine:  brand.burgundy[950],
  cream: "#F5E8D0",
  muted: semantic.text.tertiary,
  bdr:   "rgba(110,15,45,0.10)",
};
const G = {
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
  header: `linear-gradient(100deg, ${brand.burgundy[950]} 0%, ${brand.burgundy[900]} 100%)`,
};

export const HERO_SERIF = F.d;

/** Admin gutter geometry — 48px page inset, 40px section rhythm. */
export const GUTTER_X = 48;
export const GUTTER_X_TABLET = 24;

export function PageHero({
  eyebrow,
  title,
  titleAccent,
  description,
  image,
  minHeight = 340,
  actions,
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description?: string;
  image?: string;
  minHeight?: number;
  actions?: React.ReactNode;
}) {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight, display: "flex", alignItems: "center" }}>
      {/* Loom-grid texture + gold glow, matching the admin hero ground */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.022) 60px, rgba(200,155,71,0.022) 61px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.015) 80px, rgba(200,155,71,0.015) 81px)" }} />
      {!image && (
        <div style={{ position: "absolute", right: -120, top: "50%", transform: "translateY(-50%)", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,155,71,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      )}

      <div style={{ position: "relative", zIndex: 2, padding: `48px 0 90px ${GUTTER_X}px`, flex: image ? "0 0 65%" : "1", maxWidth: image ? "65%" : "100%" }}>
        <div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          {eyebrow}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: HERO_SERIF, fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>{title}</h1>
          {titleAccent && (
            <span style={{ fontFamily: HERO_SERIF, fontSize: 36, fontStyle: "italic", color: C.gold, fontWeight: 400 }}>{titleAccent}</span>
          )}
        </div>
        {description && (
          <p style={{ fontFamily: F.u, fontSize: 18, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 620, lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        {actions && <div style={{ display: "flex", gap: 12, alignItems: "center" }}>{actions}</div>}
      </div>

      {image && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)" }} />
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      )}
    </header>
  );
}

export type WorkerStat = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  /** Gold-washed cell — reserve for the single most important metric. */
  highlight?: boolean;
  /** Renders the numeral in the alert coral (use when the count needs action). */
  alert?: boolean;
};

/**
 * The dark burgundy metric strip. Pass `overlap` when it sits directly under a
 * PageHero so it lifts into the hero the way admin's does.
 */
export function StatsStrip({
  stats,
  overlap = true,
  gutter = GUTTER_X,
}: {
  stats: WorkerStat[];
  overlap?: boolean;
  gutter?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{ padding: `0 ${gutter}px`, marginTop: overlap ? -72 : 0, position: "relative", zIndex: 20 }}
    >
      {/* The admin shell injects these keyframes via its own GLOBAL_STYLE; the
          worker portal never mounts that, so carry them with the component. */}
      <style>{`
        @keyframes bk-gold-shimmer { 0% { background-position: -300% center; } 100% { background-position: 300% center; } }
        .gold-bar-shimmer {
          background: linear-gradient(90deg,#C89B47 0%,#E7C983 30%,#FFFDF9 50%,#E7C983 70%,#C89B47 100%);
          background-size: 300%; animation: bk-gold-shimmer 3s linear infinite; opacity: 0.72;
        }
        @media (prefers-reduced-motion: reduce) { .gold-bar-shimmer { animation: none; } }
      `}</style>
      <div style={{ background: G.card, borderRadius: 28, display: "flex", alignItems: "stretch", flexWrap: "wrap", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {stats.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
              whileHover={{ backgroundColor: m.highlight ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: "1 1 200px", padding: "28px 22px",
                backgroundImage: m.highlight ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < stats.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative",
              }}
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: 3 }}
                transition={{ duration: 0.25 }}
                style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.highlight ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.highlight ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon size={22} color={C.cream} />
              </motion.div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.highlight ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: HERO_SERIF, fontWeight: 400, fontSize: 48, letterSpacing: "-0.01em", color: m.alert ? "#F47B72" : m.highlight ? C.goldL : "#FFFFFF", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                  {m.value}
                </div>
                {m.sub && (
                  <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: m.highlight ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                    {m.sub}
                  </span>
                )}
              </div>
              {m.highlight && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: G.gold }} />}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/** Admin's banner card: dark maroon gradient header over a white padded body. */
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
  bodyPadding = "24px 28px 28px",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  bodyPadding?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${C.bdr}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: G.header, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
      </div>
      <div style={{ padding: bodyPadding }}>{children}</div>
    </div>
  );
}

/** Gold-rule + serif heading, the admin in-page section marker. */
export function SectionHeading({
  title,
  subtitle,
  right,
  size = "md",
  id,
  accent = C.gold,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  id?: string;
  accent?: string;
}) {
  const fontSize = size === "lg" ? 24 : size === "md" ? 20 : 17;
  const ruleH = size === "lg" ? 26 : size === "md" ? 22 : 18;
  return (
    <div id={id} style={{ marginBottom: subtitle ? 16 : 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: ruleH, background: accent, borderRadius: 2, flexShrink: 0 }} />
          <h2 style={{ fontFamily: F.d, fontSize, fontWeight: 600, color: C.wine, margin: 0, letterSpacing: "-0.015em" }}>{title}</h2>
        </div>
        {right}
      </div>
      {subtitle && (
        <p style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "6px 0 0 16px", lineHeight: 1.5 }}>{subtitle}</p>
      )}
    </div>
  );
}
