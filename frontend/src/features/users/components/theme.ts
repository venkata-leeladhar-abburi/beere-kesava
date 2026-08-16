// ─── Users feature — shared design tokens ─────────────────────────────────────
import React from "react";

import { brand, fonts, semantic } from '@/design-system/tokens';
export const T = {
  silkCream:     semantic.surface.canvas,
  warmIvory:     semantic.surface.raised,
  royalBurgundy: brand.burgundy[900],
  deepWine:      brand.burgundy[950],
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   brand.gold[500],
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         semantic.text.tertiary,
  green:         semantic.text.success,
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       semantic.text.danger,
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
  bgGold:        "rgba(200,155,71,0.10)",
  cream:         "#F0E8D0",
  blue:          "#2C4A8B",
};

export const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${T.borderDef}`,
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
  overflow: "hidden",
};

export const inputStyle: React.CSSProperties = {
  background: "#FFF8F0",
  border: `1px solid rgba(110,15,45,0.18)`,
  borderRadius: 10,
  padding: "10px 14px",
  fontFamily: F.ui,
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  color: T.luxuryBrown,
  transition: "border-color 0.15s",
};

export const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 12,
  fontWeight: 600,
  color: T.taupe,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  marginBottom: 6,
  display: "block",
};

export const ROLE_TO_PORTAL: Record<string, string> = {
  "Admin":            "Admin Portal — Full Access",
  "Worker Staff":     "Worker Staff Portal",
  "Finishing Staff":  "Finishing Staff (No Portal)",
  "Weaver":           "Weaver Portal",
  "Shop Staff":       "Shop Staff Portal",
  "Accountant":       "Accountant Portal",
};

export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Admin":           { bg: "rgba(110,15,45,0.09)",    text: "#6E0F2D",   border: "rgba(110,15,45,0.15)"   },
  "Worker Staff":    { bg: "rgba(30,102,64,0.09)",    text: "#1E6640",   border: "rgba(30,102,64,0.15)"   },
  "Finishing Staff": { bg: "rgba(44,74,139,0.09)",    text: "#2C4A8B",   border: "rgba(44,74,139,0.15)"   },
  "Weaver":          { bg: "rgba(200,155,71,0.14)",   text: "#7A5E1C",   border: "rgba(200,155,71,0.22)"  },
  "Shop Staff":      { bg: "rgba(59,35,20,0.08)",     text: "#3B2314",   border: "rgba(59,35,20,0.14)"    },
  "Accountant":      { bg: "rgba(30,102,64,0.11)",    text: "#0F5C3F",   border: "rgba(30,102,64,0.20)"   },
};

export const ROLES = ["Admin", "Worker Staff", "Finishing Staff", "Shop Staff", "Accountant"];

export const ACCESS_LEVELS = ["Full Access", "Semi Access"] as const;
export type AccessLevel = typeof ACCESS_LEVELS[number];

export const ACCESS_LEVEL_META: Record<AccessLevel, { color: string; bg: string; border: string; desc: string }> = {
  "Full Access": { color: T.green,   bg: T.greenBg,             border: "rgba(30,102,64,0.18)",  desc: "Complete control — users, finance, settings, every portal section." },
  "Semi Access": { color: "#8B6018", bg: "rgba(200,155,71,0.14)", border: "rgba(200,155,71,0.28)", desc: "Restricted — day-to-day operations only. No user management or finance." },
};

export function FieldFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = T.royalBurgundy;
}
export function FieldBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = "rgba(110,15,45,0.18)";
}
