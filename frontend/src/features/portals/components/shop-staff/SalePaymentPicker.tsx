/**
 * New Sale → Payment: how the customer is paying.
 *
 * One method by default, exactly as before. "Split payment" turns the method
 * cards into a multi-select and gives each chosen method its own amount (and
 * reference, for UPI and card) — a customer paying ₹600 in cash and the rest
 * by UPI. The newest untouched row fills itself with whatever is left, so the
 * usual two-way split needs one number typed. See splitPaymentDraft.
 */
import { IndianRupee, Plus, Wallet, CreditCard, X, CheckCircle2, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C, F } from "./theme";
import { OptionCard, ACCENT_SALE } from "./flow-kit";
import { Button, IconButton, Input, SwitchField } from "../../../../shared/ui/primitives";
import { formatMoneyExact, rupees } from "@/lib/domain/money";
import { type CounterPaymentMethod } from "@/lib/domain/salePayment";
import {
  addRow,
  checkSplit,
  fillRemaining,
  formatAmount,
  removeRow,
  rowAmounts,
  setRowAmount,
  setRowReference,
  type SplitDraftRow,
} from "./splitPaymentDraft";

export const PAYMENT_OPTIONS: {
  id: CounterPaymentMethod;
  label: string;
  sub: string;
  icon: LucideIcon;
}[] = [
  { id: "cash", label: "Cash", sub: "Physical currency", icon: IndianRupee },
  { id: "upi", label: "UPI", sub: "GPay, PhonePe, etc.", icon: Wallet },
  { id: "card", label: "Card", sub: "Debit or credit", icon: CreditCard },
  { id: "other", label: "Other", sub: "Cheque / transfer", icon: Plus },
];

/** Only UPI and card have a reference worth asking for. */
const hasReference = (m: CounterPaymentMethod) => m === "upi" || m === "card";
const referenceLabel = (m: CounterPaymentMethod) =>
  m === "upi" ? "UPI reference" : "Card last 4 digits";
const referencePlaceholder = (m: CounterPaymentMethod) =>
  m === "upi" ? "Transaction ID" : "e.g. 4872";

const money = (n: number) => formatMoneyExact(rupees(n));

export interface SalePaymentPickerProps {
  /** What the customer owes, GST included. */
  total: number;
  isMobile: boolean;
  split: boolean;
  onSplitChange: (split: boolean) => void;
  payment: CounterPaymentMethod | null;
  onPaymentChange: (m: CounterPaymentMethod) => void;
  payRef: string;
  onPayRefChange: (ref: string) => void;
  rows: SplitDraftRow[];
  onRowsChange: (rows: SplitDraftRow[]) => void;
}

export function SalePaymentPicker({
  total,
  isMobile,
  split,
  onSplitChange,
  payment,
  onPaymentChange,
  payRef,
  onPayRefChange,
  rows,
  onRowsChange,
}: SalePaymentPickerProps) {
  const toggleMethod = (m: CounterPaymentMethod) =>
    onRowsChange(rows.some((r) => r.method === m) ? removeRow(rows, m) : addRow(rows, m, total));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>
          How is the customer paying?
        </div>
        <SwitchField
          id="split-payment"
          label="Split payment"
          description="Pay with more than one method"
          checked={split}
          onCheckedChange={onSplitChange}
        />
      </div>

      <div
        role={split ? "group" : "radiogroup"}
        aria-label={split ? "Payment methods" : "Payment method"}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {PAYMENT_OPTIONS.map((p) => (
          <OptionCard
            key={p.id}
            name="payment-method"
            icon={p.icon}
            label={p.label}
            sub={p.sub}
            multi={split}
            selected={split ? rows.some((r) => r.method === p.id) : payment === p.id}
            onSelect={() => (split ? toggleMethod(p.id) : onPaymentChange(p.id))}
            accent={ACCENT_SALE}
          />
        ))}
      </div>

      {split ? (
        <SplitRows total={total} isMobile={isMobile} rows={rows} onRowsChange={onRowsChange} />
      ) : (
        // The reference field only exists for the methods that have one —
        // showing it always would be four fields of dead space.
        payment &&
        hasReference(payment) && (
          <div className="max-w-[340px]">
            <label
              htmlFor="pay-ref"
              style={{
                fontFamily: F.u,
                fontWeight: 500,
                fontSize: 14,
                color: C.text,
                display: "block",
                marginBottom: 8,
              }}
            >
              {referenceLabel(payment)}
              <span style={{ color: C.muted, fontWeight: 400 }}> (optional)</span>
            </label>
            <Input
              id="pay-ref"
              value={payRef}
              onChange={(e) => onPayRefChange(e.target.value)}
              maxLength={payment === "card" ? 4 : 100}
              placeholder={referencePlaceholder(payment)}
              size="lg"
              className="w-full font-mono"
            />
          </div>
        )
      )}
    </div>
  );
}

