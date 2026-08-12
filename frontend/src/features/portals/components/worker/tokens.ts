import type { CSSProperties } from "react";
import { brand, fonts, semantic } from "@/design-system/tokens";

/**
 * Worker Staff portal tokens.
 *
 * These used to be a standalone palette (`#6B1A2A` burgundy, Plus Jakarta Sans
 * display, JetBrains Mono, 14px radii) which drifted visibly from the admin
 * dashboard. They are now a thin re-export of the shared design system — the
 * same safe pattern Phase 1 used for the other 21 local theme files — so the
 * two portals render as one product. Key names are unchanged so no call site
 * had to move.
 */
export const C = {
  bg:    semantic.surface.canvas,     // #FAF8F6 — admin page canvas
  burg:  brand.burgundy[900],         // #6E0F2D — brand primary (was #6B1A2A)
  dark:  "#3D0E1A",                   // admin topnav / hero ground
  wine:  brand.burgundy[950],         // #4A061B
  gold:  brand.gold[500],             // #C89B47 — decoration only
  goldL: "#E7C983",
  green: semantic.text.success,
  crim:  semantic.text.danger,
  text:  semantic.text.primary,
  muted: semantic.text.tertiary,      // #69635E — 5.92:1
  bdr:   "rgba(110,15,45,0.10)",      // admin borderDef
  bdrMed:"rgba(110,15,45,0.20)",      // admin borderMed
  cream: "#F5E8D0",                   // admin warmCream
  ivory: "#FFFDF9",                   // admin pureWhite
  inp:   semantic.surface.raised,
};

/** Admin's three font roles: Fraunces display, Inter UI, IBM Plex Mono code. */
export const F = {
  d: fonts.display,
  u: fonts.ui,
  m: fonts.code,
};

/** Admin's gradient set (beere-dashboard/theme.tsx `G`), verbatim. */
export const G = {
  hero:   "linear-gradient(135deg, #4A061B 0%, #6E0F2D 45%, #C89B47 100%)",
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  header: `linear-gradient(100deg, ${brand.burgundy[950]} 0%, ${brand.burgundy[900]} 100%)`,
};

/** Card chrome matching admin's SectionCard body (radius 20, soft wine shadow). */
export const card: CSSProperties = {
  background: semantic.surface.raised,
  border: `1px solid ${C.bdr}`,
  borderRadius: 20,
  boxShadow: "0 6px 32px rgba(74,6,27,0.08)",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  height: 52,
  background: semantic.surface.raised,
  border: `1px solid ${C.bdrMed}`,
  borderRadius: 12,
  padding: "0 14px",
  fontFamily: fonts.ui,
  fontSize: 14,
  color: semantic.text.primary,
  outline: "none",
  boxSizing: "border-box" as const,
};

export const btnPrimary: CSSProperties = {
  width: "100%",
  height: 52,
  background: C.burg,
  border: "none",
  borderRadius: 999,
  fontFamily: fonts.ui,
  fontWeight: 600,
  fontSize: 14,
  color: "#FFF",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export const btnGhost: CSSProperties = {
  width: "100%",
  height: 52,
  background: "transparent",
  border: `1px solid ${C.bdrMed}`,
  borderRadius: 999,
  fontFamily: fonts.ui,
  fontWeight: 600,
  fontSize: 14,
  color: C.burg,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
