import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  X,
  Plus,
  Printer,
  Tag,
  Save,
  FileText,
  UploadCloud,
  Send,
} from "lucide-react";
import { SariTagPrintModal } from "./SariTagPrintModal";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "./DateFilterBar";
import {
  useSuppliers, Supplier, SareeTag, Purchase,
  formatINR, supplierPrefix, buildSareeCode, computeFinalAmount, totalPieces,
} from "./SupplierContext";

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const T = {
  silkCream: "#F7F2EA",
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47",
  goldLight: "#E7C983",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  taupe: "#8B7060",
  green: "#1E6640",
  greenBg: "rgba(30,102,64,0.09)",
  crimson: "#C0392B",
  crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};


function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    Paid: { color: "#1E6640", bg: "rgba(30,102,64,0.09)" },
    Pending: { color: "rgba(230,126,34,1)", bg: "rgba(230,126,34,0.12)" },
    Partial: { color: "#C0392B", bg: "rgba(192,57,43,0.08)" },
  };
  const s = styles[status] || { color: T.taupe, bg: T.cream };
  return (
    <span
      style={{
        fontFamily: F.ui,
        fontWeight: 600,
        fontSize: 11,
        color: s.color,
        background: s.bg,
        borderRadius: 999,
        padding: "3px 10px",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: `1px solid ${T.borderDef}`,
  background: "#FFF8F0",
  fontFamily: F.ui,
  fontSize: 13,
  padding: "0 12px",
  color: T.luxuryBrown,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontWeight: 600,
  fontSize: 12,
  color: T.luxuryBrown,
  display: "block",
  marginBottom: 6,
};

export interface FormState {
  /** Registered supplier this purchase is against — empty for a one-off supplier typed by hand. */
  supplierId: string;
  supplier: string;
  location: string;
  date: string;
  gstNumber: string;
  invoiceNumber: string;
  billAmount: string;
  status: string;
  notes: string;
  invoiceFileName: string;
}

export const EMPTY_FORM: FormState = {
  supplierId: "",
  supplier: "",
  location: "",
  date: "",
  gstNumber: "",
  invoiceNumber: "",
  billAmount: "",
  status: "Pending",
  notes: "",
  invoiceFileName: "",
};

// Internal per-row state for the saree details editor — carries a stable key
// (_uid) separate from the auto-generated saree code, which is recomputed
// live from the supplier/invoice number as the admin types.
type SareeRow = Omit<SareeTag, "id"> & { _uid: string };

let rowUidCounter = 0;
function nextRowUid() {
  rowUidCounter += 1;
  return `row-${rowUidCounter}-${Date.now()}`;
}

function toSareeRow(s: SareeTag): SareeRow {
  const { id, ...rest } = s;
  return { ...rest, _uid: nextRowUid() };
}

export function PurchaseFormModal({
  mode,
  initial,
  initialSarees,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit" | "request";
  initial: FormState;
  initialSarees: SareeTag[];
  onClose: () => void;
  onSubmit: (data: FormState, sarees: SareeTag[], request?: { urgency: "Normal" | "Urgent"; reason: string }) => void;
}) {
  const { suppliers } = useSuppliers();
  const [form, setForm] = useState<FormState>(initial);
  const [sareeDetails, setSareeDetails] = useState<SareeRow[]>(() => initialSarees.map(toSareeRow));
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [reason, setReason] = useState("");

  const selectedSupplier = suppliers.find((s) => s.id === form.supplierId) ?? null;
  const isRequest = mode === "request";

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addSareeRow = () => {
    setSareeDetails((prev) => [
      ...prev,
      {
        _uid: nextRowUid(),
        weight: "",
        date: form.date || "—",
        // Default the type to what this supplier normally supplies — still editable.
        sareeType: selectedSupplier?.specialty ?? "",
        color: "",
        price: 0,
        sellPercent: 20,
        quantity: 1,
        finalAmount: 0,
        notes: "",
        imageUrl: undefined,
      },
    ]);
  };
  const removeSareeRow = (uid: string) =>
    setSareeDetails((prev) => prev.filter((s) => s._uid !== uid));
  const updateSareeRow = (uid: string, patch: Partial<SareeRow>) =>
    setSareeDetails((prev) =>
      prev.map((s) => (s._uid === uid ? { ...s, ...patch } : s))
    );

  const handleInvoiceFile = (file: File | null) => {
    if (file) set("invoiceFileName", file.name);
  };

  const pieceCount = sareeDetails.reduce((sum, s) => sum + (Number(s.quantity) || 1), 0);
  const sareeTotal = sareeDetails.reduce(
    (sum, s) => sum + computeFinalAmount(Number(s.price) || 0, Number(s.sellPercent) || 0, Number(s.quantity) || 1),
    0,
  );

  const valid =
    form.supplier.trim() !== "" &&
    form.location.trim() !== "" &&
    form.date.trim() !== "" &&
    sareeDetails.length > 0 &&
    (!isRequest || reason.trim() !== "");

  const buildFinalSarees = (): SareeTag[] =>
    sareeDetails.map((s, idx) => {
      const price = Number(s.price) || 0;
      const sellPercent = Number(s.sellPercent) || 0;
      const quantity = Number(s.quantity) || 1;
      return {
        id: buildSareeCode(form.supplier, idx + 1, form.invoiceNumber),
        weight: s.weight,
        date: s.date,
        sareeType: s.sareeType,
        color: s.color,
        price,
        sellPercent,
        quantity,
        finalAmount: computeFinalAmount(price, sellPercent, quantity),
        notes: s.notes,
        imageUrl: s.imageUrl,
      };
    });

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(27,12,8,0.55)",
            backdropFilter: "blur(4px)",
          }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(92vw, 620px)",
            maxHeight: "88vh",
            background: "#FFFFFF",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: T.darkBurgundy,
              padding: "18px 26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>
              {mode === "add" ? "Add External Purchase" : mode === "edit" ? `Edit Purchase — ${initial.supplier}` : "Raise Purchase Request"}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "none",
                color: "#FFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1 }}>
            {isRequest && (
              <div style={{ marginBottom: 16, background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>
                This goes to the superadmin for approval before it becomes an external purchase. Fill it in exactly like a real purchase — supplier, invoice and saree details — so it's ready to convert once approved.
              </div>
            )}
            {/* Supplier selector — picking a registered supplier fills in every
                detail below; "Other" leaves the fields free for a one-off buy. */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Select Supplier</label>
              <select
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
                <label style={labelStyle}>Supplier Name</label>
                <input
                  style={inputStyle}
                  value={form.supplier}
                  onChange={(e) => set("supplier", e.target.value)}
                  placeholder="e.g. Ravi Silks"
                />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input
                  style={inputStyle}
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Dharmavaram, AP"
                />
              </div>
              <div>
                <label style={labelStyle}>Purchase Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Number of Sarees</label>
                <div style={{ ...inputStyle, display: "flex", alignItems: "center", color: T.taupe, background: T.cream }}>
                  {pieceCount} saree{pieceCount !== 1 ? "s" : ""} in {sareeDetails.length} line{sareeDetails.length !== 1 ? "s" : ""} below
                </div>
              </div>
              <div>
                <label style={labelStyle}>Payment Status</label>
                <select
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
                <label style={labelStyle}>GST Number</label>
                <input
                  style={{ ...inputStyle, fontFamily: F.mono }}
                  value={form.gstNumber}
                  onChange={(e) => set("gstNumber", e.target.value.toUpperCase())}
                  placeholder="e.g. 37ABCRS1234F1Z5"
                />
              </div>
              <div>
                <label style={labelStyle}>Invoice Number</label>
                <input
                  style={{ ...inputStyle, fontFamily: F.mono }}
                  value={form.invoiceNumber}
                  onChange={(e) => set("invoiceNumber", e.target.value)}
                  placeholder="e.g. INV-2026-118"
                />
              </div>
              <div>
                <label style={labelStyle}>Bill Amount</label>
                <input
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
              <label style={labelStyle}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }}
              />
            </div>

            {isRequest && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                  <div>
                    <label style={labelStyle}>Urgency</label>
                    <select
                      style={{ ...inputStyle, cursor: "pointer" }}
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as "Normal" | "Urgent")}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Reason for Request *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Why is this purchase needed?"
                    style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }}
                  />
                </div>
              </>
            )}

            {/* Saree Details — per-saree entry */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>
                  Saree Details ({sareeDetails.length} line{sareeDetails.length !== 1 ? "s" : ""} · {pieceCount} pc)
                </span>
                <button
                  onClick={addSareeRow}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: T.royalBurgundy,
                    color: "#FFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontFamily: F.ui,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={12} />
                  Add Saree
                </button>
              </div>

              {sareeDetails.length === 0 && (
                <div
                  style={{
                    background: T.silkCream,
                    borderRadius: 10,
                    padding: "14px",
                    textAlign: "center",
                    fontFamily: F.ui,
                    fontSize: 12.5,
                    color: T.taupe,
                  }}
                >
                  No sarees added yet. Click "Add Saree" to enter details for each saree in this purchase.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sareeDetails.map((s, idx) => {
                  const price = Number(s.price) || 0;
                  const sellPercent = Number(s.sellPercent) || 0;
                  const quantity = Number(s.quantity) || 1;
                  const finalAmount = computeFinalAmount(price, sellPercent, quantity);
                  const code = buildSareeCode(form.supplier, idx + 1, form.invoiceNumber);
                  return (
                    <div
                      key={s._uid}
                      style={{
                        border: `1px solid ${T.borderDef}`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        background: T.warmIvory,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            title="Serial number in this purchase"
                            style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 11, color: "#FFF", background: T.royalBurgundy, borderRadius: 6, padding: "3px 8px" }}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            title="Auto-generated: supplier prefix + serial number + invoice number"
                            style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, background: "rgba(200,155,71,0.13)", border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 9px" }}
                          >
                            {code}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSareeRow(s._uid)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, display: "flex", alignItems: "center" }}
                          title="Remove saree"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>Saree Type</label>
                          <input
                            style={{ ...inputStyle, height: 36, fontSize: 12 }}
                            value={s.sareeType}
                            onChange={(e) => updateSareeRow(s._uid, { sareeType: e.target.value })}
                            placeholder="e.g. Kanjivaram"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Colour</label>
                          <input
                            style={{ ...inputStyle, height: 36, fontSize: 12 }}
                            value={s.color}
                            onChange={(e) => updateSareeRow(s._uid, { color: e.target.value })}
                            placeholder="e.g. Maroon"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Weight (grams)</label>
                          <input
                            type="number"
                            style={{ ...inputStyle, height: 36, fontSize: 12 }}
                            value={s.weight.replace(/g$/, "")}
                            onChange={(e) => updateSareeRow(s._uid, { weight: `${e.target.value}g` })}
                            placeholder="e.g. 820"
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.7fr 1fr 1.1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>Price (₹) / pc</label>
                          <input
                            type="number"
                            style={{ ...inputStyle, height: 36, fontSize: 12 }}
                            value={s.price || ""}
                            onChange={(e) => updateSareeRow(s._uid, { price: Number(e.target.value) })}
                            placeholder="e.g. 600"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Quantity</label>
                          <input
                            type="number"
                            min={1}
                            style={{ ...inputStyle, height: 36, fontSize: 12 }}
                            value={s.quantity ?? 1}
                            onChange={(e) => updateSareeRow(s._uid, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Sell % (markup)</label>
                          <input
                            type="number"
                            style={{ ...inputStyle, height: 36, fontSize: 12 }}
                            value={s.sellPercent || ""}
                            onChange={(e) => updateSareeRow(s._uid, { sellPercent: Number(e.target.value) })}
                            placeholder="e.g. 25"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Final Amount</label>
                          <div style={{ ...inputStyle, height: 36, fontSize: 12.5, display: "flex", alignItems: "center", fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, background: T.cream }}>
                            {formatINR(finalAmount)}
                          </div>
                          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginTop: 3 }}>
                            {formatINR(computeFinalAmount(price, sellPercent))} × {quantity} pc
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10 }}>
                        <div>
                          <label style={labelStyle}>Notes (optional)</label>
                          <textarea
                            value={s.notes}
                            onChange={(e) => updateSareeRow(s._uid, { notes: e.target.value })}
                            rows={2}
                            style={{ ...inputStyle, height: "auto", padding: "8px 12px", fontSize: 12, resize: "vertical" as const }}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Saree Photo (optional)</label>
                          {s.imageUrl ? (
                            <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
                              <img src={s.imageUrl} alt="Saree" style={{ width: "100%", height: 68, objectFit: "cover", display: "block" }} />
                              <button
                                onClick={() => updateSareeRow(s._uid, { imageUrl: undefined })}
                                title="Remove photo"
                                style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ) : (
                            <label
                              style={{ height: 68, border: `1.5px dashed ${T.borderGold}`, borderRadius: 8, background: T.silkCream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", color: T.taupe }}
                            >
                              <UploadCloud size={16} />
                              <span style={{ fontFamily: F.ui, fontSize: 10.5 }}>Upload photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => updateSareeRow(s._uid, { imageUrl: ev.target?.result as string });
                                  reader.readAsDataURL(file);
                                }}
                                style={{ display: "none" }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sareeDetails.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown }}>
                    Total — {pieceCount} piece{pieceCount !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 700, color: T.royalBurgundy }}>
                    {formatINR(sareeTotal)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "16px 26px",
              borderTop: `1px solid ${T.borderDef}`,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <button
              disabled={!valid}
              onClick={() => valid && onSubmit(form, buildFinalSarees(), isRequest ? { urgency, reason } : undefined)}
              style={{
                flex: 1,
                background: valid ? T.royalBurgundy : "rgba(110,15,45,0.30)",
                color: "white",
                border: "none",
                borderRadius: 999,
                padding: "11px 0",
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 14,
                cursor: valid ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isRequest ? <Send size={15} /> : <Save size={15} />}
              {mode === "add" ? "Add Purchase & Generate Barcodes" : mode === "edit" ? "Save Changes" : "Send to Superadmin"}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: "0 0 auto",
                background: "transparent",
                color: T.taupe,
                border: `1px solid ${T.borderDef}`,
                borderRadius: 999,
                padding: "11px 22px",
                fontFamily: F.ui,
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SareeListModal({
  purchase,
  onClose,
  onPrint,
  onPrintAll,
}: {
  purchase: Purchase;
  onClose: () => void;
  onPrint: (saree: SareeTag) => void;
  onPrintAll: () => void;
}) {
  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "absolute", inset: 0, background: "rgba(27,12,8,0.55)" }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(94vw, 1040px)",
            maxHeight: "82vh",
            background: "#FFF",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: T.darkBurgundy,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: "#FFF" }}>
                {purchase.id} — Saree Details
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.8)" }}>
                {purchase.supplier}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "none",
                color: "#FFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.silkCream }}>
                  {["S.No", "Saree Code", "Saree Type", "Colour", "Weight", "Price / pc", "Qty", "Sell %", "Final Amount", "Notes", "Barcode"].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontFamily: F.mono,
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.taupe,
                        textTransform: "uppercase" as const,
                        letterSpacing: 0.5,
                        textAlign: "left" as const,
                        padding: "10px 14px",
                        whiteSpace: "nowrap" as const,
                        borderBottom: `1px solid ${T.borderDef}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchase.sarees.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory, borderBottom: `1px solid ${T.borderDef}` }}>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>
                      {s.id}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {s.sareeType || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {s.color || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {s.weight}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>
                      {formatINR(s.price)}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>
                      {s.quantity ?? 1}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>
                      {s.sellPercent}%
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>
                      {formatINR(s.finalAmount)}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.taupe, maxWidth: 200 }}>
                      {s.notes || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => onPrint(s)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          background: T.royalBurgundy,
                          color: "#FFF",
                          border: "none",
                          borderRadius: 7,
                          padding: "5px 11px",
                          fontFamily: F.ui,
                          fontWeight: 600,
                          fontSize: 11.5,
                          cursor: "pointer",
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        <Printer size={11} />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "14px 24px",
              borderTop: `1px solid ${T.borderDef}`,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <button
              onClick={onPrintAll}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: T.royalBurgundy,
                color: "#FFF",
                border: "none",
                borderRadius: 999,
                padding: "10px 0",
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              <Printer size={14} />
              Print All Barcodes
            </button>
            <button
              onClick={onClose}
              style={{
                flex: "0 0 auto",
                background: "transparent",
                color: T.taupe,
                border: `1px solid ${T.borderDef}`,
                borderRadius: 999,
                padding: "10px 22px",
                fontFamily: F.ui,
                fontWeight: 500,
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function ExternalPurchasesPage() {
  // Purchases live in the shared supplier context so the Suppliers page sees the
  // same inventory, spend and payment history that gets entered here.
  const { purchases, addPurchase, updatePurchase, deletePurchase } = useSuppliers();
  const [detailRow, setDetailRow] = useState<Purchase | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const [formModal, setFormModal] = useState<{ mode: "add" | "edit"; editId?: string } | null>(null);
  const [sareeListPurchase, setSareeListPurchase] = useState<Purchase | null>(null);
  const [printSaree, setPrintSaree] = useState<SareeTag | null>(null);
  const [printSareeSupplier, setPrintSareeSupplier] = useState<string>("");

  const filtered = purchases.filter((p) => {
    const matchSearch =
      search === "" ||
      p.supplier.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.gstNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || p.status === statusFilter;
    const matchDate = matchesDateFilter(p.date, dateFilter);
    return matchSearch && matchStatus && matchDate;
  });

  const handleAddSubmit = (form: FormState, sarees: SareeTag[]) => {
    addPurchase({
      supplierId: form.supplierId || undefined,
      supplier: form.supplier,
      location: form.location,
      date: form.date || "—",
      sareeCount: totalPieces(sarees),
      gstNumber: form.gstNumber,
      invoiceNumber: form.invoiceNumber,
      billAmount: form.billAmount || "₹0",
      status: form.status,
      notes: form.notes,
      invoiceFileName: form.invoiceFileName || undefined,
      sarees,
    });
    setFormModal(null);
  };

  const handleEditSubmit = (id: string, form: FormState, sarees: SareeTag[]) => {
    updatePurchase(id, {
      supplierId: form.supplierId || undefined,
      supplier: form.supplier,
      location: form.location,
      date: form.date || undefined,
      sareeCount: totalPieces(sarees),
      gstNumber: form.gstNumber,
      invoiceNumber: form.invoiceNumber,
      billAmount: form.billAmount,
      status: form.status,
      notes: form.notes,
      invoiceFileName: form.invoiceFileName || undefined,
      sarees,
    });
    setFormModal(null);
    setDetailRow((d) => (d && d.id === id ? null : d));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(`Delete purchase ${id}? This cannot be undone.`)) return;
    deletePurchase(id);
    setDetailRow((d) => (d && d.id === id ? null : d));
  };

  const editingPurchase = formModal?.mode === "edit" ? purchases.find((p) => p.id === formModal.editId) : null;
  const editingFormInitial: FormState | null = editingPurchase
    ? {
        supplierId: editingPurchase.supplierId || "",
        supplier: editingPurchase.supplier,
        location: editingPurchase.location,
        date: editingPurchase.date,
        gstNumber: editingPurchase.gstNumber,
        invoiceNumber: editingPurchase.invoiceNumber,
        billAmount: editingPurchase.billAmount,
        status: editingPurchase.status,
        notes: editingPurchase.notes,
        invoiceFileName: editingPurchase.invoiceFileName || "",
      }
    : null;

  const totalSarees = purchases.reduce((s, p) => s + p.sareeCount, 0);

  return (
    <div
      style={{
        background: T.silkCream,
        minHeight: "100vh",
        paddingBottom: 80,
      }}
    >
      {/* PAGE HEADER */}
      <div
        style={{
          background: T.darkBurgundy,
          padding: "44px 56px 90px",
          position: "relative",
          overflow: "hidden",
          minHeight: 180,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 9,
              color: T.antiqueGold,
              opacity: 0.5,
              letterSpacing: 2,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            SINCE 1999 · EXTERNAL PURCHASES
          </div>
          <h1
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 42,
              color: "white",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            External Purchases
          </h1>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 500,
              fontStyle: "italic",
              fontSize: 28,
              color: T.antiqueGold,
              marginTop: 2,
              marginBottom: 14,
            }}
          >
            &amp; Branch Inventory Oversight
          </div>
          <p
            style={{
              fontFamily: F.ui,
              fontSize: 14,
              color: "rgba(255,255,255,0.60)",
              maxWidth: 480,
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            Track every saree purchased from external suppliers — with GST,
            invoice details, and an auto-generated printable barcode for each
            saree. Visible across all branches.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            zIndex: 10,
            alignSelf: "center",
            flexShrink: 0,
          }}
        >
          <button
            style={{
              border: "1px solid rgba(255,255,255,0.25)",
              background: "transparent",
              color: "white",
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={() => setFormModal({ mode: "add" })}
            style={{
              background: T.antiqueGold,
              color: "#3B2314",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <Plus size={13} />
            Add External Purchase
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: 40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "2px solid rgba(200,155,71,0.13)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: 100,
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "2px solid rgba(200,155,71,0.09)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          padding: "0 56px",
          marginTop: -40,
          zIndex: 20,
          position: "relative",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
            borderRadius: 24,
            minHeight: 120,
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {[
            {
              label: "TOTAL PURCHASES",
              value: String(purchases.length),
              sub: "All time across all entries",
              highlight: false,
              valueColor: "white",
            },
            {
              label: "TOTAL SAREES TAGGED",
              value: String(totalSarees),
              sub: "Barcodes generated",
              highlight: false,
              valueColor: T.antiqueGold,
            },
            {
              label: "PENDING PAYMENTS",
              value: String(purchases.filter((p) => p.status !== "Paid").length),
              sub: "Entries awaiting payment",
              highlight: true,
              valueColor: T.antiqueGold,
            },
            {
              label: "THIS MONTH",
              value: String(purchases.length),
              sub: "New entries this month",
              highlight: false,
              valueColor: "white",
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "28px 28px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                background: card.highlight ? "rgba(200,155,71,0.10)" : "transparent",
                borderRadius: i === 0 ? "24px 0 0 24px" : i === 3 ? "0 24px 24px 0" : undefined,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 9,
                  color: card.highlight ? T.antiqueGold : "rgba(255,255,255,0.45)",
                  letterSpacing: 2,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 28,
                  color: card.valueColor,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {card.value}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.40)" }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ padding: "48px 56px 0" }}>
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: `1px solid ${T.borderDef}`,
            boxShadow: "0 2px 12px rgba(44,24,16,0.05)",
            padding: "16px 20px",
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "2fr 1fr auto auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              color={T.taupe}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by supplier, ID, location, GST, invoice…"
              style={{
                width: "100%",
                height: 40,
                borderRadius: 10,
                border: `1px solid ${T.borderDef}`,
                background: "#FFF8F0",
                fontFamily: F.ui,
                fontSize: 13,
                paddingLeft: 36,
                paddingRight: 12,
                color: T.luxuryBrown,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              border: `1px solid ${T.borderDef}`,
              background: "#FFF8F0",
              fontFamily: F.ui,
              fontSize: 13,
              padding: "0 10px",
              color: T.luxuryBrown,
              cursor: "pointer",
            }}
          >
            <option>All Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Partial</option>
          </select>

          <button
            style={{
              height: 40,
              background: T.royalBurgundy,
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "0 18px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Apply
          </button>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("All Status");
              setDateFilter(DEFAULT_DATE_FILTER);
            }}
            style={{
              height: 40,
              background: "transparent",
              color: T.taupe,
              border: "none",
              borderRadius: 10,
              padding: "0 14px",
              fontFamily: F.ui,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      {/* MAIN TABLE */}
      <div style={{ padding: "0 56px" }}>
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: `1px solid ${T.borderDef}`,
            boxShadow: "0 2px 16px rgba(44,24,16,0.07)",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.silkCream }}>
                {[
                  "Serial Number",
                  "Supplier Name",
                  "Location",
                  "Purchase Date",
                  "Sarees",
                  "GST Number",
                  "Invoice Number",
                  "Bill Amount",
                  "Payment Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: F.mono,
                      fontSize: 9,
                      color: T.taupe,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setDetailRow(row)}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: `1px solid ${T.borderDef}`,
                    background: hoveredRow === row.id ? "#F0E8D0" : "white",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy }}>
                      {row.id}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                      {row.supplier}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.location}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.date}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSareeListPurchase(row)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: T.cream,
                        border: `1px solid ${T.borderGold}`,
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontFamily: F.ui,
                        fontWeight: 600,
                        fontSize: 12,
                        color: T.luxuryBrown,
                        cursor: "pointer",
                      }}
                      title="View / Print saree barcodes"
                    >
                      <Tag size={12} color={T.antiqueGold} />
                      {row.sareeCount}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.gstNumber || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>
                      {row.invoiceNumber || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontFamily: F.mono,
                        fontWeight: 600,
                        fontSize: 13,
                        color: T.antiqueGold,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.billAmount}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusPill status={row.status} />
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailRow(row)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: T.royalBurgundy,
                        }}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setFormModal({ mode: "edit", editId: row.id })}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: T.taupe,
                        }}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: T.crimson,
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: "40px 16px",
                      textAlign: "center",
                      fontFamily: F.ui,
                      fontSize: 13,
                      color: T.taupe,
                    }}
                  >
                    No purchases match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `1px solid ${T.borderDef}`,
              padding: "12px 20px",
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>
              Showing 1–{filtered.length} of {purchases.length} entries
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {["← Previous", "1", "Next →"].map((p, i) => (
                <button
                  key={i}
                  style={{
                    fontFamily: F.ui,
                    fontSize: 12,
                    color: p === "1" ? T.royalBurgundy : T.taupe,
                    background: p === "1" ? T.cream : "transparent",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontWeight: p === "1" ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {detailRow && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailRow(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 400 }}
            />
            <motion.div
              initial={{ x: 480 }}
              animate={{ x: 0 }}
              exit={{ x: 480 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: 480,
                background: "white",
                boxShadow: "-8px 0 40px rgba(44,24,16,0.18)",
                zIndex: 500,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "22px 28px",
                  borderBottom: `1px solid ${T.borderDef}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>
                  Purchase Details
                </span>
                <button
                  onClick={() => setDetailRow(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `1px solid ${T.borderDef}`,
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: T.taupe,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {[
                  { label: "Serial Number", value: detailRow.id, mono: true, gold: true },
                  { label: "Supplier Name", value: detailRow.supplier },
                  { label: "Location", value: detailRow.location },
                  { label: "Purchase Date", value: detailRow.date },
                  { label: "Number of Sarees", value: String(detailRow.sareeCount) },
                  { label: "GST Number", value: detailRow.gstNumber || "—", mono: true },
                  { label: "Invoice Number", value: detailRow.invoiceNumber || "—", mono: true },
                  { label: "Bill Amount", value: detailRow.billAmount, gold: true },
                  { label: "Payment Status", value: detailRow.status, pill: true },
                  { label: "Invoice File", value: detailRow.invoiceFileName || "Not uploaded" },
                ].map((field) => (
                  <div key={field.label}>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontWeight: 600,
                        fontSize: 12,
                        color: T.luxuryBrown,
                        marginBottom: 4,
                      }}
                    >
                      {field.label}
                    </div>
                    {field.pill ? (
                      <StatusPill status={field.value} />
                    ) : (
                      <div
                        style={{
                          fontFamily: field.mono ? F.mono : F.ui,
                          fontSize: 14,
                          color: field.gold ? T.antiqueGold : field.mono ? T.royalBurgundy : T.taupe,
                          fontWeight: field.mono ? 700 : 400,
                        }}
                      >
                        {field.value}
                      </div>
                    )}
                  </div>
                ))}

                {detailRow.notes && (
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, marginBottom: 4 }}>
                      Notes
                    </div>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontSize: 14,
                        color: T.taupe,
                        background: T.silkCream,
                        borderRadius: 8,
                        padding: "10px 12px",
                        lineHeight: 1.6,
                      }}
                    >
                      {detailRow.notes}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, marginBottom: 8 }}>
                    Saree Barcodes ({detailRow.sarees.length})
                  </div>
                  <button
                    onClick={() => setSareeListPurchase(detailRow)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: T.cream,
                      border: `1px solid ${T.borderGold}`,
                      borderRadius: 10,
                      padding: "12px 0",
                      fontFamily: F.ui,
                      fontWeight: 600,
                      fontSize: 13,
                      color: T.luxuryBrown,
                      cursor: "pointer",
                    }}
                  >
                    <Tag size={14} color={T.antiqueGold} />
                    View &amp; Print Saree Tags
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: "18px 28px",
                  borderTop: `1px solid ${T.borderDef}`,
                  display: "flex",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setFormModal({ mode: "edit", editId: detailRow.id })}
                  style={{
                    flex: 1,
                    background: T.royalBurgundy,
                    color: "white",
                    border: "none",
                    borderRadius: 999,
                    padding: "11px 0",
                    fontFamily: F.ui,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Edit Entry
                </button>
                <button
                  onClick={() => setDetailRow(null)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: T.taupe,
                    border: `1px solid ${T.borderDef}`,
                    borderRadius: 999,
                    padding: "11px 0",
                    fontFamily: F.ui,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD / EDIT FORM MODAL */}
      {formModal && formModal.mode === "add" && (
        <PurchaseFormModal
          mode="add"
          initial={EMPTY_FORM}
          initialSarees={[]}
          onClose={() => setFormModal(null)}
          onSubmit={handleAddSubmit}
        />
      )}
      {formModal && formModal.mode === "edit" && editingFormInitial && editingPurchase && (
        <PurchaseFormModal
          mode="edit"
          initial={editingFormInitial}
          initialSarees={editingPurchase.sarees}
          onClose={() => setFormModal(null)}
          onSubmit={(data, sarees) => handleEditSubmit(formModal.editId!, data, sarees)}
        />
      )}

      {/* SAREE BARCODE LIST MODAL */}
      {sareeListPurchase && (
        <SareeListModal
          purchase={purchases.find((p) => p.id === sareeListPurchase.id) || sareeListPurchase}
          onClose={() => setSareeListPurchase(null)}
          onPrint={(saree) => {
            setPrintSareeSupplier(sareeListPurchase.supplier);
            setPrintSaree(saree);
            setSareeListPurchase(null);
          }}
          onPrintAll={() => window.print()}
        />
      )}

      {/* SAREE TAG PRINT MODAL */}
      {printSaree && (
        <SariTagPrintModal
          saree={{
            id: printSaree.id,
            weaver: null,
            design: printSaree.id,
            sareeType: printSaree.sareeType,
            weight: printSaree.weight,
            qcDate: printSaree.date,
            source: "external",
            loom: 0,
            supplier: printSareeSupplier,
          }}
          onClose={() => setPrintSaree(null)}
        />
      )}
    </div>
  );
}
