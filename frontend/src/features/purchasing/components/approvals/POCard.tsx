import React from "react";
import { motion } from "motion/react";
import { Check, X, Package } from "lucide-react";
import { toast } from "sonner";
import { T, F } from "./tokens";
import { PO_DATA } from "./data";
import { GreenBtn, CrimsonBtn, InfoStrip } from "./SharedUI";

// ─── PO Card ──────────────────────────────────────────────────────────────────
export function POCard({
  item,
  onAction,
  onApprove,
  onReject,
  onViewDoc,
}: {
  item: typeof PO_DATA[0] & { notesAdmin?: string; urgency?: string; totalValue?: number };
  onAction: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDoc?: (id: string) => void;
}) {
  const handleApprove = () => {
    if (onApprove) onApprove(item.id);
    onAction(item.id);
    toast.success(`${item.id} approved. Admin has been notified. PO document ready for download.`);
  };
  const handleReject = () => {
    if (onReject) onReject(item.id);
    onAction(item.id);
    toast.error(`${item.id} rejected. Admin has been notified.`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        borderLeft: "4px solid " + T.antiqueGold,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top row: ID + raised */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy,
          background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 8px",
        }}>
          {item.id}
        </span>
        <span style={{
          fontFamily: F.mono, fontSize: 10, color: T.taupe,
          background: T.cream, borderRadius: 6, padding: "3px 8px",
        }}>
          Raised {item.raised}
        </span>
      </div>

      {/* Urgency chip */}
      {item.urgency === "Urgent" && (
        <div style={{ background: "rgba(192,57,43,0.09)", borderRadius: 7, padding: "6px 10px", fontFamily: F.mono, fontSize: 10, color: T.crimson, fontWeight: 600 }}>
          🔴 Urgent — Low Stock Alert
        </div>
      )}

      {/* Vendor */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={16} color={T.taupe} />
          <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>
            {item.vendor}
          </span>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, paddingLeft: 24 }}>
          {item.vendorCity}
        </span>
      </div>

      {/* Status strip */}
      <div style={{
        background: "rgba(200,155,71,0.10)", borderRadius: 8, padding: "7px 12px",
        fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.antiqueGold,
      }}>
        ⏳ Waiting for your approval
      </div>

      {/* Materials */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {item.materials.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.taupe }}>
              {m.label}
            </span>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
              {m.qty}
            </span>
          </div>
        ))}
      </div>

      {/* Estimated total */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Estimated Total:</span>
        <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.antiqueGold }}>
          {item.estimated || (item.totalValue ? `₹${item.totalValue.toLocaleString("en-IN")}` : "—")}
        </span>
      </div>

      {/* Stock strip */}
      {item.stock && <InfoStrip>Current Stock: {item.stock}</InfoStrip>}

      {/* Admin note */}
      {item.notesAdmin && (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", background: "rgba(200,155,71,0.07)", borderRadius: 7, padding: "7px 10px" }}>
          <strong style={{ fontStyle: "normal" }}>Admin's note:</strong> {item.notesAdmin}
        </div>
      )}

      {/* Raised by */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Raised by:</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>
          {item.raisedBy}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GreenBtn style={{ flex: 1, justifyContent: "center" }} onClick={handleApprove}>
          <Check size={14} /> Approve — Send PO to Vendor
        </GreenBtn>
        <CrimsonBtn style={{ flex: 1, justifyContent: "center" }} onClick={handleReject}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>

      {/* View PO Document button */}
      {onViewDoc && (
        <button
          onClick={() => onViewDoc(item.id)}
          style={{
            width: "100%", height: 44, borderRadius: 9, cursor: "pointer",
            fontFamily: F.ui, fontWeight: 600, fontSize: 13,
            background: "transparent", color: T.royalBurgundy,
            border: `1.5px solid rgba(110,15,45,0.22)`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          📄 View PO Document
        </button>
      )}
    </motion.div>
  );
}
