import React from "react";

import { brand, fonts, semantic } from '@/design-system/tokens';
// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
export const T = {
  silkCream: semantic.surface.canvas, warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
  deepWine: brand.burgundy[950], darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314", warmCream: "#F5E8D0",
  taupe: semantic.text.tertiary, green: "#1E6640", crimson: "#C0392B",
  borderDef: "rgba(110,15,45,0.10)", borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};
export const F = {
  display: fonts.display,
  ui: fonts.ui,
  mono: fonts.code,
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STYLE HELPERS
// ═══════════════════════════════════════════════════════════════════════════
export const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${T.borderDef}`,
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
  overflow: "hidden",
};

export const inputStyle: React.CSSProperties = {
  background: "#FFF8F0",
  border: "1px solid rgba(110,15,45,0.18)",
  borderRadius: 8,
  padding: "8px 12px",
  fontFamily: F.ui,
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  color: T.luxuryBrown,
};

export const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 12,
  fontWeight: 600,
  color: T.taupe,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  marginBottom: 5,
  display: "block",
};

export const thStyle: React.CSSProperties = {
  fontFamily: F.mono,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase" as const,
  color: T.taupe,
  padding: "11px 16px",
  textAlign: "left" as const,
  borderBottom: `1px solid ${T.borderDef}`,
  background: "#FAFAF8",
  whiteSpace: "nowrap" as const,
};

export const tdStyle: React.CSSProperties = {
  padding: "13px 16px",
  fontFamily: F.ui,
  fontSize: 13,
  color: T.luxuryBrown,
  borderBottom: `1px solid rgba(110,15,45,0.06)`,
  verticalAlign: "middle" as const,
};
