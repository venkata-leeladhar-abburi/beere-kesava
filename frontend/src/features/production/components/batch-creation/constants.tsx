import React from "react";
import type { SareeRow } from "../../contexts/BatchContext";
import { toInitials } from "@/shared/lib/initials";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#69635E",
  green:         "#1E6640",
  red:           "#C0392B",
  amber:         "#B7791F",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
export const G = {
  button:  "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  header:  "linear-gradient(135deg, #3D0E1A 0%, #4A061B 60%, #6E0F2D 100%)",
  green:   "linear-gradient(135deg, #1E6640 0%, #145230 100%)",
};

// ─── Weavers ──────────────────────────────────────────────────────────────────
export const WEAVERS = [
  { id: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", name: "Ravi Kumar",   initials: "RK", loom: 2, bg: "#6E0F2D" },
  { id: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", name: "Padma Veni",   initials: "PV", loom: 1, bg: "#C4923A" },
  { id: "a1bb101d-f0ee-4f65-b2f7-a7a86c24129f", name: "Suresh Murti", initials: "SM", loom: 2, bg: "#69635E" },
  { id: "71413724-378d-4336-93dd-1db33cba3510", name: "Anand K.",     initials: "AK", loom: 1, bg: "#4A061B" },
  { id: "95cc89ea-6cf3-418c-bf9b-299e59f47389", name: "Meena R.",     initials: "MR", loom: 3, bg: "#A05080" },
  { id: "d3fd5a81-7d3a-478d-9a0f-d65a5db6779a", name: "Lakshmi D.",   initials: "LD", loom: 1, bg: "#C4923A" },
  { id: "c7d8e833-dcd7-4a52-a867-f77d8ca2e1cf", name: "Venkat Rao",   initials: "VR", loom: 1, bg: "#1E6640" },
  { id: "51490482-11cf-425b-8d54-7bd918f6db18", name: "Kamala B.",    initials: "KB", loom: 1, bg: "#3D0E1A" },
];

// ─── Helper: field style ──────────────────────────────────────────────────────
export const fld: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
  background: T.warmIvory, border: `1.5px solid ${T.borderDef}`,
  borderRadius: 10, outline: "none", boxSizing: "border-box",
};
export const lbl: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12, fontWeight: 700,
  color: T.luxuryBrown, display: "block", marginBottom: 6,
};

export const th: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left", fontFamily: F.ui, fontSize: 12,
  fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px",
  borderBottom: `1px solid ${T.borderDef}`,
};
export const td: React.CSSProperties = {
  padding: "11px 14px", verticalAlign: "middle",
};

// ─── Row completeness ─────────────────────────────────────────────────────────
// designCode is optional (BatchSareeRow.designCode is a nullable FK) — a row
// is complete without one.
//
// sareeTypeCode is optional here too. What a weaver is *told* to make and what
// actually comes back can differ, and the type is confirmed (or corrected) at
// receipt — ReceiveSareesPage requires one before a saree can be saved, and
// BatchesService.receiveRow persists it onto the row. Forcing it up front made
// the batch un-finalizable for the common case where the type genuinely isn't
// known until the saree is in hand.
//
// A row still needs a recipient and a saree ID: the ID depends on the assigned
// loom, so this keeps the loom requirement the "Assign Loom No." flow relies on.
export function rowComplete(r: SareeRow) {
  return !!((r.weaverId || r.factoryLoomId) && r.sareeId);
}
export function rowEmpty(r: SareeRow) {
  return !r.weaverId && !r.factoryLoomId && !r.sareeTypeCode;
}

// ─── Pip avatar ───────────────────────────────────────────────────────────────
export function Pip({ initials, bg, size = 28 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.38, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>{toInitials(initials)}</span>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
export function EmptyCell() {
  return <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 13, fontFamily: F.ui }}>—</span>;
}
