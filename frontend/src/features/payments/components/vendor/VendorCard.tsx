import React from "react";
import { FileText, Pencil } from "lucide-react";
import { motion } from "motion/react";

import { PurchaseOrder } from "../../../purchasing/contexts/POContext";
import { F, T } from "../../theme";
import { Invoice, VendorPayment } from "../../types";
import { VENDOR_STATUS_CFG, VendorBadge } from "./VendorBadge";
import { Button } from "../../../../shared/ui/primitives";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

export function VendorCard({ vp, matchedPO, onPay, onView, onViewPO, onAddInvoice, selected }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onPay: (id: string) => void; onView?: () => void; onViewPO?: () => void; onAddInvoice?: () => void; selected: boolean }) {
  const balance = vp.invoiceAmt - vp.paidAmt;
  const isPaid = vp.status === "Paid";
  const cfg = VENDOR_STATUS_CFG[vp.status];
  const vendorName = matchedPO?.vendor ?? vp.vendor;

  const MAT_TAG_PO: Record<string, { col: string; bg: string }> = {
    "Warp": { col: "#B85C38", bg: "rgba(184,92,56,0.12)" },
    "Resham": { col: "#4A7059", bg: "rgba(74,112,89,0.12)" },
    "Jari": { col: "#C19A5B", bg: "rgba(193,154,91,0.15)" },
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 18px 45px rgba(74,6,27,0.09)" }}
      transition={{ duration: 0.25 }}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        border: `1.5px solid ${T.borderDef}`,
        boxShadow: "0 8px 30px rgba(74,6,27,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 6, background: cfg.color, flexShrink: 0 }} />

      <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Top row: PO number + Date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span onClick={onViewPO} style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "4px 10px", borderRadius: 8, cursor: onViewPO ? "pointer" : "default" }}>
            {vp.poNumber}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: "#F7F2EA", padding: "4px 10px", borderRadius: 8 }}>
            {vp.dueDate}
          </span>
        </div>

        {/* Vendor Details */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown, letterSpacing: "-0.2px", marginBottom: 4 }}>
            {vendorName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            <span>{matchedPO?.vendorCity ?? "—"}</span>
            {matchedPO?.firmName && (
              <>
                <span style={{ color: T.borderDef }}>•</span>
                <span style={{ color: T.antiqueGold, fontWeight: 600 }}>{matchedPO.firmName}</span>
              </>
            )}
          </div>
        </div>

        {/* Materials Grid */}
        {matchedPO && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18, background: "rgba(110,15,45,0.015)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Materials Requested</div>
            {matchedPO.materials.map((m, mi) => {
              const mt = MAT_TAG_PO[m.materialType] || MAT_TAG_PO.Warp;
              return (
                <div key={mi} style={{ display: "flex", flexDirection: "column", gap: 6, borderBottom: mi < matchedPO.materials.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", paddingBottom: mi < matchedPO.materials.length - 1 ? 12 : 0, paddingTop: mi > 0 ? 8 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: mt.col, background: mt.bg, borderRadius: 6, padding: "2px 8px", minWidth: 50, textAlign: "center", flexShrink: 0 }}>
                      {m.materialType}
                    </span>
                    {m.subtype && (
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subtype}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }} />
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap" as const }}>
                      {m.quantity} {m.unit}
                      {m.pricePerUnit > 0 && <> · <Money value={rupees(m.pricePerUnit)} />/{m.unit}</>}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFBF7", padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.borderGold}40` }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Amount</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: m.invoiceAmount ? "#8B6018" : T.taupe }}>
                      {m.invoiceAmount ? <Money value={rupees(m.invoiceAmount)} /> : "Not yet invoiced"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Financials (Replaces Invoice amount inputs from Image 2) */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Amount</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(vp.invoiceAmt)} /></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Paid</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: T.green }}><Money value={rupees(vp.paidAmt)} /></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px dashed ${T.borderDef}`, paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>Balance</span>
            <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: isPaid ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
              {isPaid ? "Fully Paid ✓" : <Money value={rupees(balance)} />}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div style={{ background: "rgba(110,15,45,0.02)", borderTop: `1px solid ${T.borderDef}`, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <VendorBadge status={vp.status} />
        
                <div style={{ display: "flex", gap: 8 }}>
          {matchedPO && onViewPO && (
            <Button variant="secondary" size="sm" onClick={onViewPO}
              className="rounded-[8px] border-[1.5px] border-[rgba(200,155,71,0.22)] bg-[#F5E8D0] text-[#C89B47]">
              View PO
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onView}
            className="rounded-[8px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]">
            Statement
          </Button>
          {onAddInvoice && (
            <Button variant="secondary" size="sm" iconLeft={vp.billId ? Pencil : FileText} onClick={onAddInvoice}
              className="rounded-[8px] border-[1.5px] border-[rgba(110,15,45,0.12)] text-[#6E0F2D]">
              {vp.billId ? "Edit Invoice" : "Add Invoice"}
            </Button>
          )}
          {!isPaid && (
            <Button variant="primary" size="sm" onClick={() => onPay(vp.id)}
              className={`rounded-[8px] ${selected ? "bg-[#4A0A1D]" : "bg-[#6E0F2D]"}`}>
              Pay Now
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
