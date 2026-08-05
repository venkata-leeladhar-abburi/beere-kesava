import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Tag } from "lucide-react";
import { Purchase, totalPieces } from "../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../theme";
import { StatusPill } from "../common/primitives";
import { Button, IconButton } from "../../../../../shared/ui/primitives";

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
              <IconButton
                icon={X}
                label="Close"
                onClick={onClose}
                variant="secondary"
                shape="circle"
                size="sm"
              />
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
                <Button
                  onClick={() => onViewSarees(detailRow)}
                  variant="secondary"
                  fullWidth
                  iconLeft={Tag}
                >
                  View &amp; Print Saree Tags
                </Button>
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
              <Button
                onClick={() => onEdit(detailRow.id)}
                variant="primary"
                fullWidth
                className="rounded-full"
              >
                Edit Entry
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
                fullWidth
                className="rounded-full"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
