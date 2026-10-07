import { Receipt } from "lucide-react";
import type { DiscountType, PurchaseBill } from "@/features/suppliers";
import { formatMoneyExact, rupees } from "@/lib/domain/money";
import { T, F } from "../../theme";
import { Field, Input, NumberInput } from "../../../../../../shared/ui/primitives";
import { FormState } from "../../types";

const toNumberValue = (v: string): number | "" => (v === "" ? "" : Number(v));

/**
 * "Bill Summary" — the last section of the Add/Edit Purchase form, below the
 * saree lines. The sarees' buying total is the subtotal; a discount (% or ₹)
 * comes off it, GST is added on what's left, and the result is the bill
 * amount saved for the purchase. Nothing here is typed as a bill total —
 * the server recalculates the same figures on save.
 */
export function BillSummary({
  form,
  set,
  bill,
  sareeCount,
  previousBill,
}: {
  form: FormState;
  set: (key: keyof FormState, value: string) => void;
  bill: PurchaseBill;
  sareeCount: number;
  /** The bill amount stored before this edit, when it differs from the
   *  calculated one (an older, hand-typed bill) — shown so the change is seen. */
  previousBill?: string;
}) {
  const discountType = form.discountType;
  const setDiscountType = (t: DiscountType) => set("discountType", t);
  const gstPercent = Number(form.gstPercent) || 0;
  const discountValue = Number(form.discountValue) || 0;

  const row = (label: string, value: string, color: string = T.luxuryBrown, bold = false) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "5px 0",
      }}
    >
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{label}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: bold ? 700 : 600,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        marginTop: 20,
        border: `1px solid ${T.borderGold}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: T.silkCream,
          borderBottom: `1px solid ${T.borderGold}`,
        }}
      >
        <Receipt size={15} color={T.royalBurgundy} />
        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>
          Bill Summary
        </span>
      </div>

      <div style={{ padding: "14px" }}>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
          <Field label="Discount (optional)" className="min-w-0">
            <div style={{ display: "flex", gap: 8, minWidth: 0 }}>
              <div
                role="group"
                aria-label="Discount type"
                style={{
                  display: "flex",
                  flexShrink: 0,
                  border: `1px solid ${T.borderDef}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  height: 40,
                }}
              >
                {(
                  [
                    ["percent", "%"],
                    // eslint-disable-next-line no-restricted-syntax -- input adornment / unit toggle, not a rendered money value
                    ["amount", "₹"],
                  ] as const
                ).map(([value, label]) => {
                  const active = discountType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      aria-label={
                        value === "percent" ? "Discount as percentage" : "Discount as amount"
                      }
                      onClick={() => setDiscountType(value)}
                      style={{
                        width: 40,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: F.ui,
                        fontWeight: 700,
                        fontSize: 14,
                        background: active ? T.royalBurgundy : "#FFF",
                        color: active ? "#FFF" : T.taupe,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <NumberInput
                aria-label={discountType === "percent" ? "Discount percentage" : "Discount amount"}
                step={0.01}
                min={0}
                value={toNumberValue(form.discountValue)}
                onValueChange={(v) => set("discountValue", v === "" ? "" : String(v))}
                placeholder={discountType === "percent" ? "e.g. 5" : "e.g. 1,500"}
                // eslint-disable-next-line no-restricted-syntax -- input adornment / unit annotation, not a rendered money value
                addonRight={discountType === "percent" ? "%" : "₹"}
                containerClassName="flex-1 min-w-0"
              />
            </div>
          </Field>
          <Field label="GST (%)" className="min-w-0">
            <NumberInput
              step={0.01}
              min={0}
              max={100}
              value={toNumberValue(form.gstPercent)}
              onValueChange={(v) => set("gstPercent", v === "" ? "" : String(v))}
              placeholder="e.g. 5"
              addonRight="%"
              containerClassName="w-full min-w-0"
            />
          </Field>
          <Field label="GST Number (optional)" className="min-w-0 md:col-span-2">
            <Input
              className="font-mono"
              value={form.gstNumber}
              onChange={(e) => set("gstNumber", e.target.value.toUpperCase())}
              placeholder="e.g. 37ABCRS1234F1Z5"
            />
          </Field>
        </div>

        {bill.error && (
          <div
            role="alert"
            style={{ marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.crimson }}
          >
            {bill.error}
          </div>
        )}

        <div style={{ marginTop: 14, borderTop: `1px dashed ${T.borderDef}`, paddingTop: 8 }}>
          {row(`Sarees total (${sareeCount} pc)`, formatMoneyExact(rupees(bill.subtotal)))}
          {bill.discountAmount > 0 &&
            row(
              `Discount${discountType === "percent" ? ` (${discountValue}%)` : ""}`,
              `− ${formatMoneyExact(rupees(bill.discountAmount))}`,
              T.green
            )}
          {bill.discountAmount > 0 &&
            gstPercent > 0 &&
            row("Total after discount", formatMoneyExact(rupees(bill.taxable)))}
          {gstPercent > 0 &&
            row(`GST (${gstPercent}%)`, `+ ${formatMoneyExact(rupees(bill.gstAmount))}`)}
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            background: "rgba(110,15,45,0.05)",
            border: `1px solid ${T.borderDef}`,
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
            Final Bill Amount
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 700,
              color: T.royalBurgundy,
            }}
          >
            {formatMoneyExact(rupees(bill.billAmount))}
          </span>
        </div>

        {previousBill && (
          <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            Previously recorded bill:{" "}
            <strong style={{ color: T.luxuryBrown }}>{previousBill}</strong>. Saving replaces it
            with the amount calculated above. Payments already made stay as they are.
          </div>
        )}
      </div>
    </div>
  );
}
