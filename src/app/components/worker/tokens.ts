import type { CSSProperties } from "react";

export const C = {
  bg: "#FFFFFF",
  burg: "#6B1A2A",
  dark: "#3D0E1A",
  gold: "#C4923A",
  green: "#1E6640",
  crim: "#C0392B",
  text: "#1A0A0F",
  muted: "#8B7060",
  bdr: "rgba(139,26,46,0.12)",
  cream: "#F0E8D0",
  inp: "#FFF8E7",
};

export const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

export const card: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(139,26,46,0.12)",
  borderRadius: 14,
  boxShadow: "0 2px 10px rgba(107,26,42,0.06)",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  height: 52,
  background: "#FFF8E7",
  border: "1px solid rgba(139,26,46,0.20)",
  borderRadius: 12,
  padding: "0 14px",
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  color: "#1A0A0F",
  outline: "none",
  boxSizing: "border-box" as const,
};

export const btnPrimary: CSSProperties = {
  width: "100%",
  height: 52,
  background: "#6B1A2A",
  border: "none",
  borderRadius: 999,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  fontSize: 15,
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
  border: "1px solid rgba(139,26,46,0.30)",
  borderRadius: 999,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  fontSize: 15,
  color: "#6B1A2A",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
