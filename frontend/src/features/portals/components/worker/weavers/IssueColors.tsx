import React, { useState } from "react";
import { Plus } from "lucide-react";
import { C, F, inputStyle } from "../tokens";
import { FieldLabel } from "./shared";

export function IssueColors({ label, compact }: { label: string; compact?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, string>>({});
  const colors = [
    { name: "Gold", hex: "#C4923A" }, { name: "Silver", hex: "#9E9E9E" },
    { name: "Copper", hex: "#B87333" }, { name: "Pink", hex: "#E91E8C" },
    { name: "Blue", hex: "#1565C0" }, { name: "Green", hex: "#1E6640" },
  ];
  const toggle = (name: string) => setSelected(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  const swatchSize = compact ? 24 : 28;
  return (
    <div>
      {!compact && <FieldLabel>{label} Colors</FieldLabel>}
      <div style={{ display: "flex", gap: compact ? 5 : 7, marginBottom: selected.length > 0 ? 8 : 4, flexWrap: "wrap" }}>
        {colors.map(c => (
          <button key={c.name} title={c.name} onClick={() => toggle(c.name)}
            style={{ width: swatchSize, height: swatchSize, borderRadius: "50%", background: c.hex, border: selected.includes(c.name) ? "3px solid #1A0A0F" : "3px solid transparent", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", flexShrink: 0 }} />
        ))}
      </div>
      {selected.map(cl => (
        <div key={cl} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors.find(c => c.name === cl)?.hex, flexShrink: 0 }} />
          <span style={{ fontFamily: F.u, fontSize: compact ? 10 : 12, color: C.muted, flexShrink: 0, width: compact ? 36 : 48 }}>{cl}:</span>
          <div style={{ position: "relative", flex: 1 }}>
            <input type="number" value={qty[cl] || ""} onChange={e => setQty(p => ({ ...p, [cl]: e.target.value }))} placeholder="0"
              style={{ ...inputStyle, height: compact ? 34 : 38, fontFamily: F.m, fontSize: compact ? 12 : 14, paddingRight: 30 }} />
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 12, color: C.muted }}>kg</span>
          </div>
        </div>
      ))}
      <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px dashed rgba(196,146,58,0.40)`, borderRadius: 7, padding: compact ? "4px 8px" : "6px 12px", fontFamily: F.u, fontSize: compact ? 10 : 12, color: C.gold, cursor: "pointer" }}>
        <Plus size={compact ? 10 : 12} /> Add Color
      </button>
    </div>
  );
}
