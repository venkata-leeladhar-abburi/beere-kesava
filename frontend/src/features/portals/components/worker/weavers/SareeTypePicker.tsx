import { AlertTriangle } from "lucide-react";

import { C, F } from "../tokens";
import { useRatesPricing } from "@/features/pricing";
import { Button, Select, SelectItem } from "../../../../../shared/ui/primitives";

// ─── Saree type confirmation at receipt ──────────────────────────────────────
// The type assigned when the batch was created is what the weaver was ASKED to
// make; what actually comes back is not always that. It matters here because
// the type drives two things downstream — the warp/resham/jari split computed
// on this same screen (MaterialSplitPanel scales off the type's standard
// weight), and the making charge QC pays the weaver. Correcting it after QC
// means re-pricing a payment, so it is confirmed here instead.
//
// The picker is deliberately rendered ABOVE the weight field: the split can't
// be computed until a type is known, so choosing it second would show "no rate
// card" until the worker went back.
interface SareeTypePickerProps {
  /** The type currently on the batch row — the weaver's instruction. */
  assignedCode: string | undefined;
  /** The type to receive under; equals assignedCode until it's changed here. */
  value: string | undefined;
  onChange: (code: string) => void;
  /** How many sarees this receipt covers — one type applies to the whole selection. */
  count: number;
}

export function SareeTypePicker({ assignedCode, value, onChange, count }: SareeTypePickerProps) {
  const { rates } = useRatesPricing();
  // A row that never got a type at batch creation shows as "—" upstream; treat
  // that as "nothing assigned" so the placeholder prompts for a real choice.
  const assigned = assignedCode && assignedCode !== "—" ? assignedCode : undefined;
  const changed = !!value && !!assigned && value !== assigned;
  const missing = !value;

  return (
    <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text }}>
          Saree Type{count > 1 ? ` · applies to all ${count} selected` : ""}
        </span>
        {changed && (
          <Button variant="link" onClick={() => onChange(assigned)} className="p-0 text-xs text-[#6E0F2D] underline">
            Reset to {assigned}
          </Button>
        )}
      </div>

      <Select value={value ?? ""} onValueChange={onChange} placeholder="Select the saree type received">
        {rates.map(r => (
          <SelectItem key={r.code} value={r.code}>
            {r.code} · {r.type} ({r.stdWeight}g)
          </SelectItem>
        ))}
      </Select>

      {missing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
          <AlertTriangle size={11} color={C.crim} />
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim }}>
            Pick a type — QC can't price this saree without one.
          </span>
        </div>
      ) : changed ? (
        <div style={{ fontFamily: F.u, fontSize: 12, color: C.gold, marginTop: 6 }}>
          Changed from {assigned} — the material split and making charge follow this type.
        </div>
      ) : (
        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 6 }}>
          As assigned when the batch was created. Change it if a different type came back.
        </div>
      )}
    </div>
  );
}
