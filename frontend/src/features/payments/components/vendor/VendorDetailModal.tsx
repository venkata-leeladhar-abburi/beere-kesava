import React from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";

import { PurchaseOrder } from "../../../purchasing/contexts/POContext";
import { VENDOR_STATIC_PAYMENT_HISTORY } from "../../data/vendors";
import { EASE, F, T } from "../../theme";
import { Invoice, VendorPayment } from "../../types";

// ── Vendor Detail Modal ───────────────────────────────────────────────────────
export function VendorDetailModal({ vp, matchedPO, onClose }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onClose: () => void }) {
  const balance = vp.invoiceAmt - vp.paidAmt;
  const history = VENDOR_STATIC_PAYMENT_HISTORY[vp.id] ?? [];
  const vendorName = matchedPO?.vendor ?? vp.vendor;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 600, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{vendorName}</div>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: T.goldLight, marginTop: 4 }}>{vp.poNumber}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* PO details */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>PO Details</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>PO Number</span><div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{vp.poNumber}</div></div>
              <div><span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Firm Name</span><div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{matchedPO?.firmName ?? "—"}</div></div>
              <div><span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Vendor</span><div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{vendorName}</div></div>
              <div><span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Vendor City</span><div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{matchedPO?.vendorCity ?? "—"}</div></div>
            </div>
            {matchedPO && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {matchedPO.materials.map((m, i) => (
                  <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 6 }}>{m.materialType}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, flex: 1 }}>{m.description || m.subtype}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{m.quantity} {m.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment details */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Payment Details</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Invoice Amount</span>
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Paid</span>
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: T.green }}>₹{vp.paidAmt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Balance</span>
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: balance === 0 ? T.green : T.crimson }}>{balance === 0 ? "₹0" : `₹${balance.toLocaleString("en-IN")}`}</span>
              </div>
              {vp.utr && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>UTR Number</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.green }}>{vp.utr}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Due Date</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: vp.status === "Overdue" ? T.crimson : T.luxuryBrown }}>{vp.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Payment History</div>
            {history.length === 0 ? (
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>No payments recorded yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1.1fr 1.1fr 1fr 1fr", gap: 10 }}>
                    <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Amount</div><div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}>₹{h.amount.toLocaleString("en-IN")}</div></div>
                    <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Date</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.date}</div></div>
                    <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Paying Firm</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.firm}</div></div>
                    <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>UTR</div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{h.utr}</div></div>
                    <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Method</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.method}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}
