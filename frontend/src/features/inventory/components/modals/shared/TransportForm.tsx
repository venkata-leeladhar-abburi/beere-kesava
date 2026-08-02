import React from "react";
import { T, F, inp } from "../../theme";
import { TransportData } from "../../types";
import { Field, TextInput } from "../../common/primitives";

// ── Transport form (shared between shop + wholesale) ──────────────────────────
export function TransportForm({ data, onChange, wholesale }: { data: TransportData; onChange: (d: TransportData) => void; wholesale?: boolean }) {
  const set = (k: keyof TransportData) => (v: string) => onChange({ ...data, [k]: v });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
      <Field label="LR Number" req><TextInput value={data.lrNumber} onChange={set("lrNumber")} placeholder="e.g. LR-20260702-001" mono /></Field>
      <Field label="Transport Company" req><TextInput value={data.transportCompany} onChange={set("transportCompany")} placeholder="e.g. Shyam Carriers" /></Field>
      <Field label="Vehicle Number" req><TextInput value={data.vehicleNumber} onChange={set("vehicleNumber")} placeholder="e.g. AP09AB1234" mono /></Field>
      <Field label="Driver Name"><TextInput value={data.driverName} onChange={set("driverName")} placeholder="Optional" /></Field>
      <Field label="Dispatch Date" req>
        <input type="date" value={data.dispatchDate} onChange={e => set("dispatchDate")(e.target.value)}
          style={{ ...inp, fontFamily: F.mono }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
          onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
      </Field>
      {wholesale && (
        <Field label="Expected Delivery">
          <input type="date" value={data.expectedDelivery ?? ""} onChange={e => set("expectedDelivery")(e.target.value)}
            style={{ ...inp, fontFamily: F.mono }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
            onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
        </Field>
      )}
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label={wholesale ? "Special Instructions" : "Notes for Admin"}>
          <textarea value={wholesale ? (data.specialInstructions ?? "") : data.notes}
            onChange={e => wholesale ? set("specialInstructions")(e.target.value) : set("notes")(e.target.value)}
            rows={2} placeholder="Optional notes…"
            style={{ ...inp, resize: "none" as const, lineHeight: 1.55 }}
            onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = T.royalBurgundy; }}
            onBlur={e =>  { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
        </Field>
      </div>
    </div>
  );
}
