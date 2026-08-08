import { ShoppingBag, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { F, T, BulkOrder } from "../../theme";
import { Invoice } from "../../types";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";

// ── View Invoice Modal ────────────────────────────────────────────────────────
export function ViewInvoiceModal({ inv, bulkOrderData, onClose }: { inv: Invoice; bulkOrderData?: BulkOrder; onClose: () => void }) {
  const { dispatches, isError: dispatchesError } = useFinishing();
  const dispatch = dispatches.find(d => d.invoiceNumber === inv.id);
  const firmName = dispatch?.firmName ?? "Beere Kesava & Brothers Silks";
  
  // Try to determine the price per saree to display in the list. 
  // If not available, we just split the total amount evenly.
  const numSarees = dispatch?.sareeIds?.length || bulkOrderData?.total || 1;
  const pricePerSaree = dispatch?.pricePerSaree || Math.round(inv.total / numSarees);

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="md">
        {/* Header */}
        <div style={{ padding: "24px", background: T.royalBurgundy, color: "#FFF", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{firmName}</div>
            </Dialog.Title>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Hyderabad, Telangana</div>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" className="text-white hover:bg-[rgba(255,255,255,0.12)]" />
          </Dialog.Close>
        </div>
        {/* Invoice Body */}
        <div style={{ padding: "18px 24px", overflowY: "auto" }}>
          {dispatchesError && (
            <div style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontFamily: F.ui, fontSize: 12, color: "#C0392B", fontWeight: 600 }}>
              Failed to load dispatch details — some fields below may be showing fallback values.
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.borderDef}` }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.royalBurgundy }}>TAX INVOICE</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{inv.id}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>Date: {inv.invoiceDate}</div>
              {bulkOrderData && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.07)", border: `1px solid rgba(110,15,45,0.16)`, borderRadius: 6, padding: "3px 8px", width: "fit-content" }}>
                    <ShoppingBag size={10} color={T.royalBurgundy} />
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrderData.ref}</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>
                    {bulkOrderData.sareeType || "Sarees"} · {bulkOrderData.design || "Design"}
                  </div>
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", maxWidth: "55%" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bill To</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{inv.customer}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3, lineHeight: 1.4 }}>{inv.city || "G-12, Silk Plaza, Madhapur, Hyderabad - 500081"}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{dispatch?.customerPhone || "+91 98450 11223"}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, marginTop: 2 }}>GST: {dispatch?.gstPct ? "36AAAAA1111A1Z1" : "—"}</div>
            </div>
          </div>
          
          {/* Items */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "6px 0", borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 4 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>Item</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Amount (₹)</div>
            </div>
            {dispatch?.sareeIds ? (
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {dispatch.sareeIds.map((sid, i) => (
                  <div key={sid} style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "5px 0" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{sid}</span>
                        {bulkOrderData?.batches && bulkOrderData.batches.length > 0 && (
                           <span style={{ fontFamily: F.mono, fontSize: 12, background: "rgba(200,155,71,0.12)", color: T.antiqueGold, padding: "2px 5px", borderRadius: 4, border: `1px solid rgba(200,155,71,0.2)` }}>{bulkOrderData.batches[0]}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{bulkOrderData?.design || "Design"} · {bulkOrderData?.sareeType || "Type"}</div>
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" }}>₹{pricePerSaree.toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "5px 0" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>Bulk Order Production</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{bulkOrderData?.design || "Design"} · {bulkOrderData?.sareeType || "Sarees"}</div>
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" }}>₹{inv.total.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
          
          {/* Totals */}
          <div style={{ borderTop: `1.5px solid ${T.borderDef}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Subtotal ({numSarees} sarees)</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>₹{inv.total.toLocaleString("en-IN")}</span>
            </div>
            {dispatch?.gstPct ? (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>GST ({dispatch.gstPct}%)</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>₹{((dispatch.grandTotal || 0) - (dispatch.totalAmount || 0)).toLocaleString("en-IN")}</span>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
              <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>₹{(dispatch?.grandTotal || inv.total).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Dispatch details */}
          <div style={{ marginTop: 14, background: T.silkCream, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Dispatch Details</div>
            {bulkOrderData && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(110,15,45,0.06)", border: `1px solid rgba(110,15,45,0.14)`, borderRadius: 6, padding: "5px 10px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Bulk Order: </span>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrderData.ref}</span>
              </div>
            )}
            {bulkOrderData?.batches && bulkOrderData.batches.length > 0 && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(200,155,71,0.06)", border: `1px solid rgba(200,155,71,0.14)`, borderRadius: 6, padding: "5px 10px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Production Batch: </span>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{bulkOrderData.batches.join(", ")}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
              {[
                ["LR Number", dispatch?.lrNumber || "—"],
                ["Transport", dispatch?.transportCompany || "—"],
                ["Vehicle", dispatch?.vehicleNumber || "—"],
                ["Date", dispatch?.dispatchDate || inv.invoiceDate],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{k}: </span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
    </Modal>
  );
}
