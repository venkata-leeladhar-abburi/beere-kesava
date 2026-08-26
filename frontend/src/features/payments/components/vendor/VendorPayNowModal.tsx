import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";

import { F, T } from "../../theme";
import { useFirms } from "@/features/firms";
import { VendorPayment } from "../../types";
import { Button, CurrencyInput, Field, IconButton, Input, Select, SelectItem, Textarea } from "../../../../shared/ui/primitives";
import { vendorPaymentsApi } from "../../../../shared/api/payments";
import { Modal } from "../../../../shared/ui/overlay";
import { DatePicker, formatDate } from "../../../../shared/ui/date";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { toPaise, fromPaise } from "@/lib/gst";

export function VendorPayNowModal({ vp, onClose, onSave }: { vp: VendorPayment; onClose: () => void; onSave: (amount: number, firmId: string) => void }) {
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
      id: p.id,
      amount: Number(p.amount),
      date: p.date ? p.date.split("T")[0] : "—",
      firm: firms.find(f => f.id === p.firmId)?.firmName ?? p.firmId ?? "—",
      utr: p.utr ?? "—",
      method: p.method ?? "—",
    }));
  const [amount, setAmount] = useState(String(balance));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [firmId, setFirmId] = useState(firms[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const numericAmount = amount === "" || isNaN(Number(amount)) ? NaN : fromPaise(toPaise(Number(amount)));
    if (!amount || isNaN(numericAmount) || numericAmount <= 0 || !utr || !firmId) return;
    if (!vp.billId) {
      setSaveError("No bill has been raised against this PO yet — add an invoice first.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await vendorPaymentsApi.create({
        vendorId: vp.vendorId ?? vp.id,
        amount: numericAmount,
        utr: utr.trim() || undefined,
        method: method.trim() || undefined,
        firmId: firmId.trim() || undefined,
        date: date || undefined,
        billId: vp.billId,
      });
      onSave(numericAmount, firmId);
    } catch (err) {
      console.error("Failed to record vendor payment:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to record payment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="lg">
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
          <Dialog.Title asChild>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>Pay Vendor — {vp.vendor}</div>
          </Dialog.Title>
          <Dialog.Description className="sr-only">Record a payment to {vp.vendor}</Dialog.Description>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm"
              className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ padding: "24px 28px", display: "grid", gap: 32, alignItems: "start", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* Left Column: Payment History & Invoice Upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Payment History</div>
              {history.length === 0 ? (
                <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>No payments recorded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {history.map((h) => (
                    <div key={h.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr]" style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 14px", display: "grid", gap: "8px 10px" }}>
                      <div><div style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Amount</div><div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}><Money value={rupees(h.amount)} /></div></div>
                      <div><div style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Date</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.date}</div></div>
                      <div><div style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Paying Firm</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.firm}</div></div>
                      <div style={{ gridColumn: "1 / 3" }}><div style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>UTR</div><div style={{ fontSize: 12, color: T.luxuryBrown, fontVariantNumeric: "tabular-nums" }}>{h.utr}</div></div>
                      <div><div style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>Method</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{h.method}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Upload Invoice Document</div>
              <div
                onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => fileInputRef.current?.click())?.(); } }}
                style={{
                  background: "#FFFFFF", border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, padding: "20px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.02)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = T.borderDef; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <FileText size={20} color={T.royalBurgundy} />
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>Click to upload invoice</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>PDF, JPG, PNG up to 10MB</div>
                <Input type="file" ref={fileInputRef} containerClassName="hidden" accept=".pdf,image/*" />
              </div>
            </div>
          </div>

          {/* Right Column: Payment Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold }}><Money value={rupees(balance)} /></div>
            </div>

            {/* eslint-disable-next-line no-restricted-syntax -- form field label text, not a money value display */}
            <Field label="Amount to Pay (₹)" required id="amount-to-pay">
              <CurrencyInput value={amount === "" ? "" : Number(amount)} onValueChange={v => setAmount(v === "" ? "" : String(v))} />
            </Field>
            <Field label="Payment Date" required id="payment-date">
              <DatePicker value={date ? new Date(date) : null} onChange={d => setDate(d ? formatDate(d, "iso") : "")} />
            </Field>
            <Field label="UTR Number" required id="utr-number">
              <Input value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. UTR2026053012345" />
            </Field>
            <Field label="Payment Method" id="payment-method">
              <Select value={method} onValueChange={setMethod}>
                {["Bank Transfer", "Cheque", "RTGS", "NEFT"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Paying from Firm" required id="paying-from-firm">
              <Select value={firmId} onValueChange={setFirmId}>
                {firms.map(f => <SelectItem key={f.id} value={f.id}>{f.firmName}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Notes (optional)" id="notes-optional">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </Field>
          </div>
        </div>

        {!vp.billId && (
          <div style={{ margin: "0 28px", padding: "10px 14px", borderRadius: 10, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", fontFamily: F.ui, fontSize: 13, color: "#C0392B", fontWeight: 600 }}>
            No bill has been raised against this PO yet — add an invoice before recording a payment.
          </div>
        )}
        {saveError && (
          <div style={{ margin: "0 28px", padding: "10px 14px", borderRadius: 10, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", fontFamily: F.ui, fontSize: 13, color: "#C0392B", fontWeight: 600 }}>
            {saveError}
          </div>
        )}
        <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
          <Button variant="tertiary" onClick={onClose} className="rounded-full text-[var(--text-tertiary)]">Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !vp.billId} loading={saving} className="rounded-full bg-[#6E0F2D]">
            Confirm Payment
          </Button>
        </div>
    </Modal>
  );
}
