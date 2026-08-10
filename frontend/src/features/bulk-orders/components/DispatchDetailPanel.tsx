import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Truck, X, AlertTriangle } from "lucide-react";
import { DispatchRecord } from "../../finishing/contexts/FinishingContext";
import { IconButton } from "../../../shared/ui/primitives";
import { Drawer } from "../../../shared/ui/overlay";
import { rupees, formatMoney } from "@/lib/domain/money";

const T = {
  royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B",
  luxuryBrown: "#3B2314",
  taupe: "#69635E",
  antiqueGold: "#C89B47",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface DispatchDetailPanelProps {
  dispatch: DispatchRecord;
  onClose: () => void;
}

export function DispatchDetailPanel({ dispatch, onClose }: DispatchDetailPanelProps) {
  const rows: [string, string][] = [
    ["Dispatch Type", dispatch.type === "wholesale" ? "Wholesale" : "To Shop"],
    ["Dispatch Date", dispatch.dispatchDate || "—"],
    ["LR Number", dispatch.lrNumber || "—"],
    ["Transport Company", dispatch.transportCompany || "—"],
    ["Vehicle Number", dispatch.vehicleNumber || "—"],
    ["Driver", dispatch.driverName || "—"],
    ["Invoice Number", dispatch.invoiceNumber || "—"],
    ["Invoice Date", dispatch.invoiceDate || "—"],
    ["Firm", dispatch.firmName || "—"],
    ["Customer", dispatch.customerName || "—"],
    ["Total Amount", dispatch.totalAmount ? formatMoney(rupees(dispatch.totalAmount)) : "—"],
    ["Grand Total", dispatch.grandTotal ? formatMoney(rupees(dispatch.grandTotal)) : "—"],
    ["Expected Delivery", dispatch.expectedDelivery || "—"],
    ["Payment Due Date", dispatch.paymentDueDate || "—"],
  ];
  return (
    <Drawer open onOpenChange={next => { if (!next) onClose(); }} side="right" size="md">
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Truck size={18} color={T.antiqueGold} />
            <Dialog.Title asChild>
              <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#FFF" }}>Dispatch Details</span>
            </Dialog.Title>
          </div>
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.14)", color: "#FFF", borderRadius: 8 }}>
            <Dialog.Close asChild>
              <IconButton onClick={onClose} icon={X} variant="ghost" size="sm" label="Close" />
            </Dialog.Close>
          </span>
        </div>
        {(dispatch.pendingTransport || dispatch.pendingReceipt) && (
          <div style={{ margin: "16px 20px 0", background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: "#8B6018", display: "flex", gap: 8 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> Some details are still pending completion from Dispatch History.
          </div>
        )}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, flexShrink: 0 }}>{k}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, textAlign: "right" as const, wordBreak: "break-word" as const }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Sarees on this dispatch ({dispatch.sareeIds.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {dispatch.sareeIds.map(id => (
                <span key={id} style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 8px", borderRadius: 6 }}>{id}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
