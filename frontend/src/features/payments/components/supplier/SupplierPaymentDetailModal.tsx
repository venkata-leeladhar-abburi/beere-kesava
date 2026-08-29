import React from "react";
import { X, Receipt, ShoppingBag, Image as ImageIcon, User, FileText } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { Supplier, Purchase, SupplierPayment, parseINR } from "@/features/suppliers";
import { F, T } from "../../theme";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { EntityCode, Money } from "@/shared/ui/domain";
import { rupees } from "@/lib/domain/money";
import { formatRecordedBy } from "@/lib/domain/actor";
import { resolveAssetUrl } from "@/shared/api/uploads";

/**
 * Full detail view for one supplier's payment card — invoice amount per
 * purchase, payment history (with who recorded it), the uploaded invoice
 * file, and the per-saree purchase breakdown. Opened from the Supplier
 * Payments card/table "View Details" action.
 */
export function SupplierPaymentDetailModal({
  supplier,
  purchases,
  payments,
  onClose,
}: {
  supplier: Supplier;
  purchases: Purchase[];
  payments: SupplierPayment[];
  onClose: () => void;
}) {
  const sortedPurchases = [...purchases].sort((a, b) => (a.date < b.date ? 1 : -1));
  const sortedPayments = [...payments].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="lg">
      <div style={{ background: T.silkCream, borderRadius: 20, overflow: "hidden", border: `1.5px solid ${T.borderGold}`, display: "flex", flexDirection: "column", maxHeight: "100%", minHeight: 0 }}>
        <div style={{ background: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)", padding: "20px 28px", paddingRight: 56, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div>
            <Dialog.Title asChild>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFFFFF" }}>{supplier.name}</div>
            </Dialog.Title>
            <Dialog.Description asChild>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(231,201,131,0.85)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <EntityCode type="supplier" value={supplier.code || supplier.id} size="sm" className="bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.9)]" />
              </div>
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm"
              className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* ── Purchase Orders (invoice amount + image + sarees) ── */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <ShoppingBag size={16} color={T.royalBurgundy} /> Purchase Orders
            </div>
            {sortedPurchases.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}` }}>
                No purchase orders recorded yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sortedPurchases.map(p => (
                  <div key={p.id} style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <EntityCode type="order" value={p.id} size="sm" copyable />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date} · {p.sareeCount} saree{p.sareeCount !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice Amount</div>
                        <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(parseINR(p.billAmount))} /></div>
                      </div>
                    </div>

                    {/* Invoice image/file */}
                    {p.invoiceFileUrl ? (
                      <a href={resolveAssetUrl(p.invoiceFileUrl) ?? undefined} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, textDecoration: "underline", width: "fit-content" }}>
                        <ImageIcon size={13} /> View invoice file{p.invoiceFileName ? ` — ${p.invoiceFileName}` : ""}
                      </a>
                    ) : p.invoiceFileName ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                        <FileText size={13} /> {p.invoiceFileName} (not uploaded)
                      </span>
                    ) : null}

                    {/* Sarees purchased */}
                    {p.sarees.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${T.borderDef}`, paddingTop: 10 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Sarees Purchased ({p.sarees.length})
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {p.sarees.map(s => (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, background: T.silkCream, borderRadius: 8, border: `1px solid ${T.borderDef}`, padding: "6px 10px" }}>
                              {s.imageUrl && (
                                <img src={resolveAssetUrl(s.imageUrl) ?? undefined} alt={s.sareeType || "Saree"} style={{ width: 28, height: 28, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
                              )}
                              <div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: T.royalBurgundy }}>{s.id}</div>
                                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                                  {s.sareeType || "—"}{s.color ? ` · ${s.color}` : ""}{s.quantity && s.quantity > 1 ? ` × ${s.quantity}` : ""} · <Money value={rupees(s.finalAmount)} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Payment History ── */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Receipt size={16} color={T.royalBurgundy} /> Payment History
            </div>
            {sortedPayments.length === 0 ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}` }}>
                No payments recorded yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sortedPayments.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${T.antiqueGold}`, padding: "10px 14px" }}>
                    <div>
                      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.royalBurgundy }}><Money value={rupees(p.amount)} /></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{p.mode} · {p.date}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>UTR / Reference</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: p.reference ? T.green : T.taupe, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.reference || "—"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                      <User size={11} /> {formatRecordedBy(p.recordedBy)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
