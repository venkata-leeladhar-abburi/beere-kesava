import React from "react";
import { FileText, UploadCloud } from "lucide-react";
import { Supplier } from "../../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../../theme";
import { FormState } from "../../types";
import { inputStyle, labelStyle } from "../../common/primitives";

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
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle} htmlFor="select-supplier">Select Supplier</label>
        <select id="select-supplier"
          style={{ ...inputStyle, cursor: "pointer" }}
          value={form.supplierId || (form.supplier ? "__other__" : "")}
          onChange={(e) => {
            const val = e.target.value;
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
          <option value="">— Choose a registered supplier —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.city} · {s.specialty}</option>
          ))}
          <option value="__other__">Other (enter manually)</option>
        </select>
      </div>

      {selectedSupplier && (
        <div style={{ marginBottom: 16, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            ["Supplier ID", selectedSupplier.id],
            ["Contact", selectedSupplier.contactName],
            ["Phone", selectedSupplier.phone],
            ["Supplies", selectedSupplier.specialty],
            ["Payment Terms", selectedSupplier.terms],
            ["GST", selectedSupplier.gstCode || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.9px", color: T.taupe, marginBottom: 3 }}>{String(k).toUpperCase()}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600, wordBreak: "break-word" }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="supplier-name">Supplier Name</label>
          <input id="supplier-name"
            style={inputStyle}
            value={form.supplier}
            onChange={(e) => set("supplier", e.target.value)}
            placeholder="e.g. Ravi Silks"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="location">Location</label>
          <input id="location"
            style={inputStyle}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Dharmavaram, AP"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="purchase-date">Purchase Date</label>
          <input id="purchase-date"
            type="date"
            style={inputStyle}
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Number of Sarees</label>
          <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: T.taupe, background: T.cream }}>
            {pieceCount} saree{pieceCount !== 1 ? "s" : ""} in {sareeDetailsCount} line{sareeDetailsCount !== 1 ? "s" : ""} below
          </div>
        </div>
        <div>
          <label style={labelStyle} htmlFor="payment-status">Payment Status</label>
          <select id="payment-status"
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option>Paid</option>
            <option>Pending</option>
            <option>Partial</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="gst-number">GST Number</label>
          <input id="gst-number"
            style={{ ...inputStyle, fontFamily: F.mono }}
            value={form.gstNumber}
            onChange={(e) => set("gstNumber", e.target.value.toUpperCase())}
            placeholder="e.g. 37ABCRS1234F1Z5"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="invoice-number">Invoice Number</label>
          <input id="invoice-number"
            style={{ ...inputStyle, fontFamily: F.mono }}
            value={form.invoiceNumber}
            onChange={(e) => set("invoiceNumber", e.target.value)}
            placeholder="e.g. INV-2026-118"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bill-amount">Bill Amount</label>
          <input id="bill-amount"
            style={inputStyle}
            value={form.billAmount}
            onChange={(e) => set("billAmount", e.target.value)}
            placeholder="e.g. ₹34,000"
          />
        </div>
        <div>
          <label style={labelStyle}>Upload Invoice</label>
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
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => handleInvoiceFile(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
          </label>
          {form.invoiceFileName && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={12} color={T.royalBurgundy} />
              <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{form.invoiceFileName}</span>
              <button
                onClick={() => set("invoiceFileName", "")}
                style={{ background: "none", border: "none", color: T.crimson, cursor: "pointer", fontSize: 11, fontFamily: F.ui, padding: 0 }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="notes">Notes</label>
        <textarea id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }}
        />
      </div>
    </>
  );
}
