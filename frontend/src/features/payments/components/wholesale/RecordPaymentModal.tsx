import { useState } from "react";
import { CalendarClock, Receipt, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { F, T, useFirms } from "../../theme";
import { Invoice } from "../../types";
import { Button, CurrencyInput, Field, IconButton, Input, Select, SelectItem, Textarea } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DatePicker, formatDate } from "../../../../shared/ui/date";

// ── Record Payment Modal ──────────────────────────────────────────────────────
export function RecordPaymentModal({ inv, onClose, onSave }: { inv: Invoice; onClose: () => void; onSave: (amount: number, firmId: string, utr: string, date: string, method: string) => void }) {
  const { firms } = useFirms();
  const remaining = inv.total - inv.paid;
  const [amount, setAmount] = useState(String(remaining));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [firmId, setFirmId] = useState(firms[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!amount || !utr || !firmId) return;
    setSaving(true);
    setTimeout(() => {
      onSave(parseFloat(amount), firmId, utr, date, method);
      setSaving(false);
    }, 500);
  };

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="sm">
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
          <Dialog.Title asChild>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>Record Payment — {inv.customer}</div>
          </Dialog.Title>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm"
              className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
          </Dialog.Close>
        </div>

        <div style={{ padding: "24px 28px 8px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{inv.id}</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Reference</span>
          </div>

          <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold }}>₹{remaining.toLocaleString("en-IN")}</div>
          </div>

          {/* Previous Payments */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}>
                <Receipt size={16} color={T.royalBurgundy} /> Previous Payments
              </div>
              <span style={{ fontSize: 12, fontFamily: F.ui, color: T.taupe, fontWeight: 600 }}>
                {inv.payments?.length || 0} transaction{inv.payments?.length !== 1 ? "s" : ""}
              </span>
            </div>

            {(!inv.payments || inv.payments.length === 0) ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: T.silkCream, borderRadius: 10 }}>
                No previous payments recorded.
              </div>
            ) : (
              <div className="section-nav-scroll" style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                {inv.payments.map((p, idx) => (
                  <div key={idx} style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "12px 14px", background: T.warmIvory,
                    borderRadius: 10, border: "1px solid rgba(110,15,45,0.06)",
                    borderLeft: `4px solid ${T.antiqueGold}`,
                    boxShadow: "0 2px 6px rgba(74,6,27,0.01)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.royalBurgundy }}>
                          ₹{p.amount.toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                          {p.utr} · {p.method}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 12, fontFamily: F.mono, fontWeight: 700, background: "rgba(200,155,71,0.11)", color: T.antiqueGold, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {p.firmName ?? "Beere Kesava & Brothers Silks"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          <CalendarClock size={11} /> {p.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="Amount Received (₹)" required id="amount-received">
            <CurrencyInput value={amount === "" ? "" : Number(amount)} onValueChange={v => setAmount(v === "" ? "" : String(v))} />
          </Field>
          <Field label="Payment Date" required id="payment-date">
            <DatePicker value={date ? new Date(date) : null} onChange={d => setDate(d ? formatDate(d, "iso") : "")} />
          </Field>
          <Field label="UTR Number" required id="utr-number">
            <Input value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. UTR2026042812345" />
          </Field>
          <Field label="Payment Method" id="payment-method">
            <Select value={method} onValueChange={setMethod}>
              {["Bank Transfer", "Cheque", "Cash"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Firm Receiving Payment" required id="firm-receiving-payment">
            <Select value={firmId} onValueChange={setFirmId}>
              {firms.map(f => <SelectItem key={f.id} value={f.id}>{f.firmName}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Notes (optional)" id="notes-optional">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </Field>
        </div>

        <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <Button variant="tertiary" onClick={onClose} className="rounded-full text-[var(--text-tertiary)]">Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving} className="rounded-full bg-[#6E0F2D]">
            Save Payment
          </Button>
        </div>
    </Modal>
  );
}
