import { F, T } from "../../theme";
import { VendorPayment } from "../../types";
import type { Firm } from "@/features/firms";
import { Button, CurrencyInput, Field, Input, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../../shared/ui/date";
import { rupees } from "@/lib/domain/money";
import { EntityCode, Money } from "@/shared/ui/domain";

interface RecordVendorPaymentSidebarProps {
  vendorPayments: VendorPayment[];
  selVendor: string;
  setSelVendor: (v: string) => void;
  payAmount: string;
  setPayAmount: (v: string) => void;
  payDate: string;
  setPayDate: (v: string) => void;
  payMethod: string;
  setPayMethod: (v: string) => void;
  utrNumber: string;
  setUtrNumber: (v: string) => void;
  firms: Firm[];
  firmId: string;
  setFirmId: (v: string) => void;
  selVP: VendorPayment;
  selBalance: number;
  afterPay: number;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export function RecordVendorPaymentSidebar({
  vendorPayments,
  selVendor,
  setSelVendor,
  payAmount,
  setPayAmount,
  payDate,
  setPayDate,
  payMethod,
  setPayMethod,
  utrNumber,
  setUtrNumber,
  firms,
  firmId,
  setFirmId,
  selVP,
  selBalance,
  afterPay,
  onSave,
  onCancel,
  saving,
}: RecordVendorPaymentSidebarProps) {
  const canSave = !!selVP.billId && !!payAmount && Number(payAmount) > 0 && !!utrNumber.trim() && !!firmId && !saving;
  return (
    <div className="w-full lg:w-[272px] shrink-0" style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.07)" }}>
      <div style={{ background: T.darkBurgundy, padding: "16px 20px" }}>
        <div style={{ fontFamily: F.display, fontSize: 18, color: "#FFFDF9" }}>Record Vendor Payment</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.55)", marginTop: 3 }}>Mark payment made to a vendor</div>
      </div>
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Select Vendor" id="select-vendor">
          <Select value={selVendor} onValueChange={v => { setSelVendor(v); setPayAmount(""); }}>
            {vendorPayments.filter(v => v.status !== "Paid").map(v => (
              <SelectItem key={v.id} value={v.id}>{v.vendor}</SelectItem>
            ))}
          </Select>
        </Field>

        <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>PO Number</span>
            <EntityCode type="purchaseOrder" value={selVP.poNumber} size="sm" />
          </div>
          {[
            { label: "Invoice Total", val: rupees(selVP.invoiceAmt), color: T.luxuryBrown },
            { label: "Previous Paid", val: rupees(selVP.paidAmt),    color: T.green },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{row.label}</span>
              <span style={{ fontSize: 12, color: row.color, fontWeight: 700 }}><Money value={row.val} /></span>
            </div>
          ))}
          <div style={{ height: 1, background: T.borderDef, margin: "2px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>Balance Due</span>
            <span style={{ fontSize: 14, color: T.crimson, fontWeight: 700 }}><Money value={rupees(selBalance)} /></span>
          </div>
        </div>

        <Field label="Payment Amount">
          <CurrencyInput
            value={payAmount === "" ? "" : Number(payAmount)}
            onValueChange={v => setPayAmount(v === "" ? "" : String(v))}
            placeholder="Enter amount paid"
          />
        </Field>
        <Field label="Payment Date" id="payment-date">
          <DatePicker value={payDate ? new Date(payDate) : null} onChange={d => setPayDate(d ? formatDate(d, "iso") : "")} />
        </Field>
        <Field label="Payment Method" id="payment-method">
          <Select value={payMethod} onValueChange={setPayMethod}>
            {["Bank Transfer","Cash","Cheque","NEFT/RTGS","UPI"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </Select>
        </Field>
        <Field label="UTR Number" id="utr-number">
          <Input value={utrNumber} onChange={e => setUtrNumber(e.target.value)} placeholder="Bank transaction reference..." />
        </Field>
        <Field label="Paying from Firm" id="paying-from-firm">
          <Select value={firmId} onValueChange={setFirmId}>
            {firms.map(f => <SelectItem key={f.id} value={f.id}>{f.firmName}</SelectItem>)}
          </Select>
        </Field>
        {!selVP.billId && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 8, padding: "8px 10px" }}>
            No bill has been raised against this PO yet — add an invoice before recording a payment.
          </div>
        )}
        {payAmount && (
          <div style={{ background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>Balance After This Payment</div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: afterPay <= 0 ? T.green : T.royalBurgundy }}>
              {afterPay <= 0 ? "Fully Paid ✓" : <Money value={rupees(afterPay)} />}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="tertiary" onClick={onCancel} className="flex-1 rounded-[9px] text-[var(--text-tertiary)]">Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={!canSave} loading={saving} className="flex-[2] rounded-[9px] bg-[#6E0F2D]">
            Save Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
