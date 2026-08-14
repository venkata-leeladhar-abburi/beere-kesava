import React from "react";
import { PackageOpen } from "lucide-react";
import { WeaverOutstandingLine } from "../../contexts/MaterialReturnContext";
import { F, T } from "../issueMaterial/theme";
import { materialIcon } from "../issueMaterial/materialFormatters";
import { formatOutstandingGrams } from "./materialFormatters";

// Shows what's still with the selected weaver/loom (issued minus already-
// approved returns), computed server-side by MaterialReturnsService.getOutstanding.
// Purely informational — a soft reference for the admin, not a hard cap on
// what can be entered below (a weaver can legitimately return less than
// what's outstanding, or a return can be logged for stock reconciliation
// purposes even when the tallies don't line up).
export function OutstandingMaterialPanel({ loading, lines, recipientLabel }: {
  loading: boolean;
  lines: WeaverOutstandingLine[];
  recipientLabel: string;
}) {
  return (
    <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <PackageOpen size={16} color={T.royalBurgundy} />
        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>Outstanding Material with {recipientLabel}</div>
      </div>

      {loading ? (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>Loading outstanding balance…</div>
      ) : lines.length === 0 ? (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>
          No outstanding material — everything issued has already been returned or none has been issued yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {lines.map((line) => {
            const detail = line.materialType === "Warp"
              ? line.warpSubtype
              : line.materialType === "Jari"
                ? `${line.jariType ?? ""} ${line.jariGrade ?? ""} ${line.jariColor ?? ""}`.replace(/\s+/g, " ").trim()
                : line.jariColor;
            // WeaverOutstandingLine has no id — each line is already a unique
            // material variant (type + subtype/grade/color), so that
            // combination is a stable natural key.
            const lineKey = `${line.materialType}-${line.warpSubtype ?? ""}-${line.jariType ?? ""}-${line.jariGrade ?? ""}-${line.jariColor ?? ""}`;
            return (
              <div key={lineKey} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {materialIcon(line.materialType)}
                  <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{line.materialType}</span>
                  {detail && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{detail}</span>}
                </div>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>
                  {formatOutstandingGrams(line.materialType, line.outstandingGrams)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
