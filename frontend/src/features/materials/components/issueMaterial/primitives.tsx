import React from "react";
import { F, T } from "./theme";

// ── Shared small UI helpers ───────────────────────────────────────────────────
export function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 10 }}>{label}</div>;
}

export function PillTab({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: "8px 18px", borderRadius: 999, cursor: "pointer",
          border: `1.5px solid ${value === opt ? T.royalBurgundy : T.borderDef}`,
          background: value === opt ? T.royalBurgundy : "#FFF",
          color: value === opt ? "#FFF" : T.luxuryBrown,
          fontFamily: F.ui, fontSize: 13, fontWeight: 600,
        }}>{opt}</button>
      ))}
    </div>
  );
}

export function ColorSwatchPicker({ colors, value, onChange }: { colors: { name: string; hex: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
      {colors.map(c => (
        <button key={c.name} title={c.name} onClick={() => onChange(c.name)} style={{
          width: 32, height: 32, borderRadius: "50%", background: c.hex, cursor: "pointer",
          border: value === c.name ? `3px solid ${T.luxuryBrown}` : "3px solid transparent",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)", flexShrink: 0,
        }} />
      ))}
      {value && <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, alignSelf: "center", marginLeft: 4 }}>{value}</span>}
    </div>
  );
}
