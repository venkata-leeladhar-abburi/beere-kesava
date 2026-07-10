import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Scan, CheckSquare, Square, Package, Truck, ShoppingBag, Users,
  ChevronDown, ChevronUp, X, CheckCircle2, AlertTriangle, Clock, FileText,
  Upload, Eye, Send, Save, ArrowRight, Building2, Hash,
} from "lucide-react";
import { useFinishing, FinishingReturn } from "./FinishingContext";
import { useFirms } from "./FirmsContext";
import { useDesignLibrary } from "./DesignLibraryContext";
import { DesignCodeCard } from "./DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByCode, getSareeTypeByName } from "./RatesPricingPage";

// ── Design tokens (matches Admin portal) ──────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
  bgGold:        "rgba(200,155,71,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1];

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${T.borderDef}`,
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
};

const inp: React.CSSProperties = {
  background: "#FFF8F0",
  border: `1px solid rgba(110,15,45,0.18)`,
  borderRadius: 10,
  padding: "10px 14px",
  fontFamily: F.ui,
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  color: T.luxuryBrown,
};

// ── Wholesale customers (static — extend from CustomersPage) ─────────────────
const WHOLESALE_CUSTOMERS = [
  { id: "WC-001", name: "Lakshmi Silk Traders",   phone: "9811223344", city: "Bengaluru"  },
  { id: "WC-002", name: "Kanchipuram Silks",       phone: "9123456789", city: "Kanchipuram"},
  { id: "WC-003", name: "Sri Venkateswara Textiles",phone:"9988776655", city: "Ongole"     },
  { id: "WC-004", name: "AK Traders",              phone: "9700112233", city: "Hyderabad"  },
  { id: "WC-005", name: "Surat Zari Works",        phone: "9876543210", city: "Surat"      },
];

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    "Ready for Dispatch":   { bg: T.greenBg,   color: T.green,   border: "rgba(30,102,64,0.20)"  },
    "Dispatched":           { bg: "rgba(59,35,20,0.08)", color: T.luxuryBrown, border: "rgba(59,35,20,0.18)" },
    "Damaged — Review Needed": { bg: T.crimsonBg, color: T.crimson, border: "rgba(192,57,43,0.20)" },
    "QC Passed — Pending Finishing Assignment": { bg: "rgba(200,155,71,0.14)", color: "#8B6018", border: "rgba(200,155,71,0.32)" },
  };
  const s = cfg[status] ?? cfg["Ready for Dispatch"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" as const }}>
      {status === "Ready for Dispatch"      && <CheckCircle2 size={10} />}
      {status === "Dispatched"              && <Truck size={10} />}
      {status === "Damaged — Review Needed" && <AlertTriangle size={10} />}
      {status === "QC Passed — Pending Finishing Assignment" && <Clock size={10} />}
      {status}
    </span>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>
        {label} {req && <span style={{ color: T.crimson }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inp, fontFamily: mono ? F.mono : F.ui }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
      onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }}
    />
  );
}

function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inp }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
      onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }}
    />
  );
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inp, appearance: "none", cursor: "pointer", paddingRight: 32 }}
        onFocus={e => { (e.target as HTMLSelectElement).style.borderColor = T.royalBurgundy; }}
        onBlur={e =>  { (e.target as HTMLSelectElement).style.borderColor = "rgba(110,15,45,0.18)"; }}
      >{children}</select>
      <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

// ── Transport form (shared between shop + wholesale) ──────────────────────────
interface TransportData {
  lrNumber: string; transportCompany: string; vehicleNumber: string;
  driverName: string; dispatchDate: string; notes: string;
  expectedDelivery?: string; specialInstructions?: string;
}

function TransportForm({ data, onChange, wholesale }: { data: TransportData; onChange: (d: TransportData) => void; wholesale?: boolean }) {
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

// ── Invoice generator (wholesale step 5) ─────────────────────────────────────
interface InvoiceData {
  invoiceNumber: string; invoiceDate: string;
  pricePerSaree: string; applyGst: boolean; gstPct: string;
  firmId: string; paymentDueDate: string; invoiceNotes: string;
}

function InvoiceGenerator({
  sarees, customer, transport, data, onChange, onSend, onDraft, onCancel,
}: {
  sarees: FinishingReturn[];
  customer: typeof WHOLESALE_CUSTOMERS[0] | null;
  transport: TransportData;
  data: InvoiceData;
  onChange: (d: InvoiceData) => void;
  onSend: () => void;
  onDraft: () => void;
  onCancel: () => void;
}) {
  const { firms } = useFirms();
  const set = (k: keyof InvoiceData) => (v: string | boolean) => onChange({ ...data, [k]: v });

  const qty          = sarees.length;
  const price        = parseFloat(data.pricePerSaree) || 0;
  const subtotal     = qty * price;
  const gstAmount    = data.applyGst ? subtotal * (parseFloat(data.gstPct) || 0) / 100 : 0;
  const grandTotal   = subtotal + gstAmount;
  const selectedFirm = firms.find(f => f.id === data.firmId);

  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      {/* Left — form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Auto-filled (read-only)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["Customer",   customer?.name ?? "—"],
              ["Dispatch Date", transport.dispatchDate],
              ["LR Number",  transport.lrNumber],
              ["Transport",  transport.transportCompany],
              ["Sarees",     sarees.map(s => s.sareeId).join(", ")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, minWidth: 100 }}>{k}</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, flex: 1, wordBreak: "break-all" as const }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
          <Field label="Invoice Number" req>
            <TextInput value={data.invoiceNumber} onChange={set("invoiceNumber") as (v: string) => void} placeholder="INV-2026-001" mono />
          </Field>
          <Field label="Invoice Date" req>
            <input type="date" value={data.invoiceDate} onChange={e => set("invoiceDate")(e.target.value)}
              style={{ ...inp, fontFamily: F.mono }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
              onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
          </Field>
          <Field label={`Price per Saree (₹)`} req>
            <NumInput value={data.pricePerSaree} onChange={set("pricePerSaree") as (v: string) => void} placeholder="e.g. 8500" />
          </Field>
          <Field label="Total Amount">
            <div style={{ ...inp, background: "rgba(245,232,208,0.40)", color: T.royalBurgundy, fontFamily: F.mono, fontWeight: 600, display: "flex", alignItems: "center" }}>
              ₹{subtotal.toLocaleString("en-IN")}
            </div>
          </Field>

          {/* GST */}
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={data.applyGst} onChange={e => set("applyGst")(e.target.checked)}
                style={{ accentColor: T.royalBurgundy, width: 16, height: 16 }} />
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Apply GST</span>
            </label>
            {data.applyGst && (
              <input type="number" value={data.gstPct} onChange={e => set("gstPct")(e.target.value)}
                placeholder="%" min={0} max={100}
                style={{ ...inp, width: 70, textAlign: "center" as const, fontFamily: F.mono, fontSize: 13 }} />
            )}
            {data.applyGst && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>% GST = ₹{gstAmount.toLocaleString("en-IN")}</span>}
          </div>

          <div style={{ gridColumn: "1 / -1", background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
            <span style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Invoice raised by (Firm)" req>
              <SelectInput value={data.firmId} onChange={set("firmId") as (v: string) => void}>
                <option value="">Select firm…</option>
                {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
              </SelectInput>
            </Field>
          </div>

          <Field label="Payment Due Date">
            <input type="date" value={data.paymentDueDate} onChange={e => set("paymentDueDate")(e.target.value)}
              style={{ ...inp, fontFamily: F.mono }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
              onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Additional Notes">
              <textarea value={data.invoiceNotes} onChange={e => set("invoiceNotes")(e.target.value)} rows={2}
                placeholder="Any notes for this invoice…"
                style={{ ...inp, resize: "none" as const, lineHeight: 1.55 }}
                onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = T.royalBurgundy; }}
                onBlur={e =>  { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
            </Field>
          </div>
        </div>
      </div>

      {/* Right — live invoice preview */}
      <div style={{ background: "#FFFDF9", border: `1.5px solid ${T.borderGold}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(200,155,71,0.12)" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "18px 24px" }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>
            {selectedFirm?.firmName ?? "Beere Kesava & Brothers Silks"}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
            {selectedFirm?.address ?? "Hyderabad, Telangana"}
          </div>
          {selectedFirm?.gstNumber && (
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.antiqueGold, marginTop: 4 }}>GST: {selectedFirm.gstNumber}</div>
          )}
        </div>

        <div style={{ padding: "18px 24px" }}>
          {/* Invoice meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.borderDef}` }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.royalBurgundy }}>TAX INVOICE</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{data.invoiceNumber || "INV-XXXX"}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>Date: {data.invoiceDate || todayStr}</div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Bill To</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginTop: 3 }}>{customer?.name ?? "—"}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{customer?.city}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{customer?.phone}</div>
            </div>
          </div>

          {/* Sarees table */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 90px", padding: "6px 0", borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 4 }}>
              {["Item", "Qty", "Rate (₹)", "Amount (₹)"].map((h, i) => (
                <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i > 0 ? "right" as const : "left" as const }}>{h}</div>
              ))}
            </div>
            {sarees.slice(0, 4).map((s, i) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 90px", padding: "5px 0", borderBottom: i < Math.min(sarees.length, 4) - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{s.sareeId}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe }}>{s.designCode} · {s.sareeType}</div>
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, textAlign: "right" as const }}>1</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, textAlign: "right" as const }}>₹{price ? price.toLocaleString("en-IN") : "—"}</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, textAlign: "right" as const }}>₹{price ? price.toLocaleString("en-IN") : "—"}</div>
              </div>
            ))}
            {sarees.length > 4 && (
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, padding: "5px 0" }}>+ {sarees.length - 4} more sarees…</div>
            )}
          </div>

          {/* Totals */}
          <div style={{ borderTop: `1.5px solid ${T.borderDef}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Subtotal ({qty} sarees)</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {data.applyGst && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>GST ({data.gstPct}%)</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
              <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            {data.paymentDueDate && (
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>Payment due: {data.paymentDueDate}</div>
            )}
          </div>

          {/* Dispatch details */}
          <div style={{ marginTop: 14, background: T.silkCream, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Dispatch Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
              {[
                ["LR Number", transport.lrNumber || "—"],
                ["Transport", transport.transportCompany || "—"],
                ["Vehicle",   transport.vehicleNumber || "—"],
                ["Date",      transport.dispatchDate || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe }}>{k}: </span>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: T.luxuryBrown }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — full width below both columns */}
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        <button onClick={onSend} style={{ flex: 1, height: 50, background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(110,15,45,0.25)" }}>
          <Send size={16} /> Send Invoice to Customer
        </button>
        <button onClick={onDraft} style={{ height: 50, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <Save size={15} /> Save as Draft
        </button>
        <button onClick={onCancel} style={{ height: 50, padding: "0 20px", background: "transparent", border: `1px solid rgba(139,112,96,0.20)`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Dispatch to Shop modal ────────────────────────────────────────────────────
function DispatchShopModal({ sarees, onConfirm, onClose }: {
  sarees: FinishingReturn[];
  onConfirm: (transport: TransportData) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [transport, setTransport] = useState<TransportData>({ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: today, notes: "" });

  const canNext2 = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;

  const STEPS = ["Sarees", "Transport & LR", "Upload Receipt", "Confirm"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShoppingBag size={20} color={T.antiqueGold} />
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Dispatch to Shop</span>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={15} color="#FFF" /></button>
          </div>
          {/* Step progress */}
          <div style={{ display: "flex", gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: step > i + 1 ? T.antiqueGold : step === i + 1 ? "#FFF" : "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {step > i + 1 ? <CheckCircle2 size={12} color={T.deepWine} /> : <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: step === i + 1 ? T.royalBurgundy : "rgba(255,255,255,0.50)" }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 11, color: step === i + 1 ? "#FFF" : "rgba(255,255,255,0.45)", fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.20)", margin: "0 6px" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {step === 1 && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>{sarees.length} saree{sarees.length > 1 ? "s" : ""} selected for dispatch to shop.</div>
              <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
                {sarees.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderBottom: i < sarees.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.silkCream }}>
                    <Package size={15} color={T.taupe} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{s.sareeId}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{s.designCode} · {s.sareeType}</div>
                    </div>
                    <StatusBadge status={s.inventoryStatus} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && <TransportForm data={transport} onChange={setTransport} />}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Upload the LR receipt document (photo or PDF).</div>
              <div style={{ border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 14, padding: "40px 24px", textAlign: "center" as const, cursor: "pointer", background: T.silkCream }}
                onClick={() => {}}>
                <Upload size={32} color={T.taupe} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Click to upload LR receipt</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>JPG, PNG or PDF — max 10 MB</div>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>You can skip this step and upload later from Dispatch Records.</div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 16 }}>Review dispatch details before confirming.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", background: T.silkCream, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                {[
                  ["Sarees",    sarees.map(s => s.sareeId).join(", ")],
                  ["LR Number", transport.lrNumber],
                  ["Transport", transport.transportCompany],
                  ["Vehicle",   transport.vehicleNumber],
                  ["Date",      transport.dispatchDate],
                  ["Driver",    transport.driverName || "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, wordBreak: "break-all" as const }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ height: 46, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
              Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 2 && !canNext2}
              style={{ flex: 1, height: 46, background: (step === 2 && !canNext2) ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: (step === 2 && !canNext2) ? T.taupe : "#FFF", cursor: (step === 2 && !canNext2) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={() => onConfirm(transport)}
              style={{ flex: 1, height: 46, background: `linear-gradient(135deg, ${T.green} 0%, #145230 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 20px rgba(30,102,64,0.25)" }}>
              <CheckCircle2 size={16} /> Confirm Shop Dispatch
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Dispatch to Wholesale modal ───────────────────────────────────────────────
function DispatchWholesaleModal({ sarees, onConfirm, onClose }: {
  sarees: FinishingReturn[];
  onConfirm: (transport: TransportData, inv: InvoiceData, customerId: string) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [transport, setTransport] = useState<TransportData>({ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: today, notes: "", expectedDelivery: "", specialInstructions: "" });
  const [inv, setInv] = useState<InvoiceData>({ invoiceNumber: `INV-2026-${String(Date.now()).slice(-3)}`, invoiceDate: today, pricePerSaree: "", applyGst: false, gstPct: "18", firmId: "", paymentDueDate: "", invoiceNotes: "" });

  const filteredCustomers = WHOLESALE_CUSTOMERS.filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.city.toLowerCase().includes(customerSearch.toLowerCase()));
  const selectedCustomer  = WHOLESALE_CUSTOMERS.find(c => c.id === customerId) ?? null;

  const canNext1 = !!customerId;
  const canNext3 = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;
  const canSend  = inv.invoiceNumber.trim() && inv.firmId && inv.pricePerSaree;

  const STEPS = ["Customer", "Sarees", "Transport & LR", "Upload Receipt", "Invoice"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: step === 5 ? 1100 : 680, maxHeight: "92vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden", transition: "width 0.3s ease" }}>

        {/* Header */}
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={20} color={T.antiqueGold} />
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Dispatch to Wholesale</span>
              {selectedCustomer && <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>→ {selectedCustomer.name}</span>}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={15} color="#FFF" /></button>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: step > i + 1 ? T.antiqueGold : step === i + 1 ? "#FFF" : "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {step > i + 1 ? <CheckCircle2 size={10} color={T.deepWine} /> : <span style={{ fontFamily: F.mono, fontSize: 8, fontWeight: 700, color: step === i + 1 ? T.royalBurgundy : "rgba(255,255,255,0.45)" }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 10, color: step === i + 1 ? "#FFF" : "rgba(255,255,255,0.40)", fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* Step 1 — Customer */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>Select the wholesale customer for this dispatch.</div>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Search size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers…"
                  style={{ ...inp, paddingLeft: 36 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredCustomers.map(c => (
                  <button key={c.id} onClick={() => setCustomerId(c.id)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: `1.5px solid ${customerId === c.id ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: customerId === c.id ? "rgba(110,15,45,0.04)" : "#FFF", cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: customerId === c.id ? "rgba(110,15,45,0.12)" : T.silkCream, border: `1.5px solid ${customerId === c.id ? T.royalBurgundy : T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={16} color={customerId === c.id ? T.royalBurgundy : T.taupe} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{c.name}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{c.city} · {c.phone}</div>
                    </div>
                    {customerId === c.id && <CheckCircle2 size={18} color={T.royalBurgundy} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Sarees */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>{sarees.length} saree{sarees.length > 1 ? "s" : ""} will be dispatched to {selectedCustomer?.name}.</div>
              <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
                {sarees.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderBottom: i < sarees.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.silkCream }}>
                    <Package size={15} color={T.taupe} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{s.sareeId}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{s.designCode} · {s.sareeType}</div>
                    </div>
                    <StatusBadge status={s.inventoryStatus} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && <TransportForm data={transport} onChange={setTransport} wholesale />}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Upload the LR receipt document for this wholesale dispatch.</div>
              <div style={{ border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 14, padding: "40px 24px", textAlign: "center" as const, cursor: "pointer", background: T.silkCream }}>
                <Upload size={32} color={T.taupe} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Click to upload LR receipt</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>JPG, PNG or PDF — max 10 MB</div>
              </div>
            </div>
          )}

          {step === 5 && (
            <InvoiceGenerator
              sarees={sarees}
              customer={selectedCustomer}
              transport={transport}
              data={inv}
              onChange={setInv}
              onSend={() => onConfirm(transport, inv, customerId)}
              onDraft={() => onClose()}
              onCancel={onClose}
            />
          )}
        </div>

        {step < 5 && (
          <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ height: 46, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
                Back
              </button>
            )}
            <button onClick={() => setStep(s => s + 1)} disabled={(step === 1 && !canNext1) || (step === 3 && !canNext3)}
              style={{ flex: 1, height: 46, background: ((step === 1 && !canNext1) || (step === 3 && !canNext3)) ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: ((step === 1 && !canNext1) || (step === 3 && !canNext3)) ? T.taupe : "#FFF", cursor: ((step === 1 && !canNext1) || (step === 3 && !canNext3)) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Continue <ArrowRight size={15} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Damage records section ────────────────────────────────────────────────────
function DamageRecords({ records }: { records: FinishingReturn[] }) {
  const [open, setOpen] = useState(false);
  const damaged = records.filter(r => r.condition === "damaged");

  return (
    <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "18px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} color={T.crimson} />
          <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Damage &amp; Shortage Records</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, background: T.crimsonBg, color: T.crimson, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 999, padding: "2px 9px", fontWeight: 700 }}>{damaged.length}</span>
        </div>
        {open ? <ChevronUp size={18} color={T.taupe} /> : <ChevronDown size={18} color={T.taupe} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }} style={{ overflow: "hidden" }}>
            <div style={{ borderTop: `1px solid ${T.borderDef}` }}>
              {damaged.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No damage records.</div>
              ) : (
                <>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 100px 1fr 120px 90px", gap: 0, padding: "10px 24px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
                    {["Saree ID", "Damage Type", "Severity", "Reported By", "Notes", "Date", ""].map((h, i) => (
                      <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</div>
                    ))}
                  </div>
                  {damaged.map((r, i) => (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 100px 1fr 120px 90px", gap: 0, padding: "13px 24px", borderBottom: i < damaged.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.silkCream, alignItems: "center" }}>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{r.sareeId}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{r.damageType ?? "—"}</div>
                      <div>
                        {r.damageSeverity ? (
                          <span style={{ background: r.damageSeverity === "Severe" ? T.crimsonBg : r.damageSeverity === "Moderate" ? "rgba(200,155,71,0.12)" : "rgba(30,102,64,0.08)", color: r.damageSeverity === "Severe" ? T.crimson : r.damageSeverity === "Moderate" ? "#8B6A1A" : T.green, border: `1px solid ${r.damageSeverity === "Severe" ? "rgba(192,57,43,0.20)" : r.damageSeverity === "Moderate" ? "rgba(200,155,71,0.22)" : "rgba(30,102,64,0.18)"}`, borderRadius: 999, padding: "3px 9px", fontFamily: F.ui, fontSize: 11, fontWeight: 600 }}>{r.damageSeverity}</span>
                        ) : "—"}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{r.receivedBy.split(" (")[0]}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.damageNotes ?? "—"}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.receivedDate}</div>
                      <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "transparent", fontFamily: F.ui, fontSize: 11, color: T.royalBurgundy, cursor: "pointer" }}>
                        <Eye size={11} /> View
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: T.deepWine, color: "#FFF", padding: "14px 22px", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, zIndex: 600, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 9 }}>
      <CheckCircle2 size={16} color={T.antiqueGold} /> {msg}
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function InventoryPage() {
  const { returns, dispatches, dispatchSarees, readySarees } = useFinishing();
  const { getDesign } = useDesignLibrary();

  // ── Clickable code modals ───────────────────────────────────────────────────
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  // ── Selection ──────────────────────────────────────────────────────────────
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [filter,   setFilter]       = useState<"all" | "ready" | "dispatched" | "damaged">("all");
  const [searchQ,  setSearchQ]      = useState("");
  const [modal,    setModal]        = useState<"shop" | "wholesale" | null>(null);
  const [toast,    setToast]        = useState("");
  const [scanMsg,  setScanMsg]      = useState("");

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total      = returns.length;
  const ready      = returns.filter(r => r.inventoryStatus === "Ready for Dispatch").length;
  const dispatched = returns.filter(r => r.inventoryStatus === "Dispatched").length;
  const damaged    = returns.filter(r => r.inventoryStatus === "Damaged — Review Needed").length;

  // Dispatched this month
  const thisMonth  = dispatches.filter(d => {
    try { return new Date(d.dispatchDate).getMonth() === new Date().getMonth(); } catch { return true; }
  }).reduce((acc, d) => acc + d.sareeIds.length, 0);

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => returns.filter(r => {
    const q = searchQ.toLowerCase();
    const matchSearch = !q || r.sareeId.toLowerCase().includes(q) || r.designCode.toLowerCase().includes(q) || r.sareeType.toLowerCase().includes(q);
    const matchFilter = filter === "all" ? true
      : filter === "ready"      ? r.inventoryStatus === "Ready for Dispatch"
      : filter === "dispatched" ? r.inventoryStatus === "Dispatched"
      : r.inventoryStatus === "Damaged — Review Needed";
    return matchSearch && matchFilter;
  }), [returns, filter, searchQ]);

  const selectedRows = returns.filter(r => selected.has(r.id));
  const dispatchableSelected = selectedRows.filter(r => r.inventoryStatus === "Ready for Dispatch");

  const toggleRow = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };
  const allChecked = filtered.length > 0 && selected.size === filtered.length;

  // Simulated barcode scan
  const handleScan = useCallback(() => {
    const unselected = returns.filter(r => !selected.has(r.id) && r.inventoryStatus === "Ready for Dispatch");
    if (!unselected.length) { setScanMsg("No more sarees to scan."); setTimeout(() => setScanMsg(""), 2000); return; }
    setScanMsg("Scanning…");
    setTimeout(() => {
      const r = unselected[Math.floor(Math.random() * unselected.length)];
      setSelected(prev => { const next = new Set(prev); next.add(r.id); return next; });
      setScanMsg(`Scanned: ${r.sareeId}`);
      setTimeout(() => setScanMsg(""), 2500);
    }, 800);
  }, [returns, selected]);

  const handleShopConfirm = (transport: TransportData) => {
    const sareeIds = dispatchableSelected.map(r => r.sareeId);
    dispatchSarees(sareeIds, { type: "shop", sareeIds, dispatchDate: transport.dispatchDate, lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes });
    setModal(null);
    setSelected(new Set());
    setToast(`${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to Shop`);
  };

  const handleWholesaleConfirm = (transport: TransportData, inv: InvoiceData, customerId: string) => {
    const sareeIds = dispatchableSelected.map(r => r.sareeId);
    const customer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId);
    dispatchSarees(sareeIds, {
      type: "wholesale", sareeIds, dispatchDate: transport.dispatchDate, lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
      customerId, customerName: customer?.name, customerPhone: customer?.phone,
      expectedDelivery: transport.expectedDelivery, specialInstructions: transport.specialInstructions,
      invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate, pricePerSaree: parseFloat(inv.pricePerSaree) || 0,
      gstPct: parseFloat(inv.gstPct) || 0, firmId: inv.firmId, paymentDueDate: inv.paymentDueDate, invoiceNotes: inv.invoiceNotes,
    });
    setModal(null);
    setSelected(new Set());
    setToast(`Invoice sent — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}`);
  };

  const FILTER_PILLS: { key: typeof filter; label: string; count: number }[] = [
    { key: "all",        label: "All Sarees",         count: total     },
    { key: "ready",      label: "Ready for Dispatch",  count: ready     },
    { key: "dispatched", label: "Dispatched",           count: dispatched },
    { key: "damaged",    label: "Damaged",              count: damaged   },
  ];

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, #3D0E1A 0%, #6E0F2D 55%, #8B1A30 100%)`, position: "relative", overflow: "hidden", minHeight: 200, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "44px 56px 48px", zIndex: 10, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 9, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>SINCE 1999 · ADMIN · INVENTORY</span>
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 48, color: "#fff", margin: "0 0 4px", lineHeight: 1.1 }}>Finished Goods</h1>
          <div style={{ fontFamily: F.display, fontWeight: 500, fontStyle: "italic", fontSize: 30, color: T.antiqueGold, marginBottom: 16, lineHeight: 1.2 }}>Inventory &amp; Dispatch</div>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 520, margin: 0, lineHeight: 1.65 }}>
            Track all finished sarees received from quality check and dispatch them to shop or wholesale customers.
          </p>
        </div>
        {/* Stats chips */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, marginRight: 56, alignItems: "flex-end", justifyContent: "center", zIndex: 10, position: "relative" }}>
          {[
            { label: `${total} Total in Inventory`,         dot: T.antiqueGold   },
            { label: `${ready} Ready for Dispatch`,          dot: "#4CAF82"       },
            { label: `${thisMonth} Dispatched This Month`,   dot: "#B0C4DE"       },
            { label: `${damaged} Damaged — Needs Review`,    dot: T.crimson       },
          ].map((chip, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontFamily: F.ui, fontSize: 13, color: "#fff", whiteSpace: "nowrap" as const }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: chip.dot, flexShrink: 0 }} />
              {chip.label}
            </div>
          ))}
        </div>
        {[300, 440, 580].map((sz, i) => (
          <div key={i} style={{ position: "absolute", right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.025})`, pointerEvents: "none" }} />
        ))}
      </div>

      {/* ── STAT STRIP ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: `1px solid ${T.borderDef}`, background: "#fff" }}>
        {[
          { val: total,      label: "Total in Inventory",       sub: "All finished sarees",           color: T.royalBurgundy, bg: "rgba(110,15,45,0.06)" },
          { val: ready,      label: "Ready for Dispatch",        sub: "Cleared, awaiting dispatch",    color: T.green,         bg: T.greenBg              },
          { val: thisMonth,  label: "Dispatched This Month",     sub: "To shop + wholesale",           color: T.luxuryBrown,   bg: "rgba(59,35,20,0.06)"  },
          { val: damaged,    label: "Damaged — Needs Review",    sub: "Reported during verification",  color: T.crimson,       bg: T.crimsonBg            },
        ].map((s, i) => (
          <div key={i} style={{ padding: "22px 28px", borderRight: i < 3 ? `1px solid ${T.borderDef}` : "none", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {i === 0 && <Package size={22} color={s.color} />}
              {i === 1 && <CheckCircle2 size={22} color={s.color} />}
              {i === 2 && <Truck size={22} color={s.color} />}
              {i === 3 && <AlertTriangle size={22} color={s.color} />}
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.val}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown, marginTop: 2 }}>{s.label}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "36px 56px 80px", maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 28, alignItems: "start" }}>

          {/* ── MAIN TABLE SECTION ──────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Toolbar */}
            <div style={{ ...card, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                {/* Scan */}
                <button onClick={handleScan}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 16px", height: 40, background: T.deepWine, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.royalBurgundy; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.deepWine; }}>
                  <Scan size={15} color="#FFF" /> Scan Barcode
                </button>

                {/* Search */}
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <Search size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input value={searchQ} onChange={e => { setSearchQ(e.target.value); }} placeholder="Search by Saree ID, Design, Type…"
                    style={{ ...inp, paddingLeft: 36, height: 40, fontSize: 13 }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
                    onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
                </div>

                {/* Filter pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                  {FILTER_PILLS.map(p => (
                    <button key={p.key} onClick={() => setFilter(p.key)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", height: 34, border: `1px solid ${filter === p.key ? T.royalBurgundy : T.borderDef}`, borderRadius: 999, background: filter === p.key ? "rgba(110,15,45,0.06)" : "transparent", fontFamily: F.ui, fontSize: 12, fontWeight: filter === p.key ? 600 : 400, color: filter === p.key ? T.royalBurgundy : T.taupe, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const }}>
                      {p.label}
                      <span style={{ fontFamily: F.mono, fontSize: 10, background: filter === p.key ? "rgba(110,15,45,0.10)" : "rgba(139,112,96,0.10)", color: filter === p.key ? T.royalBurgundy : T.taupe, borderRadius: 999, padding: "1px 6px" }}>{p.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan feedback */}
              {scanMsg && (
                <div style={{ marginTop: 10, background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 8, padding: "7px 12px", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>
                  {scanMsg}
                </div>
              )}
            </div>

            {/* Action bar */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: EASE }}
                  style={{ background: T.deepWine, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 20px rgba(61,14,26,0.20)" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.80)", flex: 1 }}>
                    <strong style={{ color: "#FFF" }}>{selected.size}</strong> selected
                    {dispatchableSelected.length !== selected.size && ` (${dispatchableSelected.length} ready for dispatch)`}
                  </span>
                  <button onClick={() => setModal("shop")} disabled={!dispatchableSelected.length}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: T.antiqueGold, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.deepWine, cursor: dispatchableSelected.length ? "pointer" : "not-allowed", opacity: dispatchableSelected.length ? 1 : 0.5 }}>
                    <ShoppingBag size={15} /> Dispatch to Shop
                  </button>
                  <button onClick={() => setModal("wholesale")} disabled={!dispatchableSelected.length}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: "#FFF", border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.royalBurgundy, cursor: dispatchableSelected.length ? "pointer" : "not-allowed", opacity: dispatchableSelected.length ? 1 : 0.5 }}>
                    <Users size={15} /> Dispatch to Wholesale
                  </button>
                  <button onClick={() => setSelected(new Set())} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={14} color="#FFF" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QC Passed — Pending Finishing Assignment (appears above Ready for Dispatch) */}
            {readySarees.length > 0 && (
              <div style={{ ...card, borderRadius: 16, overflow: "hidden", marginBottom: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "130px 110px 130px 130px 100px 1fr", gap: 0, padding: "11px 20px", background: "rgba(200,155,71,0.08)", borderBottom: `1px solid ${T.borderDef}` }}>
                  {["Saree ID", "Design", "Type", "Weaver", "QC Date", "Status"].map((h, i) => (
                    <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: "#8B6018", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</div>
                  ))}
                </div>
                {readySarees.map((s, i) => (
                  <div key={s.id}
                    style={{ display: "grid", gridTemplateColumns: "130px 110px 130px 130px 100px 1fr", gap: 0, padding: "13px 20px", borderBottom: i < readySarees.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.warmIvory, alignItems: "center" }}
                  >
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{s.id}</div>
                    <div
                      onClick={() => setOpenDesignCode(s.designCode)}
                      style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, cursor: "pointer", width: "fit-content" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "underline"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "none"}
                    >{s.designCode}</div>
                    <div
                      onClick={() => { if (s.sareeTypeCode) setOpenSareeTypeCode(s.sareeTypeCode); }}
                      style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, cursor: s.sareeTypeCode ? "pointer" : "default", width: "fit-content" }}
                      onMouseEnter={e => { if (s.sareeTypeCode) (e.currentTarget as HTMLDivElement).style.textDecoration = "underline"; }}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "none"}
                    >{s.sareeType}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{s.weaverName}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{s.qcPassDate}</div>
                    <div><StatusBadge status="QC Passed — Pending Finishing Assignment" /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "36px 130px 90px 130px 80px 110px 190px 90px", gap: 0, padding: "11px 20px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
                <div onClick={toggleAll} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                  {allChecked ? <CheckSquare size={15} color={T.royalBurgundy} /> : <Square size={15} color={T.taupe} />}
                </div>
                {["Saree ID", "Design", "Type", "Weaver", "Rcvd Date", "Finishing", "Dispatch Status", ""].map((h, i) => (
                  <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No sarees match your filters.</div>
              ) : filtered.map((r, i) => {
                const sel = selected.has(r.id);
                return (
                  <div key={r.id}
                    style={{ display: "grid", gridTemplateColumns: "36px 130px 90px 130px 80px 110px 190px 90px", gap: 0, padding: "13px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderDef}` : "none", background: sel ? "rgba(110,15,45,0.03)" : i % 2 === 0 ? "#FFF" : T.warmIvory, alignItems: "center", cursor: "pointer", transition: "background 0.12s" }}
                    onClick={() => toggleRow(r.id)}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = "rgba(110,15,45,0.02)"; }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? "#FFF" : T.warmIvory; }}
                  >
                    <div onClick={e => { e.stopPropagation(); toggleRow(r.id); }} style={{ display: "flex", alignItems: "center" }}>
                      {sel ? <CheckSquare size={15} color={T.royalBurgundy} /> : <Square size={15} color={T.taupe} />}
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{r.sareeId}</div>
                    <div
                      onClick={e => { e.stopPropagation(); setOpenDesignCode(r.designCode); }}
                      style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, cursor: "pointer", width: "fit-content" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "underline"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "none"}
                    >{r.designCode}</div>
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        const rec = getSareeTypeByName(r.sareeType);
                        if (rec) setOpenSareeTypeCode(rec.code);
                      }}
                      style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, cursor: "pointer", width: "fit-content" }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "underline"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "none"}
                    >{r.sareeType}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{r.weaverName.split(" ")[0]}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.receivedDate}</div>
                    <div><StatusBadge status={r.inventoryStatus} /></div>
                    <div onClick={e => e.stopPropagation()}>
                      <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "transparent", fontFamily: F.ui, fontSize: 11, color: T.royalBurgundy, cursor: "pointer" }}>
                        <Eye size={11} /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Damage records */}
            <DamageRecords records={returns} />
          </div>

          {/* ── QUICK ACTIONS SIDEBAR ───────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 100 }}>
            {/* Dispatch buttons */}
            <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 14 }}>Quick Dispatch</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { if (ready > 0) { setFilter("ready"); } setModal(selected.size > 0 ? "shop" : null); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left" as const }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShoppingBag size={18} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF" }}>Dispatch to Shop</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>Select sarees first</div>
                  </div>
                </button>
                <button onClick={() => { if (ready > 0) setFilter("ready"); setModal(selected.size > 0 ? "wholesale" : null); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, cursor: "pointer", textAlign: "left" as const, boxShadow: "0 1px 6px rgba(44,24,16,0.06)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={18} color={T.royalBurgundy} />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Dispatch to Wholesale</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>With invoice generation</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category split */}
            <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 16 }}>Category Split</div>
              {[
                { label: "Retail (Shop)", val: Math.max(1, dispatched - 1), total: Math.max(1, total), color: T.royalBurgundy },
                { label: "Wholesale",     val: Math.min(1, dispatched),      total: Math.max(1, total), color: T.antiqueGold  },
                { label: "Pending",       val: ready,                        total: Math.max(1, total), color: T.green        },
              ].map(b => {
                const pct = Math.round((b.val / b.total) * 100);
                return (
                  <div key={b.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.label}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: b.color }}>{b.val} <span style={{ color: T.taupe, fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ background: "rgba(139,112,96,0.10)", borderRadius: 999, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: b.color, borderRadius: 999, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent dispatches */}
            <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 14 }}>Recent Dispatches</div>
              {dispatches.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textAlign: "center" as const, padding: "12px 0" }}>No dispatches yet.</div>
              ) : dispatches.slice(0, 4).map((d, i) => (
                <div key={d.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < Math.min(dispatches.length, 4) - 1 ? `1px solid ${T.borderDef}` : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: d.type === "shop" ? "rgba(110,15,45,0.08)" : T.bgGold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {d.type === "shop" ? <ShoppingBag size={13} color={T.royalBurgundy} /> : <Users size={13} color={T.antiqueGold} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: T.royalBurgundy }}>{d.lrNumber}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{d.sareeIds.length} sarees · {d.dispatchDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === "shop" && dispatchableSelected.length > 0 && (
          <DispatchShopModal
            key="shop-modal"
            sarees={dispatchableSelected}
            onConfirm={handleShopConfirm}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "wholesale" && dispatchableSelected.length > 0 && (
          <DispatchWholesaleModal
            key="wholesale-modal"
            sarees={dispatchableSelected}
            onConfirm={handleWholesaleConfirm}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
  );
}
