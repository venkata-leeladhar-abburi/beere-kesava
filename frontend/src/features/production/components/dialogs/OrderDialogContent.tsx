import React, { useState } from "react";
import { FileText, Receipt, CalendarClock, ShoppingBag, Eye } from "lucide-react";
import { INVOICES } from "@/features/payments";
import { T, F } from "../theme";
import type { BulkOrder } from "../types";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";
import { Modal } from "../../../../shared/ui/overlay";

interface PreviewInvoice {
  id: string;
  date: string;
  amount: number;
  status: string;
}

export function OrderDialogContent({ order, mode }: { order: BulkOrder; mode: "view" | "slip" }) {
  // Find match from PaymentsPage INVOICES
  const refMatch = order.ref.match(/ORD-\d{4}-(\d+)/) || order.ref.match(/ORD-(.*)/);
  const refNum = refMatch ? refMatch[1] : "";
  const matchedInvoice = INVOICES.find(inv => {
    const invMatch = inv.id.match(/INV-\d{4}-(\d+)/) || inv.id.match(/INV-(.*)/);
    const invNum = invMatch ? invMatch[1] : "";
    return invNum && invNum === refNum;
  }) || INVOICES.find(inv => inv.customer.toLowerCase() === order.customer.toLowerCase());

  const amountDue = matchedInvoice ? matchedInvoice.total : (order.amountDue ?? 0);
  const amountPaid = matchedInvoice ? matchedInvoice.paid : (order.amountPaid ?? 0);
  const balance = amountDue - amountPaid;

  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [previewInvoice, setPreviewInvoice] = useState<PreviewInvoice | null>(null);

  if (mode === "slip") {
    const invoices = matchedInvoice ? [
      { id: matchedInvoice.id, date: matchedInvoice.invoiceDate, amount: matchedInvoice.total, status: matchedInvoice.status.toLowerCase() }
    ] : [
      { id: `INV-2026-${refNum || "001"}`, date: order.due || "18 Jul 2026", amount: amountDue, status: amountPaid >= amountDue ? "paid" : "pending" }
    ].filter(i => i.amount > 0);

    const payments = matchedInvoice ? (matchedInvoice.payments || []) : (
      amountPaid > 0 ? [
        { amount: amountPaid, utr: "UTR202604229988", method: "RTGS", date: "16 May 2026", firmName: "Beere Kesava & Brothers Silks" }
      ] : []
    );

    return (
      <div style={{ fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Order Reference</div>
          <EntityCode type="order" value={order.ref} size="sm" />
        </div>

        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Customer</div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700 }}>{order.customer}</div>
        </div>

        <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold }}>{formatMoney(rupees(balance))}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
          {[
            { label: "Est. Value", val: amountDue > 0 ? formatMoney(rupees(amountDue)) : "—" },
            { label: "Amount Paid", val: amountPaid > 0 ? formatMoney(rupees(amountPaid)) : <Money value={rupees(0)} /> },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", background: "rgba(110,15,45,0.05)", borderRadius: 12, padding: 4, border: `1px solid ${T.borderDef}` }}>
          <Button
            onClick={() => setActiveTab("invoices")}
            variant="ghost"
            className={`flex-1 h-auto py-2.5 rounded-lg text-[13px] font-bold ${activeTab === "invoices" ? "bg-white text-[#6E0F2D] shadow-[0_4px_12px_rgba(110,15,45,0.08)]" : "bg-transparent text-[var(--text-tertiary)]"}`}
          >
            Invoices ({invoices.length})
          </Button>
          <Button
            onClick={() => setActiveTab("payments")}
            variant="ghost"
            className={`flex-1 h-auto py-2.5 rounded-lg text-[13px] font-bold ${activeTab === "payments" ? "bg-white text-[#6E0F2D] shadow-[0_4px_12px_rgba(110,15,45,0.08)]" : "bg-transparent text-[var(--text-tertiary)]"}`}
          >
            Payments ({payments.length})
          </Button>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.02)" }}>
          {activeTab === "invoices" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={16} color={T.royalBurgundy} /> Linked Invoices
                </div>
              </div>
              {invoices.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: T.silkCream, borderRadius: 10 }}>No invoices generated yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 160, overflowY: "auto", paddingRight: 4 }}>
                  {invoices.map((inv) => (
                    <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.warmIvory, borderRadius: 10, border: "1px solid rgba(110,15,45,0.06)", borderLeft: `4px solid ${inv.status === "paid" ? T.green : T.antiqueGold}` }}>
                      <div>
                        <EntityCode type="invoice" value={inv.id} size="sm" />
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{inv.date}</div>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}><Money value={rupees(inv.amount)} /></div>
                          <span style={{ display: "inline-block", fontSize: 12, fontFamily: F.ui, fontWeight: 700, background: inv.status === "paid" ? "rgba(30,102,64,0.11)" : "rgba(200,155,71,0.11)", color: inv.status === "paid" ? T.green : T.antiqueGold, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", marginTop: 4 }}>{inv.status}</span>
                        </div>
                        <Button onClick={() => setPreviewInvoice(inv)} variant="ghost" size="sm" iconLeft={Eye}
                          className="h-auto py-[5px] px-2.5 rounded-md bg-[rgba(110,15,45,0.05)] border border-[rgba(110,15,45,0.1)] text-xs font-semibold text-[#6E0F2D] hover:bg-[rgba(110,15,45,0.1)]">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}>
                  <Receipt size={16} color={T.royalBurgundy} /> Previous Payments
                </div>
              </div>
              {payments.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: T.silkCream, borderRadius: 10 }}>No previous payments recorded.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 160, overflowY: "auto", paddingRight: 4 }}>
                  {payments.map((p) => (
                    <div key={`${p.utr || "no-utr"}-${p.date}-${p.amount}-${p.method}`} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", background: T.warmIvory, borderRadius: 10, border: "1px solid rgba(110,15,45,0.06)", borderLeft: `4px solid ${T.antiqueGold}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.royalBurgundy }}><Money value={rupees(p.amount)} /></div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>{p.utr} · {p.method}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ fontSize: 12, fontFamily: F.ui, fontWeight: 700, background: "rgba(200,155,71,0.11)", color: T.antiqueGold, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{p.firmName || "Beere Kesava & Brothers Silks"}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                            <CalendarClock size={11} /> {p.date}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <Modal open={!!previewInvoice} onOpenChange={(o) => { if (!o) setPreviewInvoice(null); }} size="sm">
          {previewInvoice && (
            <div style={{ width: "100%", background: "#FDFCF7", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid ${T.borderGold}` }}>
                <div style={{ padding: "24px", background: T.royalBurgundy, color: "#FFF", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Beere Kesava & Brothers Silks</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Hyderabad, Telangana</div>
                  </div>
                  <IconButton icon="close" label="Close invoice preview" onClick={() => setPreviewInvoice(null)} variant="ghost" size="sm" className="text-white hover:bg-white/10" />
                </div>
                <div style={{ padding: "18px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.borderDef}` }}>
                    <div>
                      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.royalBurgundy }}>TAX INVOICE</div>
                      <div style={{ marginTop: 2 }}><EntityCode type="invoice" value={previewInvoice.id} size="sm" /></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>Date: {previewInvoice.date}</div>
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.07)", border: `1px solid rgba(110,15,45,0.16)`, borderRadius: 6, padding: "3px 8px", width: "fit-content" }}>
                          <ShoppingBag size={10} color={T.royalBurgundy} />
                          <EntityCode type="order" value={order.ref} size="sm" />
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>
                          {order.sareeType} · {order.design}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", maxWidth: "55%" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bill To</div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{order.customer}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3, lineHeight: 1.4 }}>G-12, Silk Plaza, Madhapur, Hyderabad - 500081</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>+91 98450 11223</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, marginTop: 2 }}>GST: 36AAAAA1111A1Z1</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_100px]" style={{ padding: "6px 0", borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 4 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em" }}>Item</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Amount (₹)</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_100px]" style={{ padding: "5px 0" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>Bulk Order Production</span>
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{order.design} · {order.sareeType}</div>
                      </div>
                      <div style={{ textAlign: "right" }}><Money value={rupees(previewInvoice.amount)} /></div>
                    </div>
                  </div>

                  <div style={{ borderTop: `1.5px solid ${T.borderDef}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Subtotal ({order.total || 0} sarees)</span>
                      <Money value={rupees(previewInvoice.amount)} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
                      <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
                      <Money value={rupees(previewInvoice.amount)} />
                    </div>
                  </div>

                  <div style={{ marginTop: 14, background: T.silkCream, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Dispatch Details</div>
                    <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(110,15,45,0.06)", border: `1px solid rgba(110,15,45,0.14)`, borderRadius: 6, padding: "5px 10px" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Bulk Order: </span>
                      <EntityCode type="order" value={order.ref} size="sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "4px 12px" }}>
                      {[
                        ["LR Number", "wef"],
                        ["Transport", "dsf"],
                        ["Vehicle", "dfsa"],
                        ["Date", previewInvoice.date || "2026-07-18"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{k}: </span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: T.warmIvory, padding: "16px", borderRadius: 12, border: `1px solid ${T.borderDef}` }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 700, fontSize: 18 }}>
          {order.customer.charAt(0)}
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2 }}>{order.customer}</div>
          <div style={{ marginTop: 2 }}><EntityCode type="customer" value={order.customerId || "WHL-00X"} size="sm" /></div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>Order Ref</div>
          <EntityCode type="order" value={order.ref} size="sm" />
        </div>
      </div>

      <div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 8 }}>Order Photos</div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
          {order.photoUrls && order.photoUrls.length > 0 ? (
            order.photoUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", flexShrink: 0 }}
                onMouseEnter={e => { const img = e.currentTarget.querySelector("img"); if (img) img.style.transform = "scale(1.05)"; }}
                onMouseLeave={e => { const img = e.currentTarget.querySelector("img"); if (img) img.style.transform = "scale(1)"; }}>
                <img src={url} alt={`Bulk order attachment ${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.borderDef}`, cursor: "pointer", transition: "transform 0.2s" }} />
              </a>
            ))
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 10, background: "rgba(110,15,45,0.04)", border: `1px dashed rgba(110,15,45,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", color: T.taupe, fontSize: 12, fontFamily: F.ui }}>
              No photos
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <div style={{ background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Quantity (Sarees)</div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{order.total}</div>
        </div>
        <div style={{ background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Delivery Deadline</div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{order.due}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <div style={{ padding: "12px 14px", background: "rgba(200,155,71,0.07)", borderRadius: 10, border: "1px solid rgba(200,155,71,0.20)", display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Estimated Value (₹)</span>
          <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#8B6018" }}>{formatMoney(rupees(amountDue))}</span>
        </div>
        <div style={{ background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Priority</div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{order.status === "at-risk" || order.status === "overdue" ? "Urgent" : "Normal"}</div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>Special Instructions</div>
        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)", minHeight: 60 }}>
          {order.instructions || <span style={{ color: "rgba(139,112,96,0.5)", fontStyle: "italic" }}>No special instructions provided.</span>}
        </div>
      </div>
    </div>
  );
}
