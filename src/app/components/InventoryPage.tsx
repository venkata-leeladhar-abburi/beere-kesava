import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
const imgInventoryHero = "https://images.unsplash.com/photo-1585914924626-15adac1e6402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import {
  Search, Scan, CheckSquare, Square, Package, Truck, ShoppingBag, Users,
  ChevronDown, ChevronUp, X, CheckCircle2, AlertTriangle, Clock, FileText,
  Upload, Eye, Send, Save, ArrowRight, Building2, Hash, Filter,
} from "lucide-react";
import { useFinishing, FinishingReturn, DispatchRecord } from "./FinishingContext";
import { useFirms } from "./FirmsContext";
import { useDesignLibrary } from "./DesignLibraryContext";
import { useBulkOrders } from "./BulkOrderContext";
import { useBatches } from "./BatchContext";
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
  { id: "WHL-001", name: "Lakshmi Silks",             city: "Hyderabad",  terms: "Net 30", phone: "+91 98450 11223", address: "G-12, Silk Plaza, Madhapur, Hyderabad - 500081", gstCode: "36AAAAA1111A1Z1" },
  { id: "WHL-002", name: "Narayana Silk Emporium",    city: "Vijayawada", terms: "Net 45", phone: "+91 99123 44556", address: "40-1-5, MG Road, Vijayawada - 520010", gstCode: "37BBBBB2222B2Z2" },
  { id: "WHL-003", name: "Padmavathi Textiles",       city: "Chennai",    terms: "Net 30", phone: "+91 94440 99887", address: "82, Pondy Bazaar, T. Nagar, Chennai - 600017", gstCode: "33CCCCC3333C3Z3" },
  { id: "WHL-004", name: "Vijaya Silk House",         city: "Bangalore",  terms: "Net 60", phone: "+91 98800 55667", address: "144, Commercial Street, Bangalore - 560001", gstCode: "29DDDDD4444D4Z4" },
  { id: "WHL-005", name: "Meenakshi Silks",           city: "Coimbatore", terms: "Net 30", phone: "+91 94250 88776", address: "12, Cross Cut Road, Gandhipuram, Coimbatore - 641012", gstCode: "33EEEEE5555E5Z5" },
  { id: "WHL-006", name: "Kalavathi Exports",         city: "Surat",      terms: "Net 45", phone: "+91 99790 33445", address: "Ring Road Textile Market, Surat - 395002", gstCode: "24FFFFF6666F6Z6" },
];

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    "Ready for Dispatch":   { bg: T.greenBg,   color: T.green,   border: "rgba(30,102,64,0.20)"  },
    "Dispatched":           { bg: "rgba(59,35,20,0.08)", color: T.luxuryBrown, border: "rgba(59,35,20,0.18)" },
    "Damaged — Review Needed": { bg: T.crimsonBg, color: T.crimson, border: "rgba(192,57,43,0.20)" },
    "QC Passed":            { bg: "rgba(200,155,71,0.14)", color: "#8B6018", border: "rgba(200,155,71,0.32)" },
  };
  const s = cfg[status] ?? cfg["Ready for Dispatch"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" as const }}>
      {status === "Ready for Dispatch"      && <CheckCircle2 size={10} />}
      {status === "Dispatched"              && <Truck size={10} />}
      {status === "Damaged — Review Needed" && <AlertTriangle size={10} />}
      {status === "QC Passed"               && <Clock size={10} />}
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
  sarees, customer, transport, data, onChange, onSend, onDraft, onCancel, bulkOrderRef,
}: {
  sarees: FinishingReturn[];
  customer: typeof WHOLESALE_CUSTOMERS[0] | null;
  transport: TransportData;
  data: InvoiceData;
  onChange: (d: InvoiceData) => void;
  onSend: () => void;
  onDraft: () => void;
  onCancel: () => void;
  bulkOrderRef?: string;
}) {
  const { firms } = useFirms();
  const { bulkOrders } = useBulkOrders();
  const { batches } = useBatches();
  const linkedOrder = bulkOrders.find(o => o.ref === bulkOrderRef);
  const set = (k: keyof InvoiceData) => (v: string | boolean) => onChange({ ...data, [k]: v });

  const qty          = sarees.length;
  const price        = parseFloat(data.pricePerSaree) || 0;
  const subtotal     = qty * price;
  const gstAmount    = data.applyGst ? subtotal * (parseFloat(data.gstPct) || 0) / 100 : 0;
  const grandTotal   = subtotal + gstAmount;
  const selectedFirm = firms.find(f => f.id === data.firmId);

  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const sareeIds = sarees.map(s => s.sareeId || s.id);
  const detectedBatches = Array.from(new Set(
    sareeIds.map(id => batches.find(b => b.rows.some(row => row.sareeId === id))?.batchId).filter(Boolean)
  ));
  const batchStr = detectedBatches.length > 0 ? detectedBatches.join(", ") : "—";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      {/* Left — form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Auto-filled (read-only)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["Customer",     customer?.name ?? "—"],
              ["Bulk Order",   bulkOrderRef || "—"],
              ["Batch(es)",    batchStr],
              ["Dispatch Date",transport.dispatchDate],
              ["LR Number",   transport.lrNumber],
              ["Transport",   transport.transportCompany],
              ["Sarees",      sarees.map(s => s.sareeId).join(", ")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, minWidth: 110, flexShrink: 0 }}>{k}</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: (k === "Bulk Order" || k === "Batch(es)") && v !== "—" ? T.royalBurgundy : T.luxuryBrown, flex: 1, wordBreak: "break-all" as const, fontWeight: (k === "Bulk Order" || k === "Batch(es)") && v !== "—" ? 700 : 400 }}>{v}</span>
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
              {bulkOrderRef && (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.07)", border: `1px solid rgba(110,15,45,0.16)`, borderRadius: 6, padding: "3px 8px", width: "fit-content" }}>
                    <ShoppingBag size={10} color={T.royalBurgundy} />
                    <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrderRef}</span>
                  </div>
                  {linkedOrder && (
                    <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, marginTop: 1, textTransform: "capitalize" as const, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {linkedOrder.sareeType.split(" · ")[0]} · {linkedOrder.design}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" as const, maxWidth: "55%" }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Bill To</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginTop: 3 }}>{customer?.name ?? "—"}</div>
              {customer?.address ? (
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3, lineHeight: 1.4 }}>{customer.address}</div>
              ) : (
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3 }}>{customer?.city}</div>
              )}
              {customer?.phone && (
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>{customer.phone}</div>
              )}
              {customer?.gstCode && (
                <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.royalBurgundy, fontWeight: 700, marginTop: 2 }}>GST: {customer.gstCode}</div>
              )}
            </div>
          </div>

          {/* Sarees table */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 90px", padding: "6px 0", borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 4 }}>
              {["Item", "Qty", "Rate (₹)", "Amount (₹)"].map((h, i) => (
                <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i > 0 ? "right" as const : "left" as const }}>{h}</div>
              ))}
            </div>
            {sarees.slice(0, 4).map((s, i) => {
              const sId = s.sareeId || s.id;
              const sareeBatch = batches.find(b => b.rows.some(row => row.sareeId === sId))?.batchId;
              return (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 90px", padding: "5px 0", borderBottom: i < Math.min(sarees.length, 4) - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, fontWeight: 600 }}>{sId}</span>
                      {sareeBatch && (
                        <span style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{sareeBatch}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe }}>{s.designCode} · {s.sareeType}</div>
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, textAlign: "right" as const }}>1</div>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, textAlign: "right" as const }}>₹{price ? price.toLocaleString("en-IN") : "—"}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown, textAlign: "right" as const }}>₹{price ? price.toLocaleString("en-IN") : "—"}</div>
                </div>
              );
            })}
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
            {bulkOrderRef && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(110,15,45,0.06)", border: `1px solid rgba(110,15,45,0.14)`, borderRadius: 6, padding: "5px 10px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe }}>Bulk Order: </span>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrderRef}</span>
              </div>
            )}
            {detectedBatches.length > 0 && (
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(200,155,71,0.06)", border: `1px solid rgba(200,155,71,0.14)`, borderRadius: 6, padding: "5px 10px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe }}>Production Batch: </span>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.antiqueGold }}>{batchStr}</span>
              </div>
            )}
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
function DispatchWholesaleModal({ sarees, onConfirm, onClose, initialBulkOrderRef, initialCustomerId }: {
  sarees: FinishingReturn[];
  onConfirm: (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef?: string) => void;
  onClose: () => void;
  initialBulkOrderRef?: string;
  initialCustomerId?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState(initialCustomerId || "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [bulkOrderRef, setBulkOrderRef] = useState(initialBulkOrderRef || "");
  const { bulkOrders } = useBulkOrders();
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

              {/* Bulk Order linkage */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Link to Bulk Order <span style={{ fontWeight: 400, textTransform: "none" as const }}>(optional)</span></div>
                <div style={{ position: "relative" }}>
                  <select
                    value={bulkOrderRef}
                    onChange={e => setBulkOrderRef(e.target.value)}
                    style={{ ...inp, appearance: "none", cursor: "pointer", paddingRight: 32 }}
                  >
                    <option value="">— Not linked to a bulk order —</option>
                    {bulkOrders.map(o => (
                      <option key={o.ref} value={o.ref}>{o.ref} · {o.customer} · {o.total} sarees · Due {o.due}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
                {bulkOrderRef && (() => {
                  const linked = bulkOrders.find(o => o.ref === bulkOrderRef);
                  return linked ? (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(110,15,45,0.04)", border: `1.5px solid rgba(110,15,45,0.14)`, borderRadius: 10 }}>
                      <ShoppingBag size={16} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{linked.ref}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{linked.customer} · {linked.total} sarees · Due {linked.due}</div>
                      </div>
                      <div style={{ background: linked.status === "on-track" ? "rgba(30,102,64,0.10)" : "rgba(192,57,43,0.10)", border: `1px solid ${linked.status === "on-track" ? "rgba(30,102,64,0.22)" : "rgba(192,57,43,0.22)"}`, borderRadius: 6, padding: "3px 8px" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: linked.status === "on-track" ? T.green : T.crimson }}>{linked.status}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* Step 2 — Sarees */}
          {step === 2 && (
            <div>
              {/* Linked bulk order banner */}
              {bulkOrderRef && (() => {
                const linked = bulkOrders.find(o => o.ref === bulkOrderRef);
                return linked ? (
                  <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(110,15,45,0.05)", border: `1.5px solid rgba(110,15,45,0.16)`, borderRadius: 12 }}>
                    <ShoppingBag size={18} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{linked.ref}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{linked.customer} · {linked.total} sarees · Due {linked.due}</div>
                    </div>
                    <div style={{ background: linked.status === "on-track" ? "rgba(30,102,64,0.10)" : "rgba(192,57,43,0.10)", border: `1px solid ${linked.status === "on-track" ? "rgba(30,102,64,0.22)" : "rgba(192,57,43,0.22)"}`, borderRadius: 6, padding: "3px 8px" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: linked.status === "on-track" ? T.green : T.crimson }}>{linked.status}</span>
                    </div>
                  </div>
                ) : null;
              })()}
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
              bulkOrderRef={bulkOrderRef || undefined}
              onSend={() => onConfirm(transport, inv, customerId, bulkOrderRef || undefined)}
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
export interface InventoryRecord {
  id: string; // Saree ID
  designCode: string;
  sareeType: string;
  weaverName: string;
  date: string; // qcPassDate or receivedDate
  status: "QC Passed" | "Ready for Dispatch" | "Dispatched" | "Damaged — Review Needed";
  rawType: "readySaree" | "return";
  originalId: string; // readySaree id or return id
  bulkOrderRef?: string;
  batchId?: string;
}

export const getLoomForRecord = (id: string, weaverName: string): string => {
  const match = id.match(/-L(\d+)-/);
  if (match) return `L${match[1]}`;
  
  // Fallbacks based on weaverName
  const name = weaverName?.toLowerCase() || "";
  if (name.includes("padma") || name.includes("kamala")) return "L1";
  if (name.includes("ravi") || name.includes("suresh")) return "L2";
  if (name.includes("lakshmi") || name.includes("anand") || name.includes("venkat") || name.includes("loom 3")) return "L3";
  if (name.includes("meena") || name.includes("loom 4")) return "L4";
  if (name.includes("loom 1")) return "L1";
  if (name.includes("loom 2")) return "L2";
  
  return "Unknown";
};

export function InventoryPage() {
  const { returns, dispatches, dispatchSarees, readySarees } = useFinishing();
  const { getDesign } = useDesignLibrary();
  const { bulkOrders, markDispatched } = useBulkOrders();
  const { batches } = useBatches();

  // ── Clickable code modals ───────────────────────────────────────────────────
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  // ── Selection & Filter States ──────────────────────────────────────────────
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [filter,   setFilter]                 = useState<"all" | "pending" | "ready" | "dispatched" | "damaged">("all");
  const [searchQ,  setSearchQ]                = useState("");
  const [selectedBulkOrder, setSelectedBulkOrder] = useState<string>("all");
  const [selectedLoom, setSelectedLoom]       = useState<string>("all");
  const [selectedWeaver, setSelectedWeaver]   = useState<string>("all");
  const [selectedBatch, setSelectedBatch]     = useState<string>("all");
  const [viewingItem, setViewingItem]         = useState<InventoryRecord | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [modal,    setModal]                  = useState<"shop" | "wholesale" | null>(null);
  const [toast,    setToast]                  = useState("");
  const [scanMsg,  setScanMsg]                = useState("");

  // ── Unified Records ────────────────────────────────────────────────────────
  const allRecords = useMemo(() => {
    const list: InventoryRecord[] = [];
    
    // 1. Ready sarees (QC Passed — pending finishing)
    readySarees.forEach(s => {
      const boRef = (s as any).bulkOrderRef || bulkOrders.find(bo =>
        bo.design === s.designCode &&
        (bo.sareeType.toLowerCase().includes(s.sareeType.toLowerCase()) ||
         s.sareeType.toLowerCase().includes(bo.sareeType.split(" \u00b7 ")[0].toLowerCase()))
      )?.ref;
      const bId = batches.find(b => b.rows.some(row => row.sareeId === s.id))?.batchId;
      list.push({
        id: s.id,
        designCode: s.designCode,
        sareeType: s.sareeType,
        weaverName: s.weaverName,
        date: s.qcPassDate,
        status: "QC Passed",
        rawType: "readySaree",
        originalId: s.id,
        bulkOrderRef: boRef,
        batchId: bId
      });
    });

    // 2. Returns (Ready for Dispatch, Dispatched, Damaged)
    returns.forEach(r => {
      const boRef = bulkOrders.find(bo =>
        bo.design === r.designCode &&
        (bo.sareeType.toLowerCase().includes(r.sareeType.toLowerCase()) ||
         r.sareeType.toLowerCase().includes(bo.sareeType.split(" \u00b7 ")[0].toLowerCase()))
      )?.ref;
      const bId = batches.find(b => b.rows.some(row => row.sareeId === r.sareeId))?.batchId;
      list.push({
        id: r.sareeId,
        designCode: r.designCode,
        sareeType: r.sareeType,
        weaverName: r.weaverName,
        date: r.receivedDate,
        status: r.inventoryStatus === "Damaged \u2014 Review Needed" ? "Damaged \u2014 Review Needed" : r.inventoryStatus,
        rawType: "return",
        originalId: r.id,
        bulkOrderRef: boRef,
        batchId: bId
      });
    });

    return list;
  }, [readySarees, returns, bulkOrders, batches]);

  const uniqueWeavers = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach(r => {
      if (r.weaverName) set.add(r.weaverName);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const uniqueLooms = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach(r => {
      const loom = getLoomForRecord(r.id, r.weaverName);
      if (loom && loom !== "Unknown") set.add(loom);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  const uniqueBatches = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach(r => {
      if (r.batchId) set.add(r.batchId);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total        = allRecords.length;
  const pendingCount = allRecords.filter(r => r.status === "QC Passed").length;
  const ready        = allRecords.filter(r => r.status === "Ready for Dispatch").length;
  const dispatched   = allRecords.filter(r => r.status === "Dispatched").length;
  const damaged      = allRecords.filter(r => r.status === "Damaged — Review Needed").length;

  // Dispatched this month
  const thisMonth  = dispatches.filter(d => {
    try { return new Date(d.dispatchDate).getMonth() === new Date().getMonth(); } catch { return true; }
  }).reduce((acc, d) => acc + d.sareeIds.length, 0);

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => allRecords.filter(r => {
    const q = searchQ.toLowerCase();
    const matchSearch = !q || r.id.toLowerCase().includes(q) || r.designCode.toLowerCase().includes(q) || r.sareeType.toLowerCase().includes(q);
    const matchFilter = filter === "all" ? true
      : filter === "pending"    ? r.status === "QC Passed"
      : filter === "ready"      ? r.status === "Ready for Dispatch"
      : filter === "dispatched" ? r.status === "Dispatched"
      : r.status === "Damaged \u2014 Review Needed";
    const matchBulkOrder = selectedBulkOrder === "all" || r.bulkOrderRef === selectedBulkOrder;
    const recordLoom = getLoomForRecord(r.id, r.weaverName);
    const matchLoom = selectedLoom === "all" || recordLoom === selectedLoom;
    const matchWeaver = selectedWeaver === "all" || r.weaverName === selectedWeaver;
    const matchBatch = selectedBatch === "all" || r.batchId === selectedBatch;
    return matchSearch && matchFilter && matchBulkOrder && matchLoom && matchWeaver && matchBatch;
  }), [allRecords, filter, searchQ, selectedBulkOrder, selectedLoom, selectedWeaver, selectedBatch]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const dispatchableSelected = useMemo(() => {
    return returns.filter(r => selected.has(r.sareeId) && r.inventoryStatus === "Ready for Dispatch");
  }, [returns, selected]);

  const toggleRow = (id: string, isCheckable: boolean) => {
    if (!isCheckable) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const checkableFiltered = useMemo(() => filtered.filter(r => r.status === "Ready for Dispatch"), [filtered]);
  const checkableSelected = useMemo(() => checkableFiltered.filter(r => selected.has(r.id)), [checkableFiltered, selected]);
  
  const toggleAll = () => {
    if (checkableSelected.length === checkableFiltered.length && checkableFiltered.length > 0) {
      setSelected(prev => {
        const next = new Set(prev);
        checkableFiltered.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        checkableFiltered.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const allChecked = checkableFiltered.length > 0 && checkableSelected.length === checkableFiltered.length;

  // Simulated barcode scan
  const handleScan = useCallback(() => {
    const unselected = returns.filter(r => !selected.has(r.sareeId) && r.inventoryStatus === "Ready for Dispatch");
    if (!unselected.length) { setScanMsg("No more sarees to scan."); setTimeout(() => setScanMsg(""), 2000); return; }
    setScanMsg("Scanning…");
    setTimeout(() => {
      const r = unselected[Math.floor(Math.random() * unselected.length)];
      setSelected(prev => { const next = new Set(prev); next.add(r.sareeId); return next; });
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

  const handleWholesaleConfirm = (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef?: string) => {
    const sareeIds = dispatchableSelected.map(r => r.sareeId);
    const customer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId);
    dispatchSarees(sareeIds, {
      type: "wholesale", sareeIds, dispatchDate: transport.dispatchDate, lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
      customerId, customerName: customer?.name, customerPhone: customer?.phone,
      expectedDelivery: transport.expectedDelivery, specialInstructions: transport.specialInstructions,
      invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate, pricePerSaree: parseFloat(inv.pricePerSaree) || 0,
      gstPct: parseFloat(inv.gstPct) || 0, firmId: inv.firmId, paymentDueDate: inv.paymentDueDate, invoiceNotes: inv.invoiceNotes,
      bulkOrderRef,
    });
    if (bulkOrderRef) {
      markDispatched(bulkOrderRef, inv.invoiceNumber);
    }
    setModal(null);
    setSelected(new Set());
    setToast(`Invoice sent — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}`);
  };

  const FILTER_PILLS: { key: typeof filter; label: string; count: number }[] = [
    { key: "all",        label: "All Sarees",        count: total        },
    { key: "pending",    label: "QC Passed",         count: pendingCount },
    { key: "ready",      label: "Ready to Dispatch", count: ready        },
    { key: "dispatched", label: "Dispatched",         count: dispatched   },
    { key: "damaged",    label: "Damaged",            count: damaged      },
  ];

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: "#3D0E1A", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · INVENTORY MANAGEMENT</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Finished Goods</h1>
            <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Dispatch</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
            Track all finished sarees received from quality check and dispatch them to shop or wholesale customers.
          </p>
        </div>
        {/* Right image with gradient */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #3D0E1A 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
          <img src={imgInventoryHero} alt="Silk saree inventory" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { val: total,        label: "TOTAL IN INVENTORY",     sub: "All finished sarees",          hi: false, crimson: false, goldVal: false, Icon: Package },
            { val: pendingCount, label: "PENDING FINISHING",      sub: "QC passed, needs finishing",   hi: false, crimson: false, goldVal: false, Icon: Clock },
            { val: ready,        label: "READY FOR DISPATCH",     sub: "Cleared, awaiting dispatch",   hi: true,  crimson: false, goldVal: true,  Icon: CheckCircle2 },
            { val: thisMonth,    label: "DISPATCHED THIS MONTH",  sub: "To shop + wholesale",          hi: false, crimson: false, goldVal: false, Icon: Truck },
            { val: damaged,      label: "DAMAGED — NEEDS REVIEW", sub: "Reported during verification", hi: false, crimson: true,  goldVal: false, Icon: AlertTriangle },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                  {m.sub}
                </div>
              </div>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "96px 56px 80px", maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 28, alignItems: "start" }}>

          {/* ── MAIN TABLE SECTION ──────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Toolbar */}
            <div style={{ ...card, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Main row: Scan | Search | Pills | Filter▾ */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>

                {/* Scan */}
                <button onClick={handleScan}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, background: T.deepWine, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as const }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.royalBurgundy; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.deepWine; }}>
                  <Scan size={14} color="#FFF" /> Scan
                </button>

                {/* Search — grows to fill space */}
                <div style={{ position: "relative", flex: "1 1 160px", minWidth: 0 }}>
                  <Search size={13} color={T.taupe} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by Saree ID, Design, Type…"
                    style={{ ...inp, paddingLeft: 34, height: 38, fontSize: 13, width: "100%" }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
                    onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
                </div>

                {/* Status pills — inline beside search */}
                {FILTER_PILLS.map(p => (
                  <button key={p.key} onClick={() => setFilter(p.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "0 10px", height: 38, flexShrink: 0,
                      border: `1px solid ${filter === p.key ? T.royalBurgundy : T.borderDef}`,
                      borderRadius: 999,
                      background: filter === p.key ? "rgba(110,15,45,0.07)" : "#FFF",
                      fontFamily: F.ui, fontSize: 12,
                      fontWeight: filter === p.key ? 700 : 400,
                      color: filter === p.key ? T.royalBurgundy : T.taupe,
                      cursor: "pointer", transition: "all 0.13s", whiteSpace: "nowrap" as const
                    }}>
                    {p.label}
                    <span style={{
                      fontFamily: F.mono, fontSize: 10,
                      background: filter === p.key ? "rgba(110,15,45,0.12)" : "rgba(139,112,96,0.10)",
                      color: filter === p.key ? T.royalBurgundy : T.taupe,
                      borderRadius: 999, padding: "1px 5px"
                    }}>{p.count}</span>
                  </button>
                ))}

                {/* Filter button — bulk order popover */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={() => setShowFilterPanel(v => !v)}
                    title="More filters (Bulk Order, Loom, Weaver)"
                    style={{
                      display: "flex", alignItems: "center", gap: 5, height: 38, padding: "0 12px",
                      border: `1px solid ${(selectedBulkOrder !== "all" || selectedLoom !== "all" || selectedWeaver !== "all" || selectedBatch !== "all") ? T.royalBurgundy : T.borderDef}`,
                      borderRadius: 10,
                      background: (selectedBulkOrder !== "all" || selectedLoom !== "all" || selectedWeaver !== "all" || selectedBatch !== "all") ? "rgba(110,15,45,0.07)" : "#FFF",
                      fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                      color: (selectedBulkOrder !== "all" || selectedLoom !== "all" || selectedWeaver !== "all" || selectedBatch !== "all") ? T.royalBurgundy : T.taupe,
                      cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const
                    }}>
                    <Filter size={14} />
                    {((selectedBulkOrder !== "all" ? 1 : 0) + (selectedLoom !== "all" ? 1 : 0) + (selectedWeaver !== "all" ? 1 : 0) + (selectedBatch !== "all" ? 1 : 0)) > 0 && (
                      <span style={{ background: T.royalBurgundy, color: "#FFF", borderRadius: 999, fontFamily: F.mono, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>
                        {(selectedBulkOrder !== "all" ? 1 : 0) + (selectedLoom !== "all" ? 1 : 0) + (selectedWeaver !== "all" ? 1 : 0) + (selectedBatch !== "all" ? 1 : 0)}
                      </span>
                    )}
                    <ChevronDown size={12} style={{ transition: "transform 0.2s", transform: showFilterPanel ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>

                  {/* Filter Popover modal (centered in the middle, large size) */}
                  <AnimatePresence>
                    {showFilterPanel && (
                      <div
                        style={{
                          position: "fixed", inset: 0, zIndex: 9999,
                          background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                        onClick={() => setShowFilterPanel(false)}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 15 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            background: "#FFFDF9", border: `1px solid ${T.borderDef}`,
                            borderRadius: 24, boxShadow: "0 24px 70px rgba(61,14,26,0.30)",
                            padding: "32px 36px", width: "480px", maxWidth: "90%", display: "flex", flexDirection: "column", gap: 20
                          }}
                        >
                          {/* Modal Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.borderDef}`, paddingBottom: 16 }}>
                            <div>
                              <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.royalBurgundy }}>Advanced Filters</div>
                              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 4 }}>Filter sarees by status, batch order, loom, or weaver</div>
                            </div>
                            <button onClick={() => setShowFilterPanel(false)} style={{ background: "rgba(110,15,45,0.06)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <X size={16} color={T.royalBurgundy} />
                            </button>
                          </div>

                          {/* Status section */}
                          <div>
                            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10 }}>Filter by Status</div>
                            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                              {FILTER_PILLS.map(p => (
                                <button key={p.key} onClick={() => setFilter(p.key)}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", height: 34, border: `1px solid ${filter === p.key ? T.royalBurgundy : T.borderDef}`, borderRadius: 999, background: filter === p.key ? "rgba(110,15,45,0.07)" : "transparent", fontFamily: F.ui, fontSize: 12.5, fontWeight: filter === p.key ? 600 : 400, color: filter === p.key ? T.royalBurgundy : T.taupe, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" as const }}>
                                  {p.label}
                                  <span style={{ fontFamily: F.mono, fontSize: 10, background: filter === p.key ? "rgba(110,15,45,0.12)" : "rgba(139,112,96,0.10)", color: filter === p.key ? T.royalBurgundy : T.taupe, borderRadius: 999, padding: "1px 6px" }}>{p.count}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Bulk Order section */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Bulk Production Order</div>
                            <select
                              value={selectedBulkOrder}
                              onChange={e => setSelectedBulkOrder(e.target.value)}
                              style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 10, border: `1px solid ${T.borderDef}`, background: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, outline: "none", cursor: "pointer" }}>
                              <option value="all">All Bulk Orders</option>
                              {bulkOrders.map(bo => (
                                <option key={bo.ref} value={bo.ref}>{bo.ref} — {bo.customer}</option>
                              ))}
                            </select>
                          </div>

                          {/* Loom Section */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Loom Number</div>
                            <select
                              value={selectedLoom}
                              onChange={e => setSelectedLoom(e.target.value)}
                              style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 10, border: `1px solid ${T.borderDef}`, background: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, outline: "none", cursor: "pointer" }}>
                              <option value="all">All Looms</option>
                              {uniqueLooms.map(l => (
                                <option key={l} value={l}>Loom {l}</option>
                              ))}
                            </select>
                          </div>

                           {/* Weaver Section */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Weaver</div>
                            <select
                              value={selectedWeaver}
                              onChange={e => setSelectedWeaver(e.target.value)}
                              style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 10, border: `1px solid ${T.borderDef}`, background: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, outline: "none", cursor: "pointer" }}>
                              <option value="all">All Weavers</option>
                              {uniqueWeavers.map(w => (
                                <option key={w} value={w}>{w}</option>
                              ))}
                            </select>
                          </div>

                          {/* Batch Number Section */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Batch Number</div>
                            <select
                              value={selectedBatch}
                              onChange={e => setSelectedBatch(e.target.value)}
                              style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 10, border: `1px solid ${T.borderDef}`, background: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, outline: "none", cursor: "pointer" }}>
                              <option value="all">All Batches</option>
                              {uniqueBatches.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>

                          {/* Clear + Done */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20, marginTop: 8 }}>
                            <button
                              onClick={() => { setFilter("all"); setSelectedBulkOrder("all"); setSelectedLoom("all"); setSelectedWeaver("all"); setSelectedBatch("all"); }}
                              style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              Reset All Filters
                            </button>
                            <button
                              onClick={() => setShowFilterPanel(false)}
                              style={{ height: 44, padding: "0 28px", background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", boxShadow: "0 4px 14px rgba(110,15,45,0.25)" }}>
                              Apply Filters
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
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

            {/* Table */}
            <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "36px 130px 90px 130px 90px 110px 220px 90px", gap: 0, padding: "11px 20px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
                <div onClick={toggleAll} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                  {allChecked ? <CheckSquare size={15} color={T.royalBurgundy} /> : <Square size={15} color={T.taupe} />}
                </div>
                {["Saree ID", "Design", "Type", "Weaver", "Date", "Status", ""].map((h, i) => (
                  <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No sarees match your filters.</div>
              ) : filtered.map((r, i) => {
                const sel = selected.has(r.id);
                const isCheckable = r.status === "Ready for Dispatch";
                return (
                  <div key={r.id}
                    style={{ display: "grid", gridTemplateColumns: "36px 130px 90px 130px 90px 110px 220px 90px", gap: 0, padding: "13px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderDef}` : "none", background: sel ? "rgba(110,15,45,0.03)" : i % 2 === 0 ? "#FFF" : T.warmIvory, alignItems: "center", cursor: isCheckable ? "pointer" : "default", transition: "background 0.12s" }}
                    onClick={() => toggleRow(r.id, isCheckable)}
                    onMouseEnter={e => { if (isCheckable && !sel) (e.currentTarget as HTMLDivElement).style.background = "rgba(110,15,45,0.02)"; }}
                    onMouseLeave={e => { if (isCheckable && !sel) (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? "#FFF" : T.warmIvory; }}
                  >
                    <div onClick={e => { e.stopPropagation(); toggleRow(r.id, isCheckable); }} style={{ display: "flex", alignItems: "center" }}>
                      {isCheckable ? (
                        sel ? <CheckSquare size={15} color={T.royalBurgundy} /> : <Square size={15} color={T.taupe} />
                      ) : (
                        <Square size={15} color={T.taupe} style={{ opacity: 0.2, cursor: "not-allowed" }} />
                      )}
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{r.id}</div>
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
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                      {r.weaverName.split(" ")[0]}
                      <div style={{ fontSize: 9.5, color: T.antiqueGold, fontWeight: 600, marginTop: 2 }}>
                        {getLoomForRecord(r.id, r.weaverName)}
                      </div>
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.date}</div>
                    <div><StatusBadge status={r.status} /></div>
                    <div onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setViewingItem(r)}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "transparent", fontFamily: F.ui, fontSize: 11, color: T.royalBurgundy, cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.06)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        <Eye size={11} /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                { label: "Pending Finishing",  val: pendingCount, total: Math.max(1, total), color: T.antiqueGold },
                { label: "Ready for Dispatch",  val: ready,        total: Math.max(1, total), color: T.green },
                { label: "Dispatched",          val: dispatched,   total: Math.max(1, total), color: T.royalBurgundy },
                { label: "Damaged / Review",    val: damaged,      total: Math.max(1, total), color: T.crimson },
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
        {modal === "wholesale" && dispatchableSelected.length > 0 && (() => {
          // Auto-detect bulk order from selected sarees
          const selectedRecords = allRecords.filter(r => dispatchableSelected.some(d => d.sareeId === r.id));
          const detectedRef = selectedRecords.find(r => r.bulkOrderRef)?.bulkOrderRef;
          const detectedOrder = detectedRef ? bulkOrders.find(o => o.ref === detectedRef) : undefined;
          // Map bulk order customerId to WHOLESALE_CUSTOMERS
          const detectedCustomerId = detectedOrder?.customerId
            ? WHOLESALE_CUSTOMERS.find(c => c.id === detectedOrder.customerId)?.id
            : undefined;
          return (
            <DispatchWholesaleModal
              key="wholesale-modal"
              sarees={dispatchableSelected}
              initialBulkOrderRef={detectedRef}
              initialCustomerId={detectedCustomerId}
              onConfirm={handleWholesaleConfirm}
              onClose={() => setModal(null)}
            />
          );
        })()}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
      <AnimatePresence>
        {viewingItem && (
          <InventoryDetailModal
            item={viewingItem}
            dispatches={dispatches}
            returns={returns}
            onClose={() => setViewingItem(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Inventory Detail Modal ────────────────────────────────────────────────────
const INV_EASE = [0.25, 0.1, 0.25, 1] as const;
function InventoryDetailModal({
  item, dispatches, returns, onClose
}: {
  item: InventoryRecord;
  dispatches: DispatchRecord[];
  returns: FinishingReturn[];
  onClose: () => void;
}) {
  const disp = dispatches.find(d => d.sareeIds.includes(item.id));
  const ret  = returns.find(r => r.sareeId === item.id);

  const infoCell = (label: string, value: React.ReactNode) => (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{value}</div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(61,14,26,0.55)', backdropFilter: 'blur(5px)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.25, ease: INV_EASE }}
        style={{ position: 'relative', width: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: '#FFFDF9', borderRadius: 20, boxShadow: '0 32px 80px rgba(61,14,26,0.28)', overflow: 'hidden', border: `1px solid ${T.borderDef}` }}
      >
        {/* Header */}
        <div style={{ background: T.deepWine, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={18} color={T.antiqueGold} />
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: '#FFF' }}>Saree Record</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={15} color="#FFF" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ID Card */}
          <div style={{ textAlign: 'center' as const, padding: '16px 20px', background: 'rgba(110,15,45,0.04)', borderRadius: 14, border: `1px solid rgba(110,15,45,0.08)` }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, letterSpacing: '2px', textTransform: 'uppercase' as const }}>Saree Barcode ID</div>
            <div style={{ fontFamily: F.mono, fontSize: 26, fontWeight: 700, color: T.royalBurgundy, marginTop: 4, letterSpacing: '1px' }}>{item.id}</div>
            <div style={{ marginTop: 10 }}><StatusBadge status={item.status} /></div>
            {item.bulkOrderRef && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(200,155,71,0.10)', border: '1px solid rgba(200,155,71,0.25)', borderRadius: 999, padding: '3px 10px', fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: '#7A5310' }}>
                <Hash size={10} /> {item.bulkOrderRef}
              </div>
            )}
          </div>

          {/* Core info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {infoCell('Design Code', <span style={{ fontFamily: F.mono }}>{item.designCode}</span>)}
            {infoCell('Saree Type', item.sareeType)}
            {infoCell('Weaver', item.weaverName)}
            {infoCell(item.rawType === 'readySaree' ? 'QC Passed Date' : 'Received Date', <span style={{ fontFamily: F.mono }}>{item.date}</span>)}
          </div>

          {/* Dispatched */}
          {item.status === 'Dispatched' && disp && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} /> Dispatch &amp; Logistics
              </div>
              <div style={{ background: 'rgba(30,102,64,0.03)', border: '1px solid rgba(30,102,64,0.10)', borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {infoCell('Dispatch Date', <span style={{ fontFamily: F.mono }}>{disp.dispatchDate}</span>)}
                {infoCell('Type', <span style={{ textTransform: 'capitalize' as const }}>{disp.type}</span>)}
                {infoCell('LR Number', <span style={{ fontFamily: F.mono }}>{disp.lrNumber}</span>)}
                {infoCell('Transport Co.', disp.transportCompany)}
                {infoCell('Vehicle No.', <span style={{ fontFamily: F.mono }}>{disp.vehicleNumber}</span>)}
                {disp.driverName ? infoCell('Driver', disp.driverName) : <div />}
                {disp.type === 'wholesale' && disp.customerName && (
                  <div style={{ gridColumn: '1 / -1', borderTop: `1px solid ${T.borderDef}`, paddingTop: 10, marginTop: 2 }}>
                    {infoCell('Customer', <span style={{ color: T.royalBurgundy, fontWeight: 700 }}>{disp.customerName}</span>)}
                    {disp.invoiceNumber && <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 4 }}>Invoice: {disp.invoiceNumber}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Damaged */}
          {item.status === 'Damaged — Review Needed' && ret && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> Damage Report
              </div>
              <div style={{ background: 'rgba(192,57,43,0.04)', border: '1px solid rgba(192,57,43,0.12)', borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {infoCell('Damage Type', ret.damageType || 'Unspecified')}
                {infoCell('Severity', <span style={{ color: ret.damageSeverity === 'Severe' ? T.crimson : ret.damageSeverity === 'Moderate' ? '#C07A18' : T.luxuryBrown }}>{ret.damageSeverity || 'Unspecified'}</span>)}
                {infoCell('Reported By', ret.receivedBy)}
                {infoCell('Date', <span style={{ fontFamily: F.mono }}>{ret.receivedDate}</span>)}
                {ret.damageNotes && (
                  <div style={{ gridColumn: '1 / -1', borderTop: 'rgba(192,57,43,0.10) solid 1px', paddingTop: 10, marginTop: 2 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4 }}>Notes</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontStyle: 'italic' }}>“{ret.damageNotes}”</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QC Passed */}
          {item.status === 'QC Passed' && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ background: 'rgba(200,155,71,0.06)', border: '1px solid rgba(200,155,71,0.18)', borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                <Clock size={22} color="#A07020" style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: '#8B6018' }}>Awaiting Finishing Assignment</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6, lineHeight: 1.6 }}>This saree has passed QC and is in ready stock. It needs to be assigned to a finishing staff member before it can be dispatched.</div>
              </div>
            </div>
          )}

          {/* Ready for Dispatch */}
          {item.status === 'Ready for Dispatch' && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ background: 'rgba(30,102,64,0.04)', border: '1px solid rgba(30,102,64,0.12)', borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                <CheckCircle2 size={22} color={T.green} style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green }}>Ready for Dispatch</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6, lineHeight: 1.6 }}>Finishing complete. Select this saree in the inventory table and use the Dispatch buttons to send it to the shop or a wholesale customer.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.borderDef}`, background: 'rgba(110,15,45,0.02)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ height: 38, padding: '0 22px', background: T.royalBurgundy, border: 'none', borderRadius: 8, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: '#FFF', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
