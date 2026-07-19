import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Printer, Share2, Download } from "lucide-react";
import { PurchaseOrder } from "./POContext";
import { toast } from "sonner";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  crimson:       "#C0392B",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function StatusBadge({ status }: { status: PurchaseOrder["status"] }) {
  const cfg = {
    pending:  { text: "Pending Approval", color: T.antiqueGold, bg: "rgba(200,155,71,0.12)" },
    approved: { text: "Approved",         color: T.green,       bg: "rgba(30,102,64,0.10)" },
    rejected: { text: "Rejected",         color: T.crimson,     bg: "rgba(192,57,43,0.10)" },
    received: { text: "Received",         color: T.taupe,       bg: "rgba(139,112,96,0.12)" },
  }[status];
  return (
    <span style={{
      fontFamily: F.mono, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      padding: "3px 10px", borderRadius: 6,
    }}>
      {cfg.text}
    </span>
  );
}

interface PODocumentModalProps {
  open: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  isApproved?: boolean;
}

export function PODocumentModal({ open, onClose, po, isApproved }: PODocumentModalProps) {
  if (!po) return null;

  const todayDisplay = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const approvedDisplay = po.approvedDate
    ? new Date(po.approvedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : todayDisplay;

  const showApproved = isApproved || po.status === "approved" || po.status === "received";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
            zIndex: 9200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFDF9",
              borderRadius: 16,
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              width: "100%",
              maxWidth: 720,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              background: T.darkBurgundy,
              padding: "20px 28px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", marginBottom: 6 }}>
                  Purchase Order Document
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold }}>{po.poNumber}</span>
                  <StatusBadge status={po.status} />
                  {po.urgency === "Urgent" && (
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.crimson, background: "rgba(192,57,43,0.20)", padding: "2px 8px", borderRadius: 5 }}>🔴 URGENT</span>
                  )}
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.18)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                <X size={18} color="#FFFDF9" />
              </motion.button>
            </div>

            {/* Document body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
              {/* PO Document card */}
              <div style={{
                background: "#FFFFFF",
                border: `1.5px solid ${T.borderDef}`,
                borderRadius: 14,
                overflow: "hidden",
              }}>
                {/* Document header strip */}
                <div style={{
                  background: T.darkBurgundy,
                  padding: "22px 28px",
                  textAlign: "center",
                }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFFDF9", marginBottom: 3 }}>
                    🪷 Beere Kesava &amp; Brothers Silks
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: T.antiqueGold, letterSpacing: "2px" }}>Est. 1999</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 4 }}>
                    Guntur, Andhra Pradesh, India
                  </div>
                </div>

                <div style={{ padding: "24px 28px" }}>
                  {/* Reference row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${T.borderDef}` }}>
                    <div>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>
                        Purchase Order No: {po.poNumber}
                      </span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>
                      Date: {new Date(po.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Vendor + Delivery row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500, marginBottom: 5 }}>Vendor:</div>
                      <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15, color: T.luxuryBrown, marginBottom: 3 }}>{po.vendor}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                        {[po.vendorCity, po.vendorContact].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500, marginBottom: 5 }}>Expected Delivery:</div>
                      <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>
                        {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </div>
                      {po.urgency === "Urgent" && (
                        <div style={{ marginTop: 6 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "3px 9px", borderRadius: 5 }}>
                            🔴 Urgent — Low Stock Alert
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Materials table */}
                  <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", background: T.silkCream, padding: "10px 16px", gap: 8 }}>
                      {["Material", "Description", "Quantity"].map(h => (
                        <span key={h} style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</span>
                      ))}
                    </div>
                    {po.materials.map((m, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "11px 16px", gap: 8, background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory, borderTop: `1px solid ${T.borderDef}` }}>
                        <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{m.materialType}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{m.subtype || "—"}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown }}>{m.quantity} {m.unit}</span>
                      </div>
                    ))}
                    {/* Total row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "13px 16px", gap: 8, background: T.warmCream, borderTop: `2px solid ${T.borderGold}` }}>
                      <span style={{ fontFamily: F.display, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, gridColumn: "1 / 3" }}>Estimated Total</span>
                      <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.antiqueGold }}>
                        ₹{po.totalValue?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {(po.notesVendor || po.notesAdmin) && (
                    <div style={{ marginBottom: 18 }}>
                      {po.notesVendor && (
                        <div style={{ background: T.silkCream, borderRadius: 9, padding: "12px 15px", marginBottom: 10 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500, marginBottom: 5 }}>Instructions for Vendor:</div>
                          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{po.notesVendor}</div>
                        </div>
                      )}
                      {po.notesAdmin && (
                        <div style={{ background: "rgba(200,155,71,0.07)", borderRadius: 9, padding: "12px 15px", border: `1px solid ${T.borderGold}` }}>
                          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.antiqueGold, fontWeight: 500, marginBottom: 5 }}>Admin's Note:</div>
                          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, fontStyle: "italic" }}>{po.notesAdmin}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raised by */}
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 18 }}>
                    Raised by: <strong style={{ color: T.luxuryBrown }}>{po.raisedBy}</strong>
                    &nbsp;·&nbsp;
                    Submitted: <span style={{ fontFamily: F.mono }}>{new Date(po.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>

                  {/* Signature block */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 18 }}>
                    <div>
                      <div style={{ height: 40, borderBottom: `1.5px solid rgba(110,15,45,0.18)`, marginBottom: 7 }} />
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Prepared by: _____________</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>Admin</div>
                    </div>
                    <div>
                      <div style={{ height: 40, borderBottom: `1.5px solid rgba(110,15,45,0.18)`, marginBottom: 7, position: "relative" }}>
                        {showApproved && (
                          <div style={{ position: "absolute", bottom: 10, left: 0, fontFamily: F.display, fontSize: 12, color: T.green, fontWeight: 600 }}>
                            Superadmin
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                        Approved by: {showApproved ? <span style={{ color: T.green, fontWeight: 600 }}>Superadmin</span> : "_____________"}
                      </div>
                      {showApproved && (
                        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.green, marginTop: 4 }}>{approvedDisplay}</div>
                      )}
                      {!showApproved && (
                        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>Superadmin</div>
                      )}
                    </div>
                  </div>

                  {/* Document footer */}
                  <div style={{ textAlign: "center", paddingTop: 14, borderTop: `1px solid ${T.borderDef}` }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Beere Kesava &amp; Brothers Silks · Est. 1999</div>
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: T.antiqueGold, marginTop: 3, letterSpacing: "1.5px" }}>
                      Tradition · Trust · Timeless Quality
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{
              padding: "18px 28px",
              borderTop: `1px solid ${T.borderDef}`,
              background: T.warmIvory,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}>
              <motion.button
                onClick={() => window.print()}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.25)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, height: 52, borderRadius: 10, cursor: "pointer",
                  fontFamily: F.ui, fontWeight: 700, fontSize: 13.5,
                  background: T.royalBurgundy, color: "#FFFDF9", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}
              >
                <Printer size={16} /> Print PO Document
              </motion.button>

              <motion.button
                onClick={() => toast.success("PO document ready — share with vendor via WhatsApp or email")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, height: 52, borderRadius: 10, cursor: "pointer",
                  fontFamily: F.ui, fontWeight: 700, fontSize: 13.5,
                  background: T.green, color: "#FFFFFF", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}
              >
                <Share2 size={16} /> Share with Vendor
              </motion.button>

              <motion.button
                onClick={() => window.print()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, height: 48, borderRadius: 10, cursor: "pointer",
                  fontFamily: F.ui, fontWeight: 600, fontSize: 13,
                  background: "transparent", color: T.royalBurgundy,
                  border: `1.5px solid rgba(110,15,45,0.22)`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}
              >
                <Download size={15} /> Download as PDF
              </motion.button>

              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 0.6, height: 44, borderRadius: 10, cursor: "pointer",
                  fontFamily: F.ui, fontWeight: 500, fontSize: 13,
                  background: "transparent", color: T.taupe,
                  border: `1.5px solid rgba(110,15,45,0.14)`,
                }}
              >
                × Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
