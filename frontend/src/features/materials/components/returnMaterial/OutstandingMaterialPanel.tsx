import React from "react";
import { PackageOpen } from "lucide-react";
import { WeaverOutstandingLine } from "../../contexts/MaterialReturnContext";
import { GrnLineCode } from "@/shared/ui/domain";
import { F, T } from "../issueMaterial/theme";
import { materialIcon } from "../issueMaterial/materialFormatters";
import { formatOutstandingGrams } from "./materialFormatters";

// Shows what's still with the selected weaver/loom (issued minus already-
// approved returns), computed server-side by MaterialReturnsService.getOutstanding
// and narrowed by whatever loom/batch the form has selected.
//
// Each row is one GRN line, not just one material type, so the admin can see
// which receipt the outstanding weight came from and reconcile against the
// physical label on the bundle. Purely informational — a soft reference, not
// a hard cap on what can be entered below (a weaver can legitimately return
// less than what's outstanding, or a return can be logged for stock
// reconciliation even when the tallies don't line up).
export function OutstandingMaterialPanel({ loading, lines, recipientLabel, scopeLabel }: {
  loading: boolean;
  lines: WeaverOutstandingLine[];
  recipientLabel: string;
  /** e.g. "Loom 1 · BATCH-014" — how far the figures have been narrowed. */
  scopeLabel?: string;
}) {
  // Totals per material type, so the header answers "how much Resham is out?"
  // without the reader adding up GRN lines by hand.
  const totals = React.useMemo(() => {
    const byType = new Map<WeaverOutstandingLine["materialType"], number>();
    lines.forEach(l => byType.set(l.materialType, (byType.get(l.materialType) ?? 0) + l.outstandingGrams));
    return Array.from(byType.entries());
  }, [lines]);

  return (
    <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <PackageOpen size={16} color={T.royalBurgundy} />
        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>Outstanding Material with {recipientLabel}</div>
        {scopeLabel && (
          <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 5, padding: "2px 8px" }}>
            {scopeLabel}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>Loading outstanding balance…</div>
      ) : lines.length === 0 ? (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>
          {scopeLabel
            ? `No outstanding material for ${scopeLabel} — everything issued against it has already come back.`
            : "No outstanding material — everything issued has already been returned or none has been issued yet."}
        </div>
      ) : (
        <>
          {totals.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {totals.map(([type, grams]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "6px 10px" }}>
                  {materialIcon(type)}
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{type}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{formatOutstandingGrams(type, grams)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {lines.map((line) => {
              const variant = line.materialType === "Warp"
                ? line.warpSubtype
                : line.materialType === "Jari"
                  ? `${line.jariType ?? ""} ${line.jariGrade ?? ""} ${line.jariColor ?? ""}`.replace(/\s+/g, " ").trim()
                  : line.jariColor;
              // A line is uniquely identified by its material variant plus the
              // GRN line it was issued from — the same composite the backend
              // groups on, so it is stable across refetches.
              const lineKey = [
                line.materialType, line.warpSubtype ?? "", line.jariType ?? "", line.jariGrade ?? "",
                line.jariColor ?? "", line.grnBatchId ?? "", line.grnItemCode ?? "",
              ].join("|");

              return (
                <div key={lineKey} style={{ background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                      {materialIcon(line.materialType)}
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{line.materialType}</span>
                      {variant && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{variant}</span>}
                      {line.description && (
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>{line.description}</span>
                      )}
                      {(line.grnBatchId || line.grnItemCode) && (
                        <GrnLineCode batchId={line.grnBatchId} itemCode={line.grnItemCode} />
                      )}
                    </div>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, whiteSpace: "nowrap" }}>
                      {formatOutstandingGrams(line.materialType, line.outstandingGrams)}
                    </span>
                  </div>

                  {/* Issued → returned → still out, so the outstanding figure
                      is auditable rather than a number the admin must trust. */}
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.borderDef}` }}>
                    {([
                      { label: "Issued", grams: line.issuedGrams, color: T.taupe },
                      { label: "Returned", grams: line.returnedGrams, color: T.taupe },
                      { label: "Still out", grams: line.outstandingGrams, color: T.royalBurgundy },
                    ] as const).map(stat => (
                      <div key={stat.label} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.4px" }}>{stat.label}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: stat.color }}>
                          {formatOutstandingGrams(line.materialType, stat.grams)}
                        </span>
                      </div>
                    ))}
                    {line.issueIds.length > 0 && (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 5, minWidth: 0 }}>
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.4px" }}>Issued on</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.luxuryBrown }}>{line.issueIds.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
