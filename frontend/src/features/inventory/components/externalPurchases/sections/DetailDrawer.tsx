import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Tag } from "lucide-react";
import { Purchase, totalPieces } from "../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../theme";
import { StatusPill } from "../common/primitives";

/** Slide-in "Purchase Details" panel opened from a table row. */
export function DetailDrawer({
  detailRow,
  onClose,
  onEdit,
  onViewSarees,
}: {
  detailRow: Purchase | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onViewSarees: (row: Purchase) => void;
}) {
  return (
    <AnimatePresence>
      {detailRow && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 400 }}
          />
          <motion.div
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 480,
              background: "white",
              boxShadow: "-8px 0 40px rgba(44,24,16,0.18)",
              zIndex: 500,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "22px 28px",
                borderBottom: `1px solid ${T.borderDef}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>
                Purchase Details
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: `1px solid ${T.borderDef}`,
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: T.taupe,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {[
                { label: "Serial Number", value: detailRow.id, mono: true, gold: true },
                { label: "Supplier Name", value: detailRow.supplier },
                { label: "Location", value: detailRow.location },
                { label: "Purchase Date", value: detailRow.date },
                { label: "Number of Sarees", value: String(detailRow.sareeCount) },
                { label: "GST Number", value: detailRow.gstNumber || "—", mono: true },
                { label: "Invoice Number", value: detailRow.invoiceNumber || "—", mono: true },
                { label: "Bill Amount", value: detailRow.billAmount, gold: true },
                { label: "Payment Status", value: detailRow.status, pill: true },
                { label: "Invoice File", value: detailRow.invoiceFileName || "Not uploaded" },
              ].map((field) => (
                <div key={field.label}>
                  <div
                    style={{
                      fontFamily: F.ui,
                      fontWeight: 600,
                      fontSize: 12,
                      color: T.luxuryBrown,
                      marginBottom: 4,
                    }}
                  >
                    {field.label}
                  </div>
                  {field.pill ? (
                    <StatusPill status={field.value} />
                  ) : (
                    <div
                      style={{
                        fontFamily: field.mono ? F.mono : F.ui,
                        fontSize: 14,
                        color: field.gold ? T.antiqueGold : field.mono ? T.royalBurgundy : T.taupe,
                        fontWeight: field.mono ? 700 : 400,
                      }}
                    >
                      {field.value}
                    </div>
                  )}
                </div>
              ))}

              {detailRow.notes && (
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, marginBottom: 4 }}>
                    Notes
                  </div>
                  <div
                    style={{
                      fontFamily: F.ui,
                      fontSize: 14,
                      color: T.taupe,
                      background: T.silkCream,
                      borderRadius: 8,
                      padding: "10px 12px",
                      lineHeight: 1.6,
                    }}
                  >
                    {detailRow.notes}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, marginBottom: 8 }}>
                  Saree Barcodes ({totalPieces(detailRow.sarees)})
                </div>
                <button
                  onClick={() => onViewSarees(detailRow)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: T.cream,
                    border: `1px solid ${T.borderGold}`,
                    borderRadius: 10,
                    padding: "12px 0",
                    fontFamily: F.ui,
                    fontWeight: 600,
                    fontSize: 13,
                    color: T.luxuryBrown,
                    cursor: "pointer",
                  }}
                >
                  <Tag size={14} color={T.antiqueGold} />
                  View &amp; Print Saree Tags
                </button>
              </div>
            </div>

            <div
              style={{
                padding: "18px 28px",
                borderTop: `1px solid ${T.borderDef}`,
                display: "flex",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => onEdit(detailRow.id)}
                style={{
                  flex: 1,
                  background: T.royalBurgundy,
                  color: "white",
                  border: "none",
                  borderRadius: 999,
                  padding: "11px 0",
                  fontFamily: F.ui,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Edit Entry
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: "transparent",
                  color: T.taupe,
                  border: `1px solid ${T.borderDef}`,
                  borderRadius: 999,
                  padding: "11px 0",
                  fontFamily: F.ui,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
