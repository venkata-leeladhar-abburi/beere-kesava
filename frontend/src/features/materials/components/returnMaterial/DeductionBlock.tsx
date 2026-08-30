import React from "react";
import { AlertTriangle } from "lucide-react";
import { F, T } from "../issueMaterial/theme";
import { Input, NumberInput } from "../../../../shared/ui/primitives";

// Optional deduction entry — used when the material actually returned
// doesn't match what was issued/outstanding, mirroring the deduction field
// already used on WeaverPayment/QcRecord elsewhere in the app. Stored on the
// return record for visibility; applying it to the weaver's payout is a
// manual step on the Payments page (not auto-wired here).
export function DeductionBlock({ amount, setAmount, reason, setReason, showReasonError }: {
  amount: string; setAmount: (v: string) => void;
  reason: string; setReason: (v: string) => void;
  /** True when an amount has been entered but no reason yet — a deduction must always say why. */
  showReasonError?: boolean;
}) {
  return (
    <div style={{ background: "rgba(196,146,58,0.08)", border: `1px solid ${T.antiqueGold}`, borderRadius: 14, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AlertTriangle size={15} color="#8B6018" />
        <span style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018", fontWeight: 600 }}>
          If the returned material doesn't match what's outstanding, note a deduction here.
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
        <div>
          <label htmlFor="deduction-amount" style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>Deduction Amount (₹)</label>
          <NumberInput
            id="deduction-amount"
            value={amount === "" ? "" : Number(amount)}
            onValueChange={v => setAmount(v === "" ? "" : String(v))}
            placeholder="0"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="deduction-reason" style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Reason {amount ? <span style={{ color: T.crimson }}>*</span> : null}
          </label>
          <Input
            id="deduction-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. 400g Warp short-returned"
            className="w-full"
          />
          {showReasonError && (
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.crimson, marginTop: 4 }}>
              Reason is required whenever a deduction amount is entered — this is what the weaver will see when they're paid.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
