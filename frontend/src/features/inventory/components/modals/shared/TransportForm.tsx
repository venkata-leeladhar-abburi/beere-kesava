import React from "react";
import { Field, TextInput } from "../../common/primitives";
import { Input, Textarea } from "../../../../../shared/ui/primitives";
import { TransportData } from "../../types";

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
        <Input type="date" value={data.dispatchDate} onChange={e => set("dispatchDate")(e.target.value)} className="font-code" />
      </Field>
      {wholesale && (
        <Field label="Expected Delivery">
          <Input type="date" value={data.expectedDelivery ?? ""} onChange={e => set("expectedDelivery")(e.target.value)} className="font-code" />
        </Field>
      )}
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label={wholesale ? "Special Instructions" : "Notes for Admin"}>
          <Textarea
            value={wholesale ? (data.specialInstructions ?? "") : data.notes}
            onChange={e => wholesale ? set("specialInstructions")(e.target.value) : set("notes")(e.target.value)}
            rows={2}
            placeholder="Optional notes…"
            className="resize-none"
          />
        </Field>
      </div>
    </div>
  );
}
