import { Field, TextInput } from "../../common/primitives";
import { Textarea } from "../../../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../../../shared/ui/date";
import { TransportData } from "../../types";

// ── Transport form (shared between shop + wholesale) ──────────────────────────
export function TransportForm({ data, onChange, wholesale }: { data: TransportData; onChange: (d: TransportData) => void; wholesale?: boolean }) {
  const set = (k: keyof TransportData) => (v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "14px 20px" }}>
      <Field label="LR Number"><TextInput value={data.lrNumber} onChange={set("lrNumber")} placeholder="e.g. LR-20260702-001" mono /></Field>
      <Field label="Transport Company"><TextInput value={data.transportCompany} onChange={set("transportCompany")} placeholder="e.g. Shyam Carriers" /></Field>
      <Field label="Vehicle Number"><TextInput value={data.vehicleNumber} onChange={set("vehicleNumber")} placeholder="e.g. AP09AB1234" mono /></Field>
      <Field label="Driver Name"><TextInput value={data.driverName} onChange={set("driverName")} placeholder="Optional" /></Field>
      <Field label="Dispatch Date">
        <DatePicker value={data.dispatchDate ? new Date(data.dispatchDate) : null} onChange={d => set("dispatchDate")(d ? formatDate(d, "iso") : "")} />
      </Field>
      {wholesale && (
        <Field label="Expected Delivery">
          <DatePicker value={data.expectedDelivery ? new Date(data.expectedDelivery) : null} onChange={d => set("expectedDelivery")(d ? formatDate(d, "iso") : "")} />
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
