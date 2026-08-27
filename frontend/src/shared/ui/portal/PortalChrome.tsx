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
  pills,
  actions,
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description?: string;
  image?: string;
  minHeight?: number;
  pills?: { text: string; color?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight, display: "flex", alignItems: "center" }}>
      {/* Loom-grid texture + gold glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.022) 60px, rgba(200,155,71,0.022) 61px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.015) 80px, rgba(200,155,71,0.015) 81px)" }} />
      {!image && (
        <div style={{ position: "absolute", right: -120, top: "50%", transform: "translateY(-50%)", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,155,71,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      )}

      <div className="px-4 md:px-7 xl:px-12 w-full xl:w-auto xl:basis-[65%] xl:max-w-[65%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 90 }}>
        <div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          {eyebrow}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: HERO_SERIF, fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>{title}</h1>
          {titleAccent && (
            <span style={{ fontFamily: HERO_SERIF, fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: C.gold, fontWeight: 400 }}>{titleAccent}</span>
          )}
        </div>
        {description && (
          <p className="max-w-[620px]" style={{ fontFamily: F.u, fontSize: "clamp(14px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: "0 0 16px", lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        {pills && pills.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: actions ? 16 : 0 }}>
            {pills.map((p) => (
              <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "4px 12px" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
              </div>
            ))}
          </div>
        )}
        {actions && <div style={{ display: "flex", gap: 12, alignItems: "center" }}>{actions}</div>}
      </div>

      {image && (
        <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
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
  /**
   * Makes the tile clickable — used to offer a retry when `value` is itself
   * showing a load-failure ("Error"). No visual change when unset: the tile
   * only gains a pointer cursor/hover once a handler is actually passed.
   */
  onClick?: () => void;
};

import { LuxuryStatsCard, type StatItem } from "@/shared/ui/LuxuryStatsCard";

/**
 * The dark burgundy metric strip. Pass `overlap` when it sits directly under a
 * PageHero so it lifts into the hero the way admin's does.
 */
export function StatsStrip({
  stats,
  overlap = true,
}: {
  stats: WorkerStat[];
  overlap?: boolean;
  gutter?: number;
}) {
  const statItems: StatItem[] = stats.map(s => {
    const Icon = s.icon;
    return {
      label: s.label.toUpperCase(),
      value: String(s.value),
      sub: s.sub,
      icon: <Icon size={22} color="#F5E8D0" />,
      highlight: !!s.highlight,
      crimson: !!s.alert,
      goldVal: !!s.highlight,
      onClick: s.onClick,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={`px-4 md:px-7 xl:px-12 ${overlap ? "-mt-8 md:-mt-12 xl:-mt-[72px]" : ""}`}
      style={{ position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}

/** Admin's banner card: dark maroon gradient header over a white padded body. */
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  backButton,
  children,
  id,
  bodyPadding,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  bodyPadding?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${C.bdr}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div className="p-4 sm:p-7" style={{ background: G.header }}>
        <div className="flex items-center gap-3.5 sm:gap-4 w-full">
          {backButton && (
            <div className="flex-shrink-0 mr-0.5 sm:mr-1">
              {backButton}
            </div>
          )}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">{actions}</div>}
          </div>
        </div>
      </div>
      <div className={bodyPadding ? undefined : "p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4"} style={bodyPadding ? { padding: bodyPadding } : undefined}>{children}</div>
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
