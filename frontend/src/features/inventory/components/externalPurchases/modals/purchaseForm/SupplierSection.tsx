import React from "react";
import { FileText, UploadCloud } from "lucide-react";
import { Supplier } from "@/features/suppliers";
import { T, F } from "../../theme";
import { FormState } from "../../types";
import { inputStyle, labelStyle } from "../../common/primitives";
import { Field, Input, Select, SelectItem, Button, Textarea } from "../../../../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../../../../shared/ui/date";

/**
 * Supplier picker + basic purchase fields (top half of the Add/Edit Purchase
 * form) — picking a registered supplier fills in every detail below;
 * "Other" leaves the fields free for a one-off buy.
 */
export function SupplierSection({
  form,
  setForm,
  set,
  suppliers,
  selectedSupplier,
  pieceCount,
  sareeDetailsCount,
  handleInvoiceFile,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  set: (key: keyof FormState, value: string) => void;
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  pieceCount: number;
  sareeDetailsCount: number;
  handleInvoiceFile: (file: File | null) => void;
}) {
  return (
    <>
      <Field label="Select Supplier" className="mb-3.5">
        <Select
          placeholder="— Choose a registered supplier —"
          value={form.supplierId || (form.supplier ? "__other__" : "")}
          onValueChange={(val) => {
            if (val === "" || val === "__other__") {
              setForm((f) => ({ ...f, supplierId: "", ...(val === "" ? { supplier: "", location: "", gstNumber: "" } : {}) }));
              return;
            }
            const s = suppliers.find((x) => x.id === val);
            if (!s) return;
            setForm((f) => ({
              ...f,
              supplierId: s.id,
              supplier: s.name,
              location: `${s.city}, ${s.state}`,
              gstNumber: s.gstCode,
            }));
          }}
        >
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name} · {s.city} · {s.specialty}</SelectItem>
          ))}
          <SelectItem value="__other__">Other (enter manually)</SelectItem>
        </Select>
      </Field>

      {selectedSupplier && (
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginBottom: 16, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px", gap: 10 }}>
          {[
            ["Supplier ID", selectedSupplier.id],
            ["Contact", selectedSupplier.contactName],
            ["Phone", selectedSupplier.phone],
            ["Supplies", selectedSupplier.specialty],
            ["Payment Terms", selectedSupplier.terms],
            ["GST", selectedSupplier.gstCode || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.9px", color: T.taupe, marginBottom: 3 }}>{String(k).toUpperCase()}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600, wordBreak: "break-word" }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <Field label="Supplier Name">
          <Input
            value={form.supplier}
            onChange={(e) => set("supplier", e.target.value)}
            placeholder="e.g. Ravi Silks"
          />
        </Field>
        <Field label="Location">
          <Input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Dharmavaram, AP"
          />
        </Field>
        <Field label="Purchase Date">
          <DatePicker
            value={form.date ? new Date(form.date) : null}
            onChange={(date) => set("date", date ? formatDate(date, "iso") : "")}
          />
        </Field>
        <div>
          <div style={labelStyle}>Number of Sarees</div>
          <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: T.taupe, background: T.cream }}>
            {pieceCount} saree{pieceCount !== 1 ? "s" : ""} in {sareeDetailsCount} line{sareeDetailsCount !== 1 ? "s" : ""} below
          </div>
        </div>
        <Field label="Payment Status">
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
          </Select>
        </Field>
        <Field label="GST Number">
          <Input
            className="font-mono"
            value={form.gstNumber}
            onChange={(e) => set("gstNumber", e.target.value.toUpperCase())}
            placeholder="e.g. 37ABCRS1234F1Z5"
          />
        </Field>
        <Field label="Invoice Number">
          <Input
            className="font-mono"
            value={form.invoiceNumber}
            onChange={(e) => set("invoiceNumber", e.target.value)}
            placeholder="e.g. INV-2026-118"
          />
        </Field>
        <Field label="Bill Amount">
          <Input
            value={form.billAmount}
            onChange={(e) => set("billAmount", e.target.value)}
            // eslint-disable-next-line no-restricted-syntax -- input adornment / field label unit annotation, not a rendered money value
            placeholder="e.g. ₹34,000"
          />
        </Field>
        <div>
          <span style={labelStyle}>Upload Invoice</span>
          <label
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              color: form.invoiceFileName ? T.royalBurgundy : T.taupe,
            }}
          >
            <UploadCloud size={14} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {form.invoiceFileName || "Choose file from supplier..."}
            </span>
            <Input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => handleInvoiceFile(e.target.files?.[0] ?? null)}
              containerClassName="hidden"
            />
          </label>
          {form.invoiceFileName && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={12} color={T.royalBurgundy} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{form.invoiceFileName}</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => set("invoiceFileName", "")}
                className="h-auto p-0 text-[12px] text-[var(--text-danger)]"
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Field label="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className="resize-y"
          />
        </Field>
      </div>
    </>
  );
}
