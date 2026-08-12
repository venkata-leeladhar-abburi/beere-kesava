import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Layers, Package, RotateCcw } from "lucide-react";
import { C, F, SareeTypeDetailCard, ProgressBar, MyBatchEntry } from "../theme";
import { DispatchInstructionsBlock, MaterialsGivenBlock } from "./batchCardHelpers";
import { Button } from "../../../../../shared/ui/primitives";

export function DesktopActiveBatchCard({ b, idx, bp = "desktop" }: { b: MyBatchEntry; idx: number; bp?: "tablet" | "desktop" }) {
  const [expandedType,   setExpandedType]   = useState<string | null>(null);
  const isTablet = bp === "tablet";

  const borderColor    = idx % 2 === 0 ? C.burg : C.gold;
  const sareeTypePairs = Array.from(new Map(b.myRows.filter(r => r.sareeTypeCode && r.sareeTypeName).map(r => [r.sareeTypeCode!, r.sareeTypeName!])).entries());
  const bulkOrders     = Array.from(new Set(b.myRows.map(r => r.bulkOrderLabel).filter(Boolean))) as string[];
  const generalStock   = b.myRows.filter(r => !r.bulkOrderLabel).length;
  const qcPassedCount  = b.myRows.filter(r => r.qcPassed === true).length;
  // Produced = QC-passed OR finished via the Raise Quotation receive flow —
  // either milestone alone counts a saree as produced. A semi-approved saree
  // meets neither: it is back with the weaver for rework.
  const producedCount  = b.myRows.filter(r => r.qcPassed === true || r.finished === true).length;
  const reworkCount    = b.myRows.filter(r => r.awaitingRework === true).length;

  return (
    <div style={{ background: "#FFFDF9", borderRadius: 24, border: `1px solid rgba(110,15,45,0.10)`, borderLeft: `4px solid ${borderColor}`, boxShadow: "0px 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
      <div style={{ padding: "22px 24px 20px", display: "flex", flexDirection: "column" as const, gap: 14 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 18, color: C.burg }}>{b.batchId}</span>
          <span style={{ fontFamily: F.u, fontSize: 12, color: b.status === "active" ? C.green : C.gold, background: b.status === "active" ? "rgba(30,102,64,0.10)" : "rgba(200,155,71,0.15)", borderRadius: 999, padding: "4px 12px", fontWeight: 600 }}>
            {b.status === "active" ? "🟢 Weaving in Progress" : "🟡 Draft"}
          </span>
        </div>

        {/* Saree count + Produced/QC progress: side by side on desktop, stacked on tablet */}
        <div style={{ display: "flex", flexDirection: isTablet ? "column" as const : "row" as const, gap: 14, alignItems: isTablet ? "stretch" : "center" }}>
          <div style={{ background: C.cream, borderRadius: 12, padding: "14px 18px", textAlign: "center" as const, flex: isTablet ? undefined : "0 0 auto", minWidth: isTablet ? undefined : 160 }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 4 }}>Sarees assigned to you</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.text, lineHeight: 1 }}>{b.myRows.length}</div>
            {b.dueDate && <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Due by <span style={{ color: C.text, fontWeight: 600 }}>{b.dueDate}</span></div>}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {/* Produced progress indicator — finished via either the Worker
                Staff receive-back flow or the Raise Quotation receive flow */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Produced: {producedCount} of {b.myRows.length}</span>
                <span style={{ fontFamily: F.m, fontSize: 13, color: C.text, fontWeight: 600 }}>{Math.round((producedCount / b.myRows.length) * 100)}%</span>
              </div>
              <ProgressBar pct={(producedCount / b.myRows.length) * 100} height={8} />
            </div>

            {/* QC progress indicator */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>QC: {qcPassedCount} of {b.myRows.length} passed</span>
                <span style={{ fontFamily: F.m, fontSize: 13, color: C.text, fontWeight: 600 }}>{Math.round((qcPassedCount / b.myRows.length) * 100)}%</span>
              </div>
              <ProgressBar pct={(qcPassedCount / b.myRows.length) * 100} height={8} />
            </div>

            {/* Semi-approved sarees are back with the weaver — called out here
                so the gap between Produced and the batch total is explained. */}
            {reworkCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,155,71,0.10)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 9, padding: "7px 11px" }}>
                <RotateCcw size={13} color={C.gold} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: F.u, fontSize: 12.5, color: C.text }}>
                  <strong>{reworkCount}</strong> semi-approved — rework and hand in again
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dispatch instructions assigned to this weaver for this batch */}
        <DispatchInstructionsBlock batchId={b.batchId} />

        {/* Materials issued to this weaver for this batch */}
        <MaterialsGivenBlock batchId={b.batchId} />


        {/* Clickable saree type chips */}
        {sareeTypePairs.length > 0 && (
          <div>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 7 }}>CLICK TO VIEW SAREE TYPE DETAILS</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
              {sareeTypePairs.map(([code, name]) => (
                <Button key={code} variant={expandedType === code ? "primary" : "secondary"} size="sm" iconLeft={Layers}
                  onClick={() => setExpandedType(expandedType === code ? null : code)}
                  className={expandedType === code ? "rounded-lg border-[1.5px] border-[#3D0E1A] bg-[#3D0E1A]" : "rounded-lg border-[1.5px] border-[rgba(110,15,45,0.10)] bg-[rgba(61,14,26,0.04)]"}>
                  <span style={{ fontFamily: F.u, fontSize: 13, color: expandedType === code ? "#FFF" : C.text }}>{name}</span>
                </Button>
              ))}
            </div>
            <AnimatePresence>
              {expandedType && (
                <SareeTypeDetailCard
                  key={expandedType}
                  typeCode={expandedType}
                  typeName={sareeTypePairs.find(([c]) => c === expandedType)?.[1] ?? expandedType}
                  onClose={() => setExpandedType(null)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Order links */}
        {bulkOrders.map(label => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.15)", borderRadius: 10, padding: "10px 14px" }}>
            <Package size={13} color={C.green} />
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Customer Order</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.green }}>{label}</div>
            </div>
          </div>
        ))}
        {generalStock > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(139,112,96,0.07)", border: "1px solid rgba(139,112,96,0.15)", borderRadius: 10, padding: "10px 14px" }}>
            <Package size={13} color={C.muted} />
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>General Stock</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{generalStock} saree{generalStock !== 1 ? "s" : ""} for stock</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