function SplitRows({
  total,
  isMobile,
  rows,
  onRowsChange,
}: {
  total: number;
  isMobile: boolean;
  rows: SplitDraftRow[];
  onRowsChange: (rows: SplitDraftRow[]) => void;
}) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          fontFamily: F.u,
          fontSize: 13,
          color: C.muted,
          padding: "14px 16px",
          border: `1px dashed ${C.bdrMed}`,
          borderRadius: 12,
        }}
      >
        Tap each method the customer is using — for example Cash and UPI.
      </div>
    );
  }

  const amounts = rowAmounts(rows, total);
  const { shortfall, problem } = checkSplit(rows, total);
  const allocated = Math.round((total - shortfall) * 100) / 100;
  const covered = shortfall === 0;
  const tone = covered && !problem ? C.green : shortfall < 0 ? C.crim : "#845E04";

  return (
    <div
      style={{
        border: `1px solid ${C.bdr}`,
        borderRadius: 14,
        overflow: "hidden",
        background: "#FFF",
      }}
    >
      {rows.map((r, i) => {
        const option = PAYMENT_OPTIONS.find((o) => o.id === r.method)!;
        const OptIcon = option.icon;
        const auto = r.amount === null;
        const value = auto ? formatAmount(amounts[i] ?? 0) : r.amount!;
        const invalid = !auto && amounts[i] === null;
        return (
          <div
            key={r.method}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr auto" : "150px 200px 1fr auto",
              alignItems: "center",
              gap: isMobile ? "10px 12px" : 14,
              padding: "14px 16px",
              borderBottom: `1px solid ${C.bdr}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#F8F4F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <OptIcon size={16} color={C.burg} />
              </span>
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>
                {option.label}
              </span>
            </div>

            {isMobile && (
              <RemoveButton
                method={r.method}
                label={option.label}
                rows={rows}
                onRowsChange={onRowsChange}
              />
            )}

            <div style={isMobile ? { gridColumn: "1 / -1" } : undefined}>
              <Input
                aria-label={`${option.label} amount`}
                inputMode="decimal"
                addonLeft="₹"
                value={value}
                invalid={invalid}
                onChange={(e) =>
                  onRowsChange(setRowAmount(rows, r.method, e.target.value.replace(/[^0-9.]/g, "")))
                }
                className="text-right tabular-nums"
              />
              {auto && (
                <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 4 }}>
                  Balance — fills automatically
                </div>
              )}
            </div>

            <div style={isMobile ? { gridColumn: "1 / -1" } : { minWidth: 0 }}>
              {hasReference(r.method) ? (
                <Input
                  aria-label={`${referenceLabel(r.method)} (optional)`}
                  value={r.reference}
                  onChange={(e) => onRowsChange(setRowReference(rows, r.method, e.target.value))}
                  maxLength={r.method === "card" ? 4 : 100}
                  placeholder={`${referencePlaceholder(r.method)} (optional)`}
                  className="w-full font-mono"
                />
              ) : (
                !covered &&
                !auto && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onRowsChange(fillRemaining(rows, r.method, total))}
                    className="p-0 text-xs underline text-[#69635E]"
                  >
                    Make this the balance
                  </Button>
                )
              )}
            </div>

            {!isMobile && (
              <RemoveButton
                method={r.method}
                label={option.label}
                rows={rows}
                onRowsChange={onRowsChange}
              />
            )}
          </div>
        );
      })}

      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          padding: "12px 16px",
          background: "rgba(110,15,45,0.03)",
        }}
      >
        <span
          style={{
            fontFamily: F.u,
            fontSize: 13,
            color: C.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Allocated {money(allocated)} of {money(total)}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: F.u,
            fontWeight: 600,
            fontSize: 13,
            color: tone,
          }}
        >
          {covered && !problem ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {covered && !problem ? "Bill fully covered" : problem}
        </span>
      </div>
    </div>
  );
}

function RemoveButton({
  method,
  label,
  rows,
  onRowsChange,
}: {
  method: CounterPaymentMethod;
  label: string;
  rows: SplitDraftRow[];
  onRowsChange: (rows: SplitDraftRow[]) => void;
}) {
  return (
    <IconButton
      icon={X}
      label={`Remove ${label}`}
      variant="ghost"
      size="sm"
      onClick={() => onRowsChange(removeRow(rows, method))}
    />
  );
}
