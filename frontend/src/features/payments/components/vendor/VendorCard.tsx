import React, { useState } from "react";
import { FileText } from "lucide-react";
import { motion } from "motion/react";

import { PurchaseOrder, usePO } from "../../../purchasing/contexts/POContext";
import { F, T } from "../../theme";
import { Invoice, VendorPayment } from "../../types";
import { VENDOR_STATUS_CFG, VendorBadge } from "./VendorBadge";

export function VendorCard({ vp, matchedPO, onPay, onView, onViewPO, onAddInvoice, selected }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onPay: (id: string) => void; onView?: () => void; onViewPO?: () => void; onAddInvoice?: () => void; selected: boolean }) {
  const balance = vp.invoiceAmt - vp.paidAmt;
  const isPaid = vp.status === "Paid";
  const cfg = VENDOR_STATUS_CFG[vp.status];
  const vendorName = matchedPO?.vendor ?? vp.vendor;
  const { setMaterialInvoiceAmount } = usePO();
  const [invoiceDrafts, setInvoiceDrafts] = useState<Record<number, string>>({});

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
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 7px", borderRadius: 5 }}>
                      {m.quantity} {m.unit}
                    </span>
                  </div>
                  
                  <div style={{ paddingLeft: 60 }}>
                    {m.invoiceAmount ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFBF7", padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.borderGold}40` }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Amount</span>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8B6018" }}>
                          ₹{m.invoiceAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                        <input
                          type="number"
                          value={invoiceDrafts[mi] || ""}
                          onChange={e => setInvoiceDrafts(prev => ({ ...prev, [mi]: e.target.value }))}
                          placeholder="Invoice amount in ₹"
                          style={{ flex: 1, height: 28, fontFamily: F.ui, fontSize: 12, padding: "0 8px", borderRadius: 6, border: `1px solid ${T.borderDef}`, outline: "none", background: "#FFFFFF", boxSizing: "border-box" as const }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const val = parseFloat(invoiceDrafts[mi]);
                            if (invoiceDrafts[mi] && !isNaN(val) && matchedPO) {
                              setMaterialInvoiceAmount(matchedPO.id, mi, val);
                            }
                          }}
                          style={{ height: 28, padding: "0 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, background: "#FDFBF7", border: `1px solid ${T.borderDef}`, borderRadius: 6, cursor: "pointer" }}
                        >
                          Save
                        </button>
                      </div>
                    )}
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
            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Paid</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: T.green }}>₹{vp.paidAmt.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px dashed ${T.borderDef}`, paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>Balance</span>
            <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: isPaid ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
              {isPaid ? "Fully Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div style={{ background: "rgba(110,15,45,0.02)", borderTop: `1px solid ${T.borderDef}`, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <VendorBadge status={vp.status} />
        
                <div style={{ display: "flex", gap: 8 }}>
          {matchedPO && onViewPO && (
            <button
              onClick={onViewPO}
              style={{
                padding: "0 14px", height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: `1.5px solid ${T.borderGold}`, borderRadius: 8, background: T.warmCream,
                fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.antiqueGold, cursor: "pointer",
              }}
            >
              View PO
            </button>
          )}
          <button
            onClick={onView}
            style={{
              padding: "0 14px", height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8, background: "#fff",
              fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer",
            }}
          >
            Statement
          </button>
          {onAddInvoice && (
            <button
              onClick={onAddInvoice}
              style={{
                padding: "0 14px", height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8, background: "#fff",
                fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer",
              }}
            >
              <FileText size={13} /> Add Invoice
            </button>
          )}
          {!isPaid && (
            <button
              onClick={() => onPay(vp.id)}
              style={{
                padding: "0 14px", height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: "none", borderRadius: 8, background: selected ? T.deepWine : T.royalBurgundy,
                fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFDF9", cursor: "pointer",
              }}
            >
              Pay Now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
