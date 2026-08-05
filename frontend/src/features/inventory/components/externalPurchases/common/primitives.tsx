import React from "react";
import { T, F } from "../theme";

export function Select({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        height: 44, padding: "0 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
        background: "#FFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, cursor: "pointer", outline: "none"
      }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    Paid: { color: "#1E6640", bg: "rgba(30,102,64,0.09)" },
    Pending: { color: "rgba(230,126,34,1)", bg: "rgba(230,126,34,0.12)" },
    Partial: { color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
  };
  const s = styles[status] || { color: T.taupe, bg: T.cream };
  return (
    <span
      style={{
        fontFamily: F.ui,
        fontWeight: 600,
        fontSize: 12,
        color: s.color,
        background: s.bg,
        borderRadius: 999,
        padding: "3px 10px",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: `1px solid ${T.borderDef}`,
  background: "#FFF8F0",
  fontFamily: F.ui,
  fontSize: 13,
  padding: "0 12px",
  color: T.luxuryBrown,
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontWeight: 600,
  fontSize: 12,
  color: T.luxuryBrown,
  display: "block",
  marginBottom: 6,
};
