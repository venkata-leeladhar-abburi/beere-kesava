import React from "react";
import { useMaterialIssue } from "../../../../materials/contexts/MaterialIssueContext";
import { useDesignLibrary } from "../../../../design-library/contexts/DesignLibraryContext";
import { Package } from "lucide-react";
import { C, F, CURRENT_WEAVER_ID } from "../theme";

// ─── Materials given to the current weaver for a specific batch (aggregated by type) ──
export function useMaterialsGivenForBatch(batchId: string) {
  const { getRecordsForWeaver } = useMaterialIssue();
  const records = getRecordsForWeaver(CURRENT_WEAVER_ID).filter(r => r.batchId === batchId && r.status !== "cancelled");
  const totals: Record<string, { qty: number; unit: string }> = {};
  records.forEach(r => r.materials.forEach(m => {
    if (!totals[m.materialType]) totals[m.materialType] = { qty: 0, unit: m.unit };
    totals[m.materialType].qty += m.quantity;
  }));
  return Object.entries(totals).map(([type, v]) => `${type}: ${v.qty}${v.unit}`).join(", ");
}

// ─── Dispatch instructions sent to the current weaver, linked to a specific batch ──
export function DispatchInstructionsBlock({ batchId }: { batchId: string }) {
  const { getDispatchesForWeaver } = useDesignLibrary();
  const myDispatches = getDispatchesForWeaver(CURRENT_WEAVER_ID).filter(d => d.batches.includes(batchId));
  if (myDispatches.length === 0) return null;
  return (
    <div>
      <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>DISPATCH INSTRUCTIONS</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {myDispatches.map(d => (
          <div key={d.id} style={{ background: "rgba(107,26,42,0.04)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>{d.instructions}</div>
            {(d.colorSlipImage || d.designGraphImage) && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                {d.colorSlipImage && (
                  <div>
                    <img src={d.colorSlipImage} alt="Color Slip" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.bdr}`, display: "block" }} />
                    <div style={{ fontFamily: F.u, fontSize: 9.5, color: C.muted, marginTop: 3, textAlign: "center" as const }}>Color Slip</div>
                  </div>
                )}
                {d.designGraphImage && (
                  <div>
                    <img src={d.designGraphImage} alt="Design Graph" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.bdr}`, display: "block" }} />
                    <div style={{ fontFamily: F.u, fontSize: 9.5, color: C.muted, marginTop: 3, textAlign: "center" as const }}>Design Graph</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ fontFamily: F.u, fontSize: 10.5, color: C.muted, marginTop: 8 }}>{d.sentAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Materials given block (shared by active + completed batch cards) ──
export function MaterialsGivenBlock({ batchId }: { batchId: string }) {
  const summary = useMaterialsGivenForBatch(batchId);
  if (!summary) return null;
  return (
    <div>
      <div style={{ fontFamily: F.m, fontSize: 9, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>MATERIALS GIVEN</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(196,146,58,0.08)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
        <Package size={14} color={C.gold} />
        <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.text }}>{summary}</span>
      </div>
    </div>
  );
}
