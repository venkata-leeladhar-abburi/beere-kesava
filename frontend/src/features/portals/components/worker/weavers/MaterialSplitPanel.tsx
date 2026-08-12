import React, { useState } from "react";
import { C, F } from "../tokens";
import {
  jariFromReels, jariGrams, jariToReels, trimNum,
  type JariUnit, type SareeTypeRecord,
} from "../../../../pricing/components/RatesPricingPage";
import { useRatesPricing } from "../../../../pricing/contexts/RatesContext";
import { Button, Input } from "../../../../../shared/ui/primitives";

// ─── Material weight split (warp / resham / jari) ────────────────────────────
// Proportions come from the Rates & Pricing page: each saree type carries a
// standard weight plus its warp / resham / jari breakdown. The actual saree
// weight entered at receipt is scaled against that standard.
export type MatSplit = { warp: string; resham: string; jari: string };

export function autoMaterialSplit(
  typeCode: string | undefined, 
  weightStr: string,
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined
): (MatSplit & { factor: number; rate: SareeTypeRecord }) | null {
  const rate = typeCode ? getSareeTypeByCode(typeCode) : undefined;
  const weight = parseFloat(weightStr);
  const std = rate ? parseFloat(rate.stdWeight) : NaN;
  if (!rate || !weight || !std) return null;
  const f = weight / std;
  const g = (v: string) => ((parseFloat(v) || 0) * f).toFixed(0);
  return {
    rate, factor: f,
    warp: g(rate.warpWeight),
    resham: g(rate.reshamWeight),
    jari: (((parseFloat(rate.jariWeight) || 0) * f).toFixed(1)).replace(/\.0$/, ""),
  };
}

interface MaterialSplitPanelProps {
  typeCode?: string;
  weight: string;
  edits: Partial<MatSplit>;
  onEdit: (next: Partial<MatSplit>) => void;
}

export function MaterialSplitPanel({ typeCode, weight, edits, onEdit }: MaterialSplitPanelProps) {
  const { getSareeTypeByCode } = useRatesPricing();
  const [jariUnit, setJariUnit] = useState<JariUnit>("reels");
  const auto = autoMaterialSplit(typeCode, weight, getSareeTypeByCode);

  if (!auto) {
    return (
      <div style={{ background: "rgba(110,15,45,0.04)", border: `1px dashed ${C.bdr}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
        <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
          {typeCode && getSareeTypeByCode(typeCode)
            ? "Enter the saree weight to split it into warp, resham and jari."
            : "No rate card found for this saree type — material split unavailable."}
        </span>
      </div>
    );
  }

  const keys: (keyof MatSplit)[] = ["warp", "resham", "jari"];
  const val = (k: keyof MatSplit) => edits[k] ?? auto[k];
  const dirty = keys.some(k => edits[k] !== undefined && edits[k] !== auto[k]);
  const jariReels = parseFloat(val("jari")) || 0;
  const jariG = jariGrams(jariReels);
  const total = (parseFloat(val("warp")) || 0) + (parseFloat(val("resham")) || 0) + jariG;
  const diff = (parseFloat(weight) || 0) - total;

  return (
    <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text }}>Material Weights</span>
          <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "2px 6px" }}>
            {auto.rate.code} · std {auto.rate.stdWeight}g
          </span>
          <span style={{ fontFamily: F.u, fontSize: 12, color: dirty ? C.gold : C.green }}>
            {dirty ? "Edited manually" : `Auto · ×${auto.factor.toFixed(2)}`}
          </span>
        </div>
        {dirty && (
          <Button variant="link" onClick={() => onEdit({})} className="p-0 text-xs text-[#6E0F2D] underline">
            Reset to auto
          </Button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {([{ key: "warp", label: "Warp" }, { key: "resham", label: "Resham" }] as const).map(f => (
          <div key={f.key}>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              {f.label} (g)
            </div>
            <Input type="number" value={val(f.key)}
              onChange={e => onEdit({ ...edits, [f.key]: e.target.value })}
              className="font-mono px-2" />
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3 }}>auto {auto[f.key]}g</div>
          </div>
        ))}

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Jari ({jariUnit})
            </span>
            <div style={{ display: "flex", background: "rgba(110,15,45,0.06)", borderRadius: 999, padding: 2 }}>
              {(["reels", "buns"] as JariUnit[]).map(u => (
                <Button key={u} type="button" variant={jariUnit === u ? "primary" : "tertiary"} size="sm" onClick={() => setJariUnit(u)}
                  className={jariUnit === u ? "rounded-full capitalize bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-full capitalize"}>
                  {u}
                </Button>
              ))}
            </div>
          </div>
          <Input type="number" value={trimNum(jariFromReels(jariReels, jariUnit))}
            onChange={e => onEdit({ ...edits, jari: trimNum(jariToReels(parseFloat(e.target.value) || 0, jariUnit)) })}
            className="font-mono px-2" />
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3 }}>
            {trimNum(jariReels)} reels · {trimNum(jariFromReels(jariReels, "buns"))} buns · {trimNum(jariG, 0)}g
            <span style={{ marginLeft: 4 }}>· auto {auto.jari} reels</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontFamily: F.u, fontSize: 12, color: Math.abs(diff) > 5 ? C.gold : C.muted }}>
        Warp + Resham + Jari = {total.toFixed(0)}g of {parseFloat(weight) || 0}g saree weight
        {Math.abs(diff) > 5 ? ` · ${Math.abs(diff).toFixed(0)}g ${diff > 0 ? "unaccounted" : "over"}` : ""}
      </div>
    </div>
  );
}
