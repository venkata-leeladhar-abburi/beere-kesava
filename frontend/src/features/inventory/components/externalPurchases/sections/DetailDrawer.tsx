import * as Dialog from "@radix-ui/react-dialog";
import { X, Tag } from "lucide-react";
import { Purchase, totalPieces } from "@/features/suppliers";
import { T, F } from "../theme";
import { StatusPill } from "../common/primitives";
import { Button, IconButton } from "../../../../../shared/ui/primitives";
import { Drawer } from "../../../../../shared/ui/overlay";

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
    <Drawer open={!!detailRow} onOpenChange={next => { if (!next) onClose(); }} side="right" size="md">
      {detailRow && (
          <div
            style={{
              height: "100%",
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
              <Dialog.Title asChild>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>
                  Purchase Details
                </span>
              </Dialog.Title>
              <Dialog.Description className="sr-only">Full details for this external purchase</Dialog.Description>
              <Dialog.Close asChild>
                <IconButton
                  icon={X}
                  label="Close"
                  onClick={onClose}
                  variant="secondary"
                  shape="circle"
                  size="sm"
                />
              </Dialog.Close>
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
                        fontFamily: F.ui,
                        fontSize: 14,
                        color: field.gold ? T.antiqueGold : field.mono ? T.royalBurgundy : T.taupe,
                        fontWeight: field.mono ? 700 : 400,
                        fontVariantNumeric: "tabular-nums",
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
          </div>
      )}
    </Drawer>
  );
}
