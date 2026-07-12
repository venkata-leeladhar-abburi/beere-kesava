/**
 * Beere Kesava ERP — Design Token System
 * ═══════════════════════════════════════════════════════════════════════════════
 * Single source of truth for all design tokens.
 * Import from here in every page, layout, and component.
 * NEVER re-declare these inline.
 */

import type { CSSProperties } from "react";

// ── Color Palette ──────────────────────────────────────────────────────────────
export const T = {
  // Brand — Burgundy family
  royalBurgundy:  "#6E0F2D",
  darkBurgundy:   "#3D0E1A",
  deepWine:       "#4A061B",
  darkBg:         "#3D0E1A",
  mahogany:       "#4A061B",
  burgundyCard:   "#3D2030",

  // Brand — Gold family
  antiqueGold:    "#C89B47",
  goldLight:      "#E7C983",
  gold:           "#C89B47",
  saGold:         "#C4923A",  // slightly deeper, used in superadmin

  // Neutrals
  silkCream:      "#F7F2EA",
  warmIvory:      "#FFFDF9",
  ivoryCream:     "#F7F2EA",
  pureWhite:      "#FFFDF9",
  warmCream:      "#F5E8D0",
  luxuryBrown:    "#3B2314",
  deepBlack:      "#3B2314",
  taupe:          "#8B7060",

  // Semantic
  green:          "#1E6640",
  crimson:        "#C0392B",
  teal:           "#008080",
  amber:          "#7B3F00",

  // Borders
  borderDef:      "rgba(110,15,45,0.10)",
  borderMed:      "rgba(110,15,45,0.20)",
  borderStrong:   "rgba(110,15,45,0.30)",
  borderGold:     "rgba(200,155,71,0.22)",
  borderGoldMed:  "rgba(200,155,71,0.30)",

  // Backgrounds (semantic)
  bgSuccess:      "rgba(30,102,64,0.10)",
  bgWarning:      "rgba(110,15,45,0.10)",
  bgAlert:        "rgba(110,15,45,0.18)",
  bgGold:         "rgba(200,155,71,0.15)",

  // Input
  inputBg:        "#FFF8E7",
} as const;

// ── Typography ─────────────────────────────────────────────────────────────────
export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
} as const;

// ── Gradients ──────────────────────────────────────────────────────────────────
export const G = {
  hero:   "linear-gradient(135deg, #4A061B 0%, #6E0F2D 45%, #C89B47 100%)",
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  dark:   "linear-gradient(135deg, #3D0E1A 0%, #4A061B 100%)",
} as const;

// ── Animation ─────────────────────────────────────────────────────────────────
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Tabular numerics (apply to financial/metric values) ───────────────────────
export const NUM: CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

// ── Layout constants (navbar heights, shared across portals) ──────────────────
export const NAV = {
  mainH:         90,   // top navbar height (desktop)
  subH:          66,   // sub-nav / breadcrumb bar
  sectionH:      56,   // section jump bar
  mobileH:       60,   // mobile header

  workerMobileH: 56,
  workerTopH:    72,
  workerSectionH:52,

  shopMobileH:   56,
  shopSectionH:  52,
} as const;

// ── Reusable inline style presets ─────────────────────────────────────────────
export const CARD: CSSProperties = {
  background:   "#FFFFFF",
  border:       `1px solid rgba(110,15,45,0.10)`,
  borderRadius: 14,
  boxShadow:    "0 2px 10px rgba(107,26,42,0.06)",
};

export const INPUT: CSSProperties = {
  width:        "100%",
  height:       52,
  background:   "#FFF8E7",
  border:       `1px solid rgba(139,26,46,0.20)`,
  borderRadius: 12,
  padding:      "0 14px",
  fontFamily:   "'Inter', sans-serif",
  fontSize:     14,
  color:        "#1A0A0F",
  outline:      "none",
  boxSizing:    "border-box" as const,
};

export const BTN_PRIMARY: CSSProperties = {
  height:          52,
  background:      "#6E0F2D",
  border:          "none",
  borderRadius:    999,
  fontFamily:      "'Inter', sans-serif",
  fontWeight:      600,
  fontSize:        15,
  color:           "#FFF",
  cursor:          "pointer",
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "center",
  gap:             8,
};

export const BTN_GHOST: CSSProperties = {
  height:          52,
  background:      "transparent",
  border:          `1px solid rgba(110,15,45,0.30)`,
  borderRadius:    999,
  fontFamily:      "'Inter', sans-serif",
  fontWeight:      600,
  fontSize:        15,
  color:           "#6E0F2D",
  cursor:          "pointer",
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "center",
  gap:             8,
};

// ── Role-based portal colors ───────────────────────────────────────────────────
export const ROLE_COLORS = {
  admin:      { accent: "#6E0F2D", lightBg: "rgba(110,15,45,0.07)",   border: "rgba(110,15,45,0.18)"  },
  superadmin: { accent: "#C89B47", lightBg: "rgba(200,155,71,0.10)",  border: "rgba(200,155,71,0.30)" },
  worker:     { accent: "#1E6640", lightBg: "rgba(30,102,64,0.08)",   border: "rgba(30,102,64,0.22)"  },
  weaver:     { accent: "#7B3F00", lightBg: "rgba(123,63,0,0.08)",    border: "rgba(123,63,0,0.22)"   },
  shop:       { accent: "#008080", lightBg: "rgba(0,128,128,0.08)",   border: "rgba(0,128,128,0.22)"  },
} as const;

export type RoleKey = keyof typeof ROLE_COLORS;
