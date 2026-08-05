import React from "react";
import { F, T } from "./theme";
import { Button } from "../../../../shared/ui/primitives";

// ── Shared small UI helpers ───────────────────────────────────────────────────
export function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 10 }}>{label}</div>;
}

export function PillTab({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
      {options.map(opt => (
        <Button
          key={opt}
          variant={value === opt ? "primary" : "secondary"}
          size="sm"
          onClick={() => onChange(opt)}
          className="rounded-full"
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}

export function ColorSwatchPicker({ colors, value, onChange }: { colors: { name: string; hex: string }[]; value: string; onChange: (v: string) => void }) {
  // Dynamic per-item hex colors can't be expressed with Button's className-only
  // styling API (Button omits the `style` prop), so this stays a raw <button>
  // that renders a plain color circle — intentional exception.
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
      {colors.map(c => (
        <button key={c.name} type="button" title={c.name} onClick={() => onChange(c.name)} style={{
          width: 32, height: 32, borderRadius: "50%", background: c.hex, cursor: "pointer",
          border: value === c.name ? `3px solid ${T.luxuryBrown}` : "3px solid transparent",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)", flexShrink: 0,
        }} />
      ))}
      {value && <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, alignSelf: "center", marginLeft: 4 }}>{value}</span>}
    </div>
  );
}
