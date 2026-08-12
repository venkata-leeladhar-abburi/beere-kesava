import { useState } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { F, T } from "../../theme";
import { Supplier } from "../../../suppliers/contexts/SupplierContext";
import { Button, CurrencyInput, Field, IconButton, Input, Select, SelectItem } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DatePicker, formatDate } from "../../../../shared/ui/date";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

export function SupplierPayNowModal({
  supplier, outstanding, onClose, onSave, saving,
}: {
  supplier: Supplier;
  outstanding: number;
  onClose: () => void;
  onSave: (payload: { amount: number; date: string; mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque"; reference: string }) => void;
  saving: boolean;
}) {
  const [amount, setAmount] = useState(String(outstanding > 0 ? outstanding : ""));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<"Cash" | "Bank Transfer" | "UPI" | "Cheque">("Bank Transfer");
  const [reference, setReference] = useState("");

  const numericAmount = parseFloat(amount);
  const canSave = !!amount && !isNaN(numericAmount) && numericAmount > 0 && !saving;

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="md">
      <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", flexShrink: 0 }}>
        <Dialog.Title asChild>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>Pay Supplier — {supplier.name}</div>
        </Dialog.Title>
        <Dialog.Close asChild>
          <IconButton icon={X} label="Close" variant="ghost" size="sm"
            className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]" />
        </Dialog.Close>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold }}><Money value={rupees(outstanding)} /></div>
        </div>

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
      </div>

      <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
        <Button variant="tertiary" onClick={onClose} className="rounded-full text-[var(--text-tertiary)]">Cancel</Button>
        <Button variant="primary" disabled={!canSave} loading={saving} className="rounded-full bg-[#6E0F2D]"
          onClick={() => onSave({ amount: numericAmount, date, mode, reference: reference.trim() })}>
          Confirm Payment
        </Button>
      </div>
    </Modal>
  );
}
