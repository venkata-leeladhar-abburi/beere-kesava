import React, { useState } from "react";
import { Plus } from "lucide-react";
import { C, F } from "../tokens";
import { FieldLabel } from "./shared";
import { Button, NumberInput } from "../../../../../shared/ui/primitives";

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
          <div key={c.name} style={{ width: swatchSize, height: swatchSize, flexShrink: 0, ["--swatch-hex" as string]: c.hex } as React.CSSProperties}>
            <Button aria-label={c.name} title={c.name} variant="tertiary" onClick={() => toggle(c.name)}
              className={`w-full h-full rounded-full p-0 shadow-[0_1px_4px_rgba(0,0,0,0.15)] bg-[var(--swatch-hex)] hover:bg-[var(--swatch-hex)] ${selected.includes(c.name) ? "border-[3px] border-[#1A0A0F]" : "border-[3px] border-transparent"}`} />
          </div>
        ))}
      </div>
      {selected.map(cl => (
        <div key={cl} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors.find(c => c.name === cl)?.hex, flexShrink: 0 }} />
          <span style={{ fontFamily: F.u, fontSize: compact ? 10 : 12, color: C.muted, flexShrink: 0, width: compact ? 36 : 48 }}>{cl}:</span>
          <div style={{ position: "relative", flex: 1 }}>
            <NumberInput value={qty[cl] ? Number(qty[cl]) : ""} onValueChange={v => setQty(p => ({ ...p, [cl]: v === "" ? "" : String(v) }))} step={0.01} placeholder="0"
              size={compact ? "sm" : "md"} className="font-mono pr-8" />
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 12, color: C.muted }}>kg</span>
          </div>
        </div>
      ))}
      <Button variant="secondary" size="sm" iconLeft={Plus}
        className={`rounded-lg border-dashed border-[rgba(196,146,58,0.40)] text-[#C4923A] ${compact ? "text-[10px] px-2 py-1" : "text-xs px-3 py-1.5"}`}>
        Add Color
      </Button>
    </div>
  );
}
