import React from "react";
import type { LucideIcon } from "lucide-react";
import { F, T } from "./theme";
import { Button } from "../../../../shared/ui/primitives";

// ── Shared small UI helpers ───────────────────────────────────────────────────
export function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 10 }}>{label}</div>;
}

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// rest of the app.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
    </div>
  );
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
