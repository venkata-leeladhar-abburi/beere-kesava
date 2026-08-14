import React from "react";
import { useMaterialIssue } from "@/features/materials";
import { useDesignLibrary } from "@/features/design-library";
import { Package } from "lucide-react";
import { C, F } from "../theme";
import { useCurrentWeaver } from "../useCurrentWeaver";

// ─── Materials given to the current weaver for a specific batch (aggregated by type) ──
export function useMaterialsGivenForBatch(batchId: string) {
  const { getRecordsForWeaver } = useMaterialIssue();
  const { weaverId } = useCurrentWeaver();
  const records = weaverId ? getRecordsForWeaver(weaverId).filter(r => r.batchId === batchId && r.status !== "cancelled") : [];
  const totals: Record<string, { qty: number; unit: string }> = {};
  records.forEach(r => r.materials.forEach(m => {
    if (!totals[m.materialType]) totals[m.materialType] = { qty: 0, unit: m.unit };
    totals[m.materialType].qty += m.quantity;
  }));
  return Object.entries(totals).map(([type, v]) => `${type}: ${v.qty}${v.unit}`).join(", ");
}

// ─── Dispatch instructions sent to the current weaver without a specific batch ──
export function GeneralDispatchInstructionsBlock() {
  const { getDispatchesForWeaver } = useDesignLibrary();
  const { weaverId } = useCurrentWeaver();
  const generalDispatches = weaverId ? getDispatchesForWeaver(weaverId).filter(d => d.batches.length === 0) : [];
  
  if (generalDispatches.length === 0) return null;
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 5, height: 28, background: C.gold, borderRadius: 3 }} />
        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>General Instructions</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {generalDispatches.map(d => (
          <div key={d.id} style={{ background: "rgba(200,155,71,0.06)", border: `1px solid ${C.bdr}`, borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.5, fontWeight: 500 }}>{d.instructions}</div>
            {(d.colorSlipImage) && (
              <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                {d.colorSlipImage && (
                  <div>
                    <img src={d.colorSlipImage} alt="Color Slip" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.bdr}`, display: "block" }} />
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 6, textAlign: "center" as const }}>Color Slip</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 12 }}>Sent on {d.sentAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dispatch instructions sent to the current weaver, linked to a specific batch ──
export function DispatchInstructionsBlock({ batchId }: { batchId: string }) {
  const { getDispatchesForWeaver } = useDesignLibrary();
  const { weaverId } = useCurrentWeaver();
  const myDispatches = weaverId ? getDispatchesForWeaver(weaverId).filter(d => d.batches.includes(batchId)) : [];
  if (myDispatches.length === 0) return null;
  return (
    <div>
      <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>DISPATCH INSTRUCTIONS</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {myDispatches.map(d => (
          <div key={d.id} style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, lineHeight: 1.5 }}>{d.instructions}</div>
            {(d.colorSlipImage) && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                {d.colorSlipImage && (
                  <div>
                    <img src={d.colorSlipImage} alt="Color Slip" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.bdr}`, display: "block" }} />
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3, textAlign: "center" as const }}>Color Slip</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 8 }}>{d.sentAt}</div>
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
      <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>MATERIALS GIVEN</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(200,155,71,0.08)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px" }}>
        <Package size={14} color={C.gold} />
        <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{summary}</span>
      </div>
    </div>
  );
}
