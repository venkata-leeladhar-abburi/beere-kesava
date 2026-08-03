import React from "react";
// ─── WeaverSareesSection — shared design tokens ───────────────────────────────


export const T = {
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  antiqueGold: "#C89B47",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  silkCream: "#F7F2EA",
  taupe: "#8B7060",
  crimson: "#C0392B",
  green: "#1E6640",
  orange: "#E67E22",
  blue: "#4A7FB5",
  purple: "#9B4DCA",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
};

export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const th: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase",
  letterSpacing: "0.8px", textAlign: "left", padding: "10px 12px",
  borderBottom: `1.5px solid ${T.borderDef}`, whiteSpace: "nowrap",
};
export const td: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, padding: "10px 12px",
  borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle", whiteSpace: "nowrap",
};
export const tdMono: React.CSSProperties = { ...td, fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy };
