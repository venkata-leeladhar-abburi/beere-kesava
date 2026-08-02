import React from "react";

// ── Design tokens (matches Admin portal) ──────────────────────────────────────
export const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
  bgGold:        "rgba(200,155,71,0.10)",
};
export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
export const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1];

export const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${T.borderDef}`,
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
};

export const inp: React.CSSProperties = {
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
};
