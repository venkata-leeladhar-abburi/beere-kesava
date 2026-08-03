import React from "react";
import { MaterialIssueRecord } from "../../../materials/contexts/MaterialIssueContext";
import { T, F } from "./theme";

const fmtIssueDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 4 }}>{label}</div>;
}

export function LoomMaterialsTab({ materialRecords }: { materialRecords: MaterialIssueRecord[] }) {
  return (
    <div>
      <SectionPill label="Materials Issued — Batch Wise" />
      {materialRecords.length === 0 ? (
        <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" as const, marginTop: 12 }}>
          No materials issued to this loom yet. Use the Issue Material page to record material handovers.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 18, marginTop: 12 }}>
          {Array.from(materialRecords.reduce((m, r) => {
            const key = r.batchId || "Unassigned";
            if (!m.has(key)) m.set(key, [] as typeof materialRecords);
            m.get(key)!.push(r);
            return m;
          }, new Map<string, typeof materialRecords>()).entries()).map(([batchId, recs]) => {
            let warpKg = 0;
            let reshamKg = 0;
            let jariReels = 0;
            recs.forEach(r => r.materials.forEach(mat => {
              const qty = mat.quantity || 0;
              if (mat.materialType === "Warp") {
                warpKg += (mat.unit || "").toLowerCase() === "kg" ? qty : qty / 1000;
              } else if (mat.materialType === "Resham") {
                reshamKg += (mat.unit || "").toLowerCase() === "kg" ? qty : qty / 1000;
              } else if (mat.materialType === "Jari") {
                jariReels += (mat.unit || "").toLowerCase().startsWith("bun") ? qty * 4 : qty;
              }
            }));

            return (
              <div key={batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}` }}>
                  <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 7, padding: "5px 12px" }}>{batchId}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{recs.length} issuance{recs.length > 1 ? "s" : ""}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${T.borderDef}` }}>
                  {[
                    { label: "Warp Outstanding", value: `${warpKg.toFixed(2)} kg`, color: T.royalBurgundy },
                    { label: "Resham Outstanding", value: `${reshamKg.toFixed(2)} kg`, color: "#7A5E1C" },
                    { label: "Jari Outstanding", value: `${jariReels} reels`, color: T.green },
                  ].map((s, i) => (
                    <div key={s.label} style={{ padding: "14px 22px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column" as const, gap: 12 }}>
                  {recs.map(r => (
                    <div key={r.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap" as const, gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 9px" }}>{r.id}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                        {r.materials.map((m, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" as const }}>
                            <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{m.materialType}</span>
                            {m.description && <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{m.description}</span>}
                            <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, marginLeft: "auto" }}>{m.quantity} {m.unit}</span>
                            <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: "rgba(139,112,96,0.10)", borderRadius: 5, padding: "2px 8px" }}>{m.grnBatchId}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 10 }}>Issued by {r.issuedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
