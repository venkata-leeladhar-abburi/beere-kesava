import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { F, T } from "../../theme";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

export function CashFlowTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "10px 14px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill || p.stroke }} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.name}:</span>
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(Number(p.value))} /></span>
        </div>
      ))}
    </div>
  );
}
