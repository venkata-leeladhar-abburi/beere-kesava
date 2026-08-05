import React from "react";
import { ChevronDown } from "lucide-react";
import { C, F, card } from "./tokens";
import { PurchaseOrder } from "../../../purchasing/contexts/POContext";
import { Button } from "../../../../shared/ui/primitives";

interface GRNPODropdownProps {
  selectedPO: PurchaseOrder | null;
  approvedPOs: PurchaseOrder[];
  showPODrop: boolean;
  setShowPODrop: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectPO: (po: PurchaseOrder) => void;
}

export function GRNPODropdown({
  selectedPO,
  approvedPOs,
  showPODrop,
  setShowPODrop,
  handleSelectPO
}: GRNPODropdownProps) {
  return (
    <div style={{ margin: "0 20px" }}>
      <div style={{ position: "relative" }}>
        <Button variant="secondary" fullWidth onClick={() => setShowPODrop(p => !p)} className="h-auto min-h-[48px] justify-between px-3.5 py-2.5">
          <div style={{ color: selectedPO ? C.text : C.muted, fontFamily: F.u, fontSize: 13, textAlign: "left", flex: 1 }}>
            {selectedPO ? (
              <div>
                <div style={{ fontWeight: 700, color: C.burg, marginBottom: 2 }}>{selectedPO.id} — {selectedPO.vendor}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                  Firm: {selectedPO.firmName ?? "—"} · City: {selectedPO.vendorCity}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                  {selectedPO.materials.map((m, idx) => (
                    <span key={idx} style={{ 
                      fontFamily: F.u, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg, 
                      background: m.materialType === "Warp" ? "rgba(196,146,58,0.1)" : m.materialType === "Resham" ? "rgba(200,155,71,0.1)" : "rgba(107,26,42,0.05)",
                      padding: "2px 6px", 
                      borderRadius: 4 
                    }}>
                      {m.materialType}: {m.quantity} {m.unit}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              "Select an approved purchase order..."
            )}
          </div>
          <ChevronDown size={16} color={C.muted} style={{ flexShrink: 0, marginLeft: 8, transform: showPODrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </Button>
        {showPODrop && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(107,26,42,0.12)", zIndex: 50, marginTop: 4, maxHeight: 280, overflowY: "auto" }}>
            {approvedPOs.length === 0 && (
              <div style={{ padding: "14px", fontFamily: F.u, fontSize: 12, color: C.muted, textAlign: "center" }}>No approved purchase orders available.</div>
            )}
            {approvedPOs.map(po => (
              <Button key={po.id} variant="tertiary" fullWidth onClick={() => handleSelectPO(po)}
                className="h-auto justify-start rounded-none border-0 border-b border-[rgba(139,26,46,0.12)] px-4 py-3.5 text-left"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{po.id}</span>
                  {po.urgency === "Urgent" && (
                    <span style={{ fontFamily: F.u, fontSize: 12, background: "rgba(183,28,28,0.08)", color: "#B71C1C", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                      URGENT
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                  {po.vendor} <span style={{ fontWeight: 400, color: C.muted }}>· {po.vendorCity}</span>
                </div>
                {po.firmName && (
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 5 }}>
                    Firm: <span style={{ fontWeight: 500, color: C.text }}>{po.firmName}</span>
                  </div>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {selectedPO && (
        <div style={{ ...card, marginTop: 10, padding: 14 }}>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>PO Reference — What Was Ordered</div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>PO Number</div>
              <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{selectedPO.poNumber}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Vendor</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text }}>{selectedPO.vendor} · {selectedPO.vendorCity}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Firm Name</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text }}>{selectedPO.firmName ?? "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
