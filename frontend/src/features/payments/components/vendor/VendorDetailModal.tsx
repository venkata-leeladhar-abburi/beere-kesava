import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PurchaseOrder } from "../../../purchasing/contexts/POContext";
import { F, T, useFirms } from "../../theme";
import { Invoice, VendorPayment } from "../../types";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { vendorPaymentsApi } from "../../../../shared/api/payments";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

// ── Vendor Detail Modal ───────────────────────────────────────────────────────
export function VendorDetailModal({ vp, matchedPO, onClose }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onClose: () => void }) {
  const { firms } = useFirms();
  const balance = vp.invoiceAmt - vp.paidAmt;
  const vendorId = vp.vendorId ?? vp.id;
  const { data: paymentsRes } = useQuery({
    queryKey: ["vendor-payments", vendorId],
    queryFn: () => vendorPaymentsApi.list(vendorId),
  });
  const history = (paymentsRes?.items ?? [])
    .filter(p => !vp.billId || p.billId === vp.billId)
    .map(p => ({
      amount: Number(p.amount),
      date: p.date ? p.date.split("T")[0] : "—",
      firm: firms.find(f => f.id === p.firmId)?.firmName ?? p.firmId ?? "—",
      utr: p.utr ?? "—",
      method: p.method ?? "—",
    }));
  const vendorName = matchedPO?.vendor ?? vp.vendor;

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="md">
      <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "calc(100dvh - 96px)", background: T.warmIvory, borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
          <Dialog.Title style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9", margin: 0 }}>{vendorName}</Dialog.Title>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: T.goldLight, marginTop: 4 }}>{vp.poNumber}</div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose}
              className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
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
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}><Money value={rupees(vp.invoiceAmt)} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Paid</span>
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: T.green }}><Money value={rupees(vp.paidAmt)} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Balance</span>
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: balance === 0 ? T.green : T.crimson }}><Money value={rupees(balance)} /></span>
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
                    <div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Amount</div><div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}><Money value={rupees(h.amount)} /></div></div>
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

        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="primary" onClick={onClose} className="rounded-full bg-[#6E0F2D]">Close</Button>
        </div>
      </div>
    </Modal>
  );
}
