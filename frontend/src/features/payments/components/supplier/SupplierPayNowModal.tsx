import { useState } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { F, T } from "../../theme";
import { Supplier, Purchase, PurchaseBillBreakdown, parseINR } from "@/features/suppliers";
import { useFirms } from "@/features/firms";
import { Button, CurrencyInput, Field, IconButton, Input, Select, SelectItem } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DatePicker, formatDate } from "../../../../shared/ui/date";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { toPaise, fromPaise } from "@/lib/gst";

export function SupplierPayNowModal({
  supplier, outstanding, openPurchases, paidFor, onClose, onSave, saving,
}: {
  supplier: Supplier;
  outstanding: number;
  /** This supplier's purchases that still have money owed — lets the payment settle a specific bill. */
  openPurchases: Purchase[];
  /** Paid so far against one purchase (sum of its linked payments). */
  paidFor: (purchaseId: string) => number;
  onClose: () => void;
  onSave: (payload: { amount: number; date: string; mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque"; reference: string; purchaseId?: string; firmId?: string }) => void;
  saving: boolean;
}) {
  const { firms } = useFirms();
  const connectedFirm = supplier.firmId ? firms.find(f => f.id === supplier.firmId) : undefined;
  // Defaults to the supplier's connected firm — still changeable per payment.
  const [firmId, setFirmId] = useState<string>(supplier.firmId ?? "");
  const [amount, setAmount] = useState(String(outstanding > 0 ? outstanding : ""));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<"Cash" | "Bank Transfer" | "UPI" | "Cheque">("Bank Transfer");
  const [reference, setReference] = useState("");
  const [purchaseId, setPurchaseId] = useState<string>("");
  const selectedPurchase = openPurchases.find(p => p.id === purchaseId) ?? null;
  const balanceOf = (p: Purchase) => Math.max(0, parseINR(p.billAmount) - paidFor(p.id));

  // Picking a bill pre-fills what's left on it; going back to a general
  // payment restores the supplier's whole outstanding.
  const choosePurchase = (id: string) => {
    setPurchaseId(id);
    const p = openPurchases.find(x => x.id === id);
    const next = p ? balanceOf(p) : outstanding;
    setAmount(next > 0 ? String(next) : "");
  };

  const numericAmount = amount === "" || isNaN(Number(amount)) ? NaN : fromPaise(toPaise(Number(amount)));
  const canSave = !!amount && !isNaN(numericAmount) && numericAmount > 0 && !saving;

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="md">
      <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", paddingRight: 56, position: "relative", flexShrink: 0 }}>
        <Dialog.Title asChild>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>Pay Supplier — {supplier.name}</div>
        </Dialog.Title>
        <Dialog.Description className="sr-only">Record a payment to {supplier.name}</Dialog.Description>
        <Dialog.Close asChild>
          <IconButton icon={X} label="Close" variant="ghost" size="sm"
            className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
        </Dialog.Close>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold }}><Money value={rupees(outstanding)} /></div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>
            Connected firm:{" "}
            <strong style={{ color: connectedFirm ? T.luxuryBrown : T.taupe }}>
              {connectedFirm?.firmName ?? (supplier.firmId || "Not connected")}
            </strong>
          </div>
        </div>

        {openPurchases.length > 0 && (
          <Field label="Apply to Purchase (optional)" id="supplier-apply-to-purchase" hint="Leave unset for a general payment not tied to one bill">
            <Select value={purchaseId || "__none__"} onValueChange={v => choosePurchase(v === "__none__" ? "" : v)} className="w-full" align="start">
              <SelectItem value="__none__">General payment (no specific purchase)</SelectItem>
              {openPurchases.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.id} — {p.billAmount}{p.invoiceNumber ? ` · Inv ${p.invoiceNumber}` : ""}</SelectItem>
              ))}
            </Select>
          </Field>
        )}
        {selectedPurchase && (
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, marginBottom: 6 }}>Bill Summary — {selectedPurchase.id}</div>
            <PurchaseBillBreakdown purchase={selectedPurchase} paid={paidFor(selectedPurchase.id)} />
          </div>
        )}

        {/* eslint-disable-next-line no-restricted-syntax -- form field label text, not a money value display */}
        <Field label="Amount to Pay (₹)" required id="supplier-amount-to-pay">
          <CurrencyInput value={amount === "" ? "" : Number(amount)} onValueChange={v => setAmount(v === "" ? "" : String(v))} />
        </Field>
        <Field label="Payment Date" required id="supplier-payment-date">
          <DatePicker value={date ? new Date(date) : null} onChange={d => setDate(d ? formatDate(d, "iso") : "")} />
        </Field>
        <Field label="Payment Mode" id="supplier-payment-mode">
          <Select value={mode} onValueChange={v => setMode(v as typeof mode)}>
            {(["Bank Transfer", "Cash", "UPI", "Cheque"] as const).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </Select>
        </Field>
        <Field label="Reference / UTR (optional)" id="supplier-reference">
          <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. UTR2026053012345" />
        </Field>
        <Field label="Paid from Firm" id="supplier-paid-from-firm" hint={connectedFirm ? "Defaults to this supplier's connected firm" : "Which of our firms this payment is made from"}>
          <Select value={firmId || "__none__"} onValueChange={v => setFirmId(v === "__none__" ? "" : v)} className="w-full" align="start">
            <SelectItem value="__none__">Not specified</SelectItem>
            {firms.map(f => <SelectItem key={f.id} value={f.id}>{f.firmName}</SelectItem>)}
          </Select>
        </Field>
      </div>

      <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
        <Button variant="tertiary" onClick={onClose} className="rounded-[14px] text-[var(--text-tertiary)]">Cancel</Button>
        <Button variant="primary" disabled={!canSave} loading={saving} className="rounded-[14px] bg-[#6E0F2D]"
          onClick={() => onSave({ amount: numericAmount, date, mode, reference: reference.trim(), purchaseId: purchaseId || undefined, firmId: firmId || undefined })}>
          Confirm Payment
        </Button>
      </div>
    </Modal>
  );
}
