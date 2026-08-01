import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
const imgInventoryHero = "https://images.unsplash.com/photo-1585914924626-15adac1e6402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import {
  Search, Scan, CheckSquare, Square, Package, Truck, ShoppingBag, Users,
  ChevronDown, ChevronUp, X, CheckCircle2, AlertTriangle, Clock, FileText,
  Upload, Eye, Send, Save, ArrowRight, Building2, Hash, Filter, Zap,
} from "lucide-react";
import { useFinishing, FinishingReturn, DispatchRecord, Quotation } from "./FinishingContext";
import { useFirms } from "./FirmsContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "./DateFilterBar";
import { useDesignLibrary } from "./DesignLibraryContext";
import { useBulkOrders } from "./BulkOrderContext";
import { useBatches } from "./BatchContext";
import { DesignCodeCard } from "./DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByCode, getSareeTypeByName } from "./RatesPricingPage";
import { WeaverSareesSection, WeaverSareeRow } from "./WeaverSareesSection";
import { MoneyAccessProvider } from "./MoneyAccess";

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
  prices: Record<string, string>; applyGst: boolean; gstPct: string;
  firmId: string; paymentDueDate: string; invoiceNotes: string;
}

function InvoiceGenerator({
  sarees, customer, transport, data, onChange, onSend, onDraft, onCancel, bulkOrderRef,
  mode = "invoice", embedded = false,
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
  mode?: "invoice" | "quotation";
  embedded?: boolean;
}) {
  const isQuotation = mode === "quotation";
  const docLabel = isQuotation ? "Quotation" : "Invoice";
  const { firms } = useFirms();
  const { bulkOrders } = useBulkOrders();
  const { batches } = useBatches();
  const linkedOrder = bulkOrders.find(o => o.ref === bulkOrderRef);
  const set = (k: keyof InvoiceData) => (v: string | boolean | Record<string, string>) => onChange({ ...data, [k]: v });
  const setPrice = (sId: string, p: string) => onChange({ ...data, prices: { ...data.prices, [sId]: p } });

  const qty          = sarees.length;
  const subtotal     = sarees.reduce((sum, s) => sum + (parseFloat(data.prices[s.sareeId || s.id]) || 0), 0);
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
          <Field label={`${docLabel} Number`} req>
            <TextInput value={data.invoiceNumber} onChange={set("invoiceNumber") as (v: string) => void} placeholder={isQuotation ? "QT-2026-001" : "INV-2026-001"} mono />
          </Field>
          <Field label={`${docLabel} Date`} req>
            <input type="date" value={data.invoiceDate} onChange={e => set("invoiceDate")(e.target.value)}
              style={{ ...inp, fontFamily: F.mono }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
              onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
          </Field>

          <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Enter Price per Saree *</div>
            <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", background: "#FFF" }}>
              {sarees.map((s, i) => {
                const sId = s.sareeId || s.id;
                const sareeBatch = batches.find(b => b.rows.some(row => row.sareeId === sId))?.batchId;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < sarees.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.silkCream }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{sId}</div>
                        {sareeBatch && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{sareeBatch}</div>}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{s.designCode} · {s.sareeType}</div>
                    </div>
                    <div style={{ position: "relative", width: 120 }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, color: T.taupe, fontSize: 13 }}>₹</span>
                      <input type="number" value={data.prices[sId] || ""} onChange={e => setPrice(sId, e.target.value)} placeholder="0" style={{ ...inp, paddingLeft: 22, fontFamily: F.mono, fontSize: 14 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
            <Field label={`${docLabel} raised by (Firm)`} req>
              <SelectInput value={data.firmId} onChange={set("firmId") as (v: string) => void}>
                <option value="">Select firm…</option>
                {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
              </SelectInput>
            </Field>
          </div>

          {!isQuotation && (
          <Field label="Payment Due Date">
            <input type="date" value={data.paymentDueDate} onChange={e => set("paymentDueDate")(e.target.value)}
              style={{ ...inp, fontFamily: F.mono }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
              onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }} />
          </Field>
          )}

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Additional Notes">
              <textarea value={data.invoiceNotes} onChange={e => set("invoiceNotes")(e.target.value)} rows={2}
                placeholder={`Any notes for this ${docLabel.toLowerCase()}…`}
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
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.royalBurgundy }}>{isQuotation ? "QUOTATION" : "TAX INVOICE"}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{data.invoiceNumber || (isQuotation ? "QT-XXXX" : "INV-XXXX")}</div>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "6px 0", borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 4 }}>
              {["Item", "Amount (₹)"].map((h, i) => (
                <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i > 0 ? "right" as const : "left" as const }}>{h}</div>
              ))}
            </div>
            {sarees.slice(0, 4).map((s, i) => {
              const sId = s.sareeId || s.id;
              const sareeBatch = batches.find(b => b.rows.some(row => row.sareeId === sId))?.batchId;
              const p = parseFloat(data.prices[sId]) || 0;
              return (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px", padding: "5px 0", borderBottom: i < Math.min(sarees.length, 4) - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, fontWeight: 600 }}>{sId}</span>
                      {sareeBatch && (
                        <span style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{sareeBatch}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe }}>{s.designCode} · {s.sareeType}</div>
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const }}>₹{p ? p.toLocaleString("en-IN") : "—"}</div>
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
          {!isQuotation && (
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
          )}
        </div>
      </div>

      {/* Action buttons — full width below both columns */}
      {!embedded && (
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        <button onClick={onSend} style={{ flex: 1, height: 50, background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(110,15,45,0.25)" }}>
          <Send size={16} /> {isQuotation ? "Send Quotation to Customer" : "Send Invoice to Customer"}
        </button>
        <button onClick={onDraft} style={{ height: 50, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <Save size={15} /> Save as Draft
        </button>
        <button onClick={onCancel} style={{ height: 50, padding: "0 20px", background: "transparent", border: `1px solid rgba(139,112,96,0.20)`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
      )}
    </div>
  );
}

// ── Row → dispatch-saree mapper ───────────────────────────────────────────────
// One definition shared by the page and the in-modal picker so a saree looks the
// same however it was added.
function rowToDispatchSaree(r: WeaverSareeRow): FinishingReturn {
  return {
    id: r.sareeId,
    assignmentId: "DIRECT-DISPATCH",
    sareeId: r.sareeId,
    designCode: r.designCode || "",
    sareeTypeCode: r.sareeTypeCode,
    sareeType: r.sareeTypeName || r.sareeTypeCode || "—",
    weaverName: r.ownerLabel || "—",
    condition: "perfect",
    receivedBy: "Admin",
    receivedDate: r.finishingCompletedDate || r.qcDate || r.assignedDate || "",
    inventoryStatus: "Ready for Dispatch",
  };
}

// ── Saree picker (scan + pick from inventory) ─────────────────────────────────
// "Select from Inventory" embeds the very same inventory table the page shows —
// identical columns, tabs and filters — so nothing has to be learned twice.
function SareePicker({ available, picked, onChange, label, onBrowseChange }: {
  available: FinishingReturn[];
  picked: FinishingReturn[];
  onChange: (next: FinishingReturn[]) => void;
  label: string;
  onBrowseChange?: (open: boolean) => void;
}) {
  const [browse, setBrowse] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [rows, setRows] = useState<WeaverSareeRow[]>([]);

  const pickedIds = useMemo(() => new Set(picked.map(s => s.sareeId || s.id)), [picked]);
  // Before the table has been opened it has reported no rows, so the page's
  // pool stands in for scanning.
  const pool = rows.length ? rows.map(rowToDispatchSaree) : available;
  const unpicked = pool.filter(s => !pickedIds.has(s.sareeId || s.id));

  const toggleBrowse = () => setBrowse(b => { onBrowseChange?.(!b); return !b; });

  const toggleRow = useCallback((sareeId: string) => {
    if (pickedIds.has(sareeId)) { onChange(picked.filter(s => (s.sareeId || s.id) !== sareeId)); return; }
    const row = rows.find(r => r.sareeId === sareeId);
    const found = row ? rowToDispatchSaree(row) : available.find(s => (s.sareeId || s.id) === sareeId);
    if (found) onChange([...picked, found]);
  }, [pickedIds, picked, rows, available, onChange]);

  const toggleAll = useCallback((ids: string[]) => {
    const allOn = ids.length > 0 && ids.every(id => pickedIds.has(id));
    if (allOn) { onChange(picked.filter(s => !ids.includes(s.sareeId || s.id))); return; }
    const additions = ids
      .filter(id => !pickedIds.has(id))
      .map(id => {
        const row = rows.find(r => r.sareeId === id);
        return row ? rowToDispatchSaree(row) : available.find(s => (s.sareeId || s.id) === id);
      })
      .filter(Boolean) as FinishingReturn[];
    onChange([...picked, ...additions]);
  }, [pickedIds, picked, rows, available, onChange]);

  // Mirrors the page's barcode simulation — grabs the next unpicked saree.
  const scan = () => {
    if (!unpicked.length) { setScanMsg("No more sarees available to scan."); setTimeout(() => setScanMsg(""), 2200); return; }
    setScanMsg("Scanning…");
    setTimeout(() => {
      const s = unpicked[Math.floor(Math.random() * unpicked.length)];
      onChange([...picked, s]);
      setScanMsg(`Scanned: ${s.sareeId || s.id}`);
      setTimeout(() => setScanMsg(""), 1800);
    }, 450);
  };

  return (
    <div style={{ border: `1.5px solid ${T.borderGold}`, background: "rgba(200,155,71,0.05)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.05em", flex: 1 }}>
          {label} <span style={{ color: T.royalBurgundy }}>({picked.length})</span>
        </span>
        <button onClick={scan}
          style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: "#FFF", cursor: "pointer" }}>
          <Scan size={15} /> Scan Saree
        </button>
        <button onClick={toggleBrowse}
          style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", background: browse ? T.royalBurgundy : "#FFF", border: `1.5px solid ${browse ? T.royalBurgundy : T.borderMed}`, borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: browse ? "#FFF" : T.royalBurgundy, cursor: "pointer" }}>
          <Package size={15} /> Select from Inventory {browse ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      {scanMsg && (
        <div style={{ marginTop: 10, fontFamily: F.mono, fontSize: 12, color: T.green, background: T.greenBg, borderRadius: 8, padding: "7px 12px", display: "inline-block" }}>{scanMsg}</div>
      )}

      {/* The page's own inventory table, with its tabs and filters intact */}
      {browse && (
        <div style={{ marginTop: 12, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 16, maxHeight: 460, overflowY: "auto" }}>
          <WeaverSareesSection
            ownerType="all"
            selectable
            selectedIds={pickedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onVisibleChange={setRows}
          />
        </div>
      )}

      {/* Picked chips */}
      {picked.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 12 }}>
          {picked.map(s => {
            const sId = s.sareeId || s.id;
            return (
              <span key={sId} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFF", border: `1px solid ${T.borderMed}`, borderRadius: 999, padding: "5px 8px 5px 12px", fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>
                {sId}
                <button onClick={() => remove(sId)} title="Remove"
                  style={{ background: "rgba(192,57,43,0.10)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <X size={11} color={T.crimson} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Saree review list (shared by the quotation / invoice review steps) ────────
function SareeReviewList({ sarees, prices, applyGst, gstPct, docLabel }: {
  sarees: FinishingReturn[];
  prices: Record<string, string>;
  applyGst: boolean;
  gstPct: string;
  docLabel: string;
}) {
  const { batches } = useBatches();
  const subtotal = sarees.reduce((sum, s) => sum + (parseFloat(prices[s.sareeId || s.id]) || 0), 0);
  const gstAmount = applyGst ? subtotal * (parseFloat(gstPct) || 0) / 100 : 0;

  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>
        {sarees.length} saree{sarees.length === 1 ? "" : "s"} on this {docLabel.toLowerCase()}, with the amounts entered.
      </div>
      <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", padding: "10px 16px", background: T.silkCream, borderBottom: `1px solid ${T.borderDef}` }}>
          {["Saree", "Amount (₹)"].map((h, i) => (
            <div key={h} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i ? "right" as const : "left" as const }}>{h}</div>
          ))}
        </div>
        {sarees.map((s, i) => {
          const sId = s.sareeId || s.id;
          const bId = batches.find(b => b.rows.some(r => r.sareeId === sId))?.batchId;
          const p = parseFloat(prices[sId]) || 0;
          return (
            <div key={sId} style={{ display: "grid", gridTemplateColumns: "1fr 130px", alignItems: "center", padding: "12px 16px", borderBottom: i < sarees.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.45)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <Package size={15} color={T.taupe} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" as const }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.royalBurgundy }}>{sId}</span>
                    {bId && <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{bId}</span>}
                    <StatusBadge status={s.inventoryStatus} />
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 3 }}>
                    {s.sareeTypeCode || s.designCode} · {s.sareeType} · Weaver: {s.weaverName}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: p ? T.luxuryBrown : T.crimson, textAlign: "right" as const }}>
                {p ? `₹${p.toLocaleString("en-IN")}` : "not priced"}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Subtotal ({sarees.length} sarees)</span>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        {applyGst && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>GST ({gstPct}%)</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>₹{gstAmount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.borderGold}`, paddingTop: 8, marginTop: 2 }}>
          <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
          <span style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 700, color: T.royalBurgundy }}>₹{(subtotal + gstAmount).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}

// Shown inside any dispatch flow opened before sarees were picked. The flow
// stays browsable; only the committing actions are held back.
function NoSareesNotice({ what }: { what: string }) {
  return (
    <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid rgba(200,155,71,0.35)`, borderRadius: 14, padding: "22px 24px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <Package size={22} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 5 }}>No sarees selected yet</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
          Close this and tick the sarees you want to {what} in the inventory table — or use <strong style={{ color: T.luxuryBrown }}>Scan</strong> to pick one. You can look through the steps here in the meantime.
        </div>
      </div>
    </div>
  );
}

// ── Dispatch to Shop modal ────────────────────────────────────────────────────
function DispatchShopModal({ sarees, available, onConfirm, onClose }: {
  sarees: FinishingReturn[];
  available: FinishingReturn[];
  onConfirm: (transport: TransportData, opts: { skipped?: boolean; picked: FinishingReturn[] }) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<FinishingReturn[]>(sarees);
  const [browsing, setBrowsing] = useState(false);
  const [transport, setTransport] = useState<TransportData>({ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: today, notes: "" });

  const canNext2 = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;
  // Nothing can be dispatched until at least one saree is on the docket.
  const noSarees = picked.length === 0;

  const STEPS = ["Sarees", "Transport & LR", "Upload Receipt", "Confirm"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: step === 1 && browsing ? 1180 : 620, maxWidth: "96vw", maxHeight: "88vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden", transition: "width 0.3s ease" }}>

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
              <SareePicker
                available={available}
                picked={picked}
                onChange={setPicked}
                onBrowseChange={setBrowsing}
                label="Sarees going to the shop"
              />
              {noSarees ? (
                <NoSareesNotice what="send to the shop" />
              ) : (
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>{picked.length} saree{picked.length > 1 ? "s" : ""} selected for dispatch to shop.</div>
                  <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
                    {picked.map((s, i) => (
                      <div key={s.sareeId || s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderBottom: i < picked.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.silkCream }}>
                        <Package size={15} color={T.taupe} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{s.sareeId}</div>
                          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{s.sareeTypeCode || s.designCode} · {s.sareeType} · {s.weaverName}</div>
                        </div>
                        <StatusBadge status={s.inventoryStatus} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  ["Sarees",    picked.map(s => s.sareeId).join(", ")],
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
          {step < 4 && (
            <button onClick={() => onConfirm(transport, { skipped: true, picked })} disabled={noSarees}
              title={noSarees ? "Select at least one saree first" : "Dispatch now — fill remaining details later from Dispatch History"}
              style={{ height: 46, padding: "0 18px", background: "transparent", border: `1.5px solid ${noSarees ? T.borderMed : T.antiqueGold}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: noSarees ? T.taupe : "#8B6018", cursor: noSarees ? "not-allowed" : "pointer", opacity: noSarees ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" as const }}>
              <Zap size={14} /> Dispatch Now
            </button>
          )}
          {step < 4 ? (() => {
            const blocked = noSarees || (step === 2 && !canNext2);
            return (
              <button onClick={() => setStep(s => s + 1)} disabled={blocked}
                title={noSarees ? "Select at least one saree first" : undefined}
                style={{ flex: 1, height: 46, background: blocked ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: blocked ? T.taupe : "#FFF", cursor: blocked ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                Continue <ArrowRight size={15} />
              </button>
            );
          })() : (
            <button onClick={() => onConfirm(transport, { picked })} disabled={noSarees}
              style={{ flex: 1, height: 46, background: noSarees ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.green} 0%, #145230 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: noSarees ? T.taupe : "#FFF", cursor: noSarees ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: noSarees ? "none" : "0 4px 20px rgba(30,102,64,0.25)" }}>
              <CheckCircle2 size={16} /> Confirm Shop Dispatch
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Dispatch to Wholesale modal ───────────────────────────────────────────────
// Customer → Quotation (optional) → Tax Invoice → Sarees → Transport → Receipt.
// Picking a previously raised quotation pre-fills the invoice; everything stays
// editable. Skipping it goes straight to a fresh invoice where sarees are added
// by scan or from inventory.
function DispatchWholesaleModal({ sarees, available, onConfirm, onClose, initialBulkOrderRef, initialCustomerId }: {
  sarees: FinishingReturn[];
  available: FinishingReturn[];
  onConfirm: (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef: string | undefined, opts: { skipped?: boolean; picked: FinishingReturn[]; quotationRef?: string }) => void;
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
  const { batches } = useBatches();
  const { quotations } = useFinishing();
  const [picked, setPicked] = useState<FinishingReturn[]>(sarees);
  const [browsing, setBrowsing] = useState(false);
  const [quotationId, setQuotationId] = useState<string>("");
  const [transport, setTransport] = useState<TransportData>({ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: today, notes: "", expectedDelivery: "", specialInstructions: "" });
  const [inv, setInv] = useState<InvoiceData>({ invoiceNumber: `INV-2026-${String(Date.now()).slice(-3)}`, invoiceDate: today, prices: {}, applyGst: false, gstPct: "18", firmId: "", paymentDueDate: "", invoiceNotes: "" });

  const filteredCustomers = WHOLESALE_CUSTOMERS.filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.city.toLowerCase().includes(customerSearch.toLowerCase()));
  const selectedCustomer  = WHOLESALE_CUSTOMERS.find(c => c.id === customerId) ?? null;

  // Quotations already raised for this customer and not yet dispatched.
  const customerQuotations = useMemo(
    () => quotations.filter(q => q.customerId === customerId && q.status !== "dispatched"),
    [quotations, customerId]
  );
  const chosenQuotation = customerQuotations.find(q => q.id === quotationId) ?? null;

  // Pull a quotation's sarees, prices, GST and firm into the invoice. Everything
  // stays editable afterwards.
  const applyQuotation = (qId: string) => {
    const q = customerQuotations.find(x => x.id === qId);
    setQuotationId(qId);
    if (!q) return;
    setPicked(q.sarees.map(s => ({
      id: s.sareeId,
      assignmentId: `QT:${q.quotationNumber}`,
      sareeId: s.sareeId,
      designCode: s.designCode,
      sareeTypeCode: s.sareeTypeCode,
      sareeType: s.sareeType,
      weaverName: s.weaverName,
      condition: "perfect" as const,
      receivedBy: "Admin",
      receivedDate: q.quotationDate,
      inventoryStatus: "Ready for Dispatch" as const,
      quotationRef: q.quotationNumber,
    })));
    setInv(prev => ({
      ...prev,
      prices: { ...q.prices },
      applyGst: q.applyGst,
      gstPct: q.gstPct,
      firmId: q.firmId || prev.firmId,
      invoiceNotes: q.notes || prev.invoiceNotes,
    }));
    if (q.bulkOrderRef) setBulkOrderRef(q.bulkOrderRef);
  };

  const clearQuotation = () => { setQuotationId(""); setPicked(sarees); };

  const canNext1 = !!customerId;
  const noSarees = picked.length === 0;
  // Every picked saree must carry a price — an empty map would pass a length
  // check on its own, so the count is guarded explicitly.
  const pricesComplete = picked.every(s => parseFloat(inv.prices[s.sareeId || s.id]) > 0);
  const canInvoice = !noSarees && !!inv.invoiceNumber.trim() && !!inv.firmId && pricesComplete;
  const canTransport = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;

  const STEPS = ["Customer", "Quotation", "Tax Invoice", "Sarees", "Transport & LR", "Upload Receipt"];
  const QUOTATION_STEP = 2;
  const INVOICE_STEP = 3;
  const REVIEW_STEP = 4;
  const TRANSPORT_STEP = 5;
  const nextDisabled = (step === 1 && !canNext1) || (step === INVOICE_STEP && !canInvoice) || (step === REVIEW_STEP && noSarees) || (step === TRANSPORT_STEP && !canTransport);
  const confirmOpts = { picked, quotationRef: chosenQuotation?.quotationNumber };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: step === INVOICE_STEP ? (browsing ? 1240 : 1100) : 680, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden", transition: "width 0.3s ease" }}>

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

          {/* Step 2 — Previously raised quotations (optional) */}
          {step === QUOTATION_STEP && (
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>
                Pick a quotation already raised for {selectedCustomer?.name} to carry its sarees and prices into the invoice — or continue without one and build the invoice from scratch.
              </div>

              {customerQuotations.length === 0 ? (
                <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" as const }}>
                  <FileText size={26} color={T.taupe} style={{ marginBottom: 10 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>No open quotations for this customer</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 5 }}>Continue to the tax invoice and add sarees there.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {customerQuotations.map(q => {
                    const on = quotationId === q.id;
                    return (
                      <button key={q.id} onClick={() => (on ? clearQuotation() : applyQuotation(q.id))}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1.5px solid ${on ? T.royalBurgundy : T.borderDef}`, borderRadius: 12, background: on ? "rgba(110,15,45,0.04)" : "#FFF", cursor: "pointer", textAlign: "left" as const }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: on ? "rgba(110,15,45,0.12)" : T.silkCream, border: `1.5px solid ${on ? T.royalBurgundy : T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={16} color={on ? T.royalBurgundy : T.taupe} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{q.quotationNumber}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, textTransform: "capitalize" as const, color: q.status === "received" ? T.green : "#8B6018", background: q.status === "received" ? T.greenBg : "rgba(200,155,71,0.14)", borderRadius: 20, padding: "2px 9px" }}>{q.status.replace(/-/g, " ")}</span>
                            {q.bulkOrderRef && <span style={{ fontFamily: F.mono, fontSize: 10, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 6px", borderRadius: 4 }}>{q.bulkOrderRef}</span>}
                          </div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                            {q.quotationDate} · {q.sarees.length} saree{q.sarees.length === 1 ? "" : "s"} · {q.firmName || "—"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                          <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>₹{q.grandTotal.toLocaleString("en-IN")}</div>
                          {on && <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.royalBurgundy, fontWeight: 700, marginTop: 3 }}>Tap to unlink</div>}
                        </div>
                        {on && <CheckCircle2 size={18} color={T.royalBurgundy} style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {chosenQuotation && (
                <div style={{ marginTop: 16, background: T.greenBg, border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <CheckCircle2 size={17} color={T.green} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.6 }}>
                    <strong>{chosenQuotation.quotationNumber}</strong> loaded — {chosenQuotation.sarees.length} saree{chosenQuotation.sarees.length === 1 ? "" : "s"} and their prices are carried into the tax invoice. You can add, remove or reprice anything on the next step.
                  </div>
                </div>
              )}

              {!chosenQuotation && customerQuotations.length > 0 && (
                <button onClick={() => setStep(INVOICE_STEP)}
                  style={{ marginTop: 16, width: "100%", height: 44, background: "transparent", border: `1.5px dashed ${T.borderMed}`, borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                  Skip — raise a tax invoice without a quotation
                </button>
              )}
            </div>
          )}

          {/* Step 3 — Tax Invoice (sarees are added here) */}
          {step === INVOICE_STEP && (
            <div>
              {chosenQuotation && (
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(110,15,45,0.04)", border: `1.5px solid rgba(110,15,45,0.14)`, borderRadius: 10 }}>
                  <FileText size={15} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
                    Prefilled from quotation <strong style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{chosenQuotation.quotationNumber}</strong> — edit freely.
                  </span>
                </div>
              )}
              <SareePicker
                available={available}
                picked={picked}
                onChange={setPicked}
                onBrowseChange={setBrowsing}
                label="Sarees on this invoice"
              />
              {noSarees ? (
                <NoSareesNotice what="send to wholesale" />
              ) : (
                <InvoiceGenerator
                  sarees={picked}
                  customer={selectedCustomer}
                  transport={transport}
                  data={inv}
                  onChange={setInv}
                  bulkOrderRef={bulkOrderRef || undefined}
                  embedded
                  onSend={() => {}}
                  onDraft={() => {}}
                  onCancel={onClose}
                />
              )}
            </div>
          )}

          {/* Step 4 — Sarees review */}
          {step === REVIEW_STEP && (
            <div>
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
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 12 }}>
                Invoice <strong style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{inv.invoiceNumber}</strong> for {selectedCustomer?.name}
                {chosenQuotation && <> · from quotation <strong style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{chosenQuotation.quotationNumber}</strong></>}
              </div>
              <SareeReviewList
                sarees={picked}
                prices={inv.prices}
                applyGst={inv.applyGst}
                gstPct={inv.gstPct}
                docLabel="Invoice"
              />
            </div>
          )}

          {step === TRANSPORT_STEP && <TransportForm data={transport} onChange={setTransport} wholesale />}

          {step === STEPS.length && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Upload the LR receipt document for this wholesale dispatch. You can skip this and upload later from Dispatch Records.</div>
              <div style={{ border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 14, padding: "40px 24px", textAlign: "center" as const, cursor: "pointer", background: T.silkCream }}>
                <Upload size={32} color={T.taupe} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Click to upload LR receipt</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>JPG, PNG or PDF — max 10 MB</div>
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
          {(step === INVOICE_STEP || step === REVIEW_STEP) && (
            <button onClick={() => onConfirm(transport, inv, customerId, bulkOrderRef || undefined, { ...confirmOpts, skipped: true })} disabled={!canInvoice}
              title={canInvoice ? "Dispatch now — fill transport & receipt later from Dispatch History" : "Add sarees and prices first"}
              style={{ height: 46, padding: "0 18px", background: "transparent", border: `1.5px solid ${!canInvoice ? T.borderMed : T.antiqueGold}`, borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: !canInvoice ? T.taupe : "#8B6018", cursor: !canInvoice ? "not-allowed" : "pointer", opacity: !canInvoice ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" as const }}>
              <Zap size={14} /> Dispatch Now
            </button>
          )}
          {step < STEPS.length ? (
            <button onClick={() => setStep(s => s + 1)} disabled={nextDisabled}
              style={{ flex: 1, height: 46, background: nextDisabled ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: nextDisabled ? T.taupe : "#FFF", cursor: nextDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={() => onConfirm(transport, inv, customerId, bulkOrderRef || undefined, confirmOpts)} disabled={!canInvoice}
              style={{ flex: 1, height: 46, background: !canInvoice ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: !canInvoice ? T.taupe : "#FFF", cursor: !canInvoice ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: !canInvoice ? "none" : "0 4px 20px rgba(110,15,45,0.25)" }}>
              <Truck size={16} /> Confirm &amp; Dispatch
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}



// ── Raise Quotation modal (Customer → Quotation → Sarees) ─────────────────────
// Sarees are added inside the Quotation step — by scan or from inventory — so
// the flow works whether or not anything was ticked on the page first.
function RaiseQuotationModal({ sarees, available, onConfirm, onClose, initialBulkOrderRef, initialCustomerId }: {
  sarees: FinishingReturn[];
  available: FinishingReturn[];
  onConfirm: (inv: InvoiceData, customerId: string, bulkOrderRef: string | undefined, picked: FinishingReturn[]) => void;
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
  const [picked, setPicked] = useState<FinishingReturn[]>(sarees);
  const [browsing, setBrowsing] = useState(false);
  const [inv, setInv] = useState<InvoiceData>({ invoiceNumber: `QT-2026-${String(Date.now()).slice(-3)}`, invoiceDate: today, prices: {}, applyGst: false, gstPct: "5", firmId: "", paymentDueDate: "", invoiceNotes: "" });

  const filteredCustomers = WHOLESALE_CUSTOMERS.filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.city.toLowerCase().includes(customerSearch.toLowerCase()));
  const selectedCustomer  = WHOLESALE_CUSTOMERS.find(c => c.id === customerId) ?? null;

  const canNext1 = !!customerId;
  const noSarees = picked.length === 0;
  // Every picked saree must carry a price — an empty map would pass the length
  // check on its own, so the count is guarded explicitly.
  const pricesComplete = picked.every(s => parseFloat(inv.prices[s.sareeId || s.id]) > 0);
  const canQuote = !noSarees && !!inv.invoiceNumber.trim() && !!inv.firmId && pricesComplete;

  const STEPS = ["Customer", "Quotation", "Sarees"];
  const QUOTE_STEP = 2;
  const nextDisabled = (step === 1 && !canNext1) || (step === QUOTE_STEP && !canQuote);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: step === QUOTE_STEP ? (browsing ? 1240 : 1100) : 680, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden", transition: "width 0.3s ease" }}>

        {/* Header */}
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={20} color={T.antiqueGold} />
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Raise Quotation</span>
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
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>Select the customer for this quotation.</div>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Search size={14} color={T.taupe} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers…" style={{ ...inp, paddingLeft: 36 }} />
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
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Link to Bulk Order <span style={{ fontWeight: 400, textTransform: "none" as const }}>(optional)</span></div>
                <div style={{ position: "relative" }}>
                  <select value={bulkOrderRef} onChange={e => setBulkOrderRef(e.target.value)} style={{ ...inp, appearance: "none", cursor: "pointer", paddingRight: 32 }}>
                    <option value="">— Not linked to a bulk order —</option>
                    {bulkOrders.map(o => (<option key={o.ref} value={o.ref}>{o.ref} · {o.customer} · {o.total} sarees · Due {o.due}</option>))}
                  </select>
                  <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Quotation (sarees are added here) */}
          {step === QUOTE_STEP && (
            <div>
              <SareePicker
                available={available}
                picked={picked}
                onChange={setPicked}
                onBrowseChange={setBrowsing}
                label="Sarees on this quotation"
              />
              {noSarees ? (
                <NoSareesNotice what="quote for" />
              ) : (
                <InvoiceGenerator
                  sarees={picked}
                  customer={selectedCustomer}
                  transport={{ lrNumber: "", transportCompany: "", vehicleNumber: "", driverName: "", dispatchDate: "", notes: "" }}
                  data={inv}
                  onChange={setInv}
                  bulkOrderRef={bulkOrderRef || undefined}
                  mode="quotation"
                  embedded
                  onSend={() => {}}
                  onDraft={() => {}}
                  onCancel={onClose}
                />
              )}
            </div>
          )}

          {/* Step 3 — Sarees review */}
          {step === 3 && (
            <SareeReviewList
              sarees={picked}
              prices={inv.prices}
              applyGst={inv.applyGst}
              gstPct={inv.gstPct}
              docLabel="Quotation"
            />
          )}
        </div>

        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ height: 46, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
              Back
            </button>
          )}
          {step < STEPS.length ? (
            <button onClick={() => setStep(s => s + 1)} disabled={nextDisabled}
              style={{ flex: 1, height: 46, background: nextDisabled ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: nextDisabled ? T.taupe : "#FFF", cursor: nextDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={() => onConfirm(inv, customerId, bulkOrderRef || undefined, picked)} disabled={!canQuote}
              style={{ flex: 1, height: 46, background: !canQuote ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: !canQuote ? T.taupe : "#FFF", cursor: !canQuote ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(110,15,45,0.25)" }}>
              <Send size={16} /> Raise Quotation
            </button>
          )}
        </div>
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

// ── Resume (complete pending) dispatch modal ──────────────────────────────────
// Exported so the Worker Staff portal can complete dispatch details with the
// exact same form, rather than a copy that would drift.
export function ResumeDispatchModal({ record, onSave, onClose }: {
  record: DispatchRecord;
  onSave: (patch: Partial<DispatchRecord>) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [transport, setTransport] = useState<TransportData>({
    lrNumber: record.lrNumber || "", transportCompany: record.transportCompany || "", vehicleNumber: record.vehicleNumber || "",
    driverName: record.driverName || "", dispatchDate: record.dispatchDate || today, notes: record.notes || "",
    expectedDelivery: record.expectedDelivery || "", specialInstructions: record.specialInstructions || "",
  });

  const canSave = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.50)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", background: "#FFFDF9", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.22)", overflow: "hidden" }}>
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Truck size={20} color={T.antiqueGold} />
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Complete Dispatch Details</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={15} color="#FFF" /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>
            {record.type === "wholesale" ? `Wholesale dispatch to ${record.customerName ?? "customer"}` : "Shop dispatch"} · {record.sareeIds.length} saree{record.sareeIds.length > 1 ? "s" : ""} · Invoice {record.invoiceNumber || "—"}
          </div>
          <TransportForm data={transport} onChange={setTransport} wholesale={record.type === "wholesale"} />
          {record.pendingReceipt && (
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Upload Receipt</div>
              <div style={{ border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 14, padding: "28px 24px", textAlign: "center" as const, cursor: "pointer", background: T.silkCream }}>
                <Upload size={28} color={T.taupe} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>Click to upload LR receipt</div>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>JPG, PNG or PDF — max 10 MB</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ height: 46, padding: "0 24px", background: "transparent", border: `1px solid ${T.borderMed}`, borderRadius: 999, fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => onSave({ ...transport, pendingTransport: false, pendingReceipt: false })} disabled={!canSave}
            style={{ flex: 1, height: 46, background: !canSave ? "rgba(139,112,96,0.15)" : `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 999, fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: !canSave ? T.taupe : "#FFF", cursor: !canSave ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CheckCircle2 size={16} /> Save Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Dispatch History section ──────────────────────────────────────────────────
// Exported for the Worker Staff portal — same component, same markup, so the two
// screens cannot fall out of step.
export function DispatchHistorySection({ dispatches, firms, onResume }: { dispatches: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void }) {
  const [tab, setTab] = useState<"all" | "shop" | "wholesale">("all");
  const rows = useMemo(() =>
    [...dispatches]
      .filter(d => tab === "all" || d.type === tab)
      .sort((a, b) => (b.id > a.id ? 1 : -1)),
  [dispatches, tab]);

  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: dispatches.length },
    { key: "shop",      label: "To Shop",   count: dispatches.filter(d => d.type === "shop").length },
    { key: "wholesale", label: "Wholesale", count: dispatches.filter(d => d.type === "wholesale").length },
  ];

  return (
    <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Truck size={18} color={T.royalBurgundy} />
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>Dispatch History</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, border: `1px solid ${tab === t.key ? T.royalBurgundy : T.borderDef}`, background: tab === t.key ? "rgba(110,15,45,0.06)" : "transparent", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: tab === t.key ? T.royalBurgundy : T.taupe, cursor: "pointer" }}>
              {t.label} <span style={{ fontFamily: F.mono, fontSize: 11 }}>({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "110px 90px 1fr 130px 100px 80px 110px 150px", gap: 0, padding: "11px 24px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
        {["Date", "Type", "Destination", "LR / Transport", "Invoice", "Sarees", "Firm", "Status"].map((h, i) => (
          <div key={i} style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No dispatches yet.</div>
      ) : rows.map((d, i) => {
        const firm = firms.find(f => f.id === d.firmId);
        const incomplete = d.pendingTransport || d.pendingReceipt;
        return (
          <div key={d.id} style={{ display: "grid", gridTemplateColumns: "110px 90px 1fr 130px 100px 80px 110px 150px", gap: 0, padding: "13px 24px", borderBottom: i < rows.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.warmIvory, alignItems: "center" }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{d.dispatchDate}</div>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: d.type === "wholesale" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.14)", color: d.type === "wholesale" ? T.royalBurgundy : "#8B6018", border: `1px solid ${d.type === "wholesale" ? "rgba(110,15,45,0.18)" : "rgba(200,155,71,0.32)"}`, borderRadius: 999, padding: "2px 9px", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, textTransform: "capitalize" as const }}>
                {d.type === "wholesale" ? <Users size={10} /> : <ShoppingBag size={10} />}{d.type}
              </span>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{d.type === "wholesale" ? (d.customerName ?? "—") : "Shop / Showroom"}</div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{d.lrNumber || "—"}</div>
              <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 1 }}>{d.transportCompany || "—"}</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: d.invoiceNumber ? T.luxuryBrown : T.taupe }}>{d.invoiceNumber || "—"}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{d.sareeIds.length}</div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{d.firmName || firm?.firmName || "—"}</div>
            <div>
              {incomplete ? (
                <button onClick={() => onResume(d)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "rgba(200,155,71,0.14)", border: `1px solid rgba(200,155,71,0.32)`, borderRadius: 999, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#8B6018", cursor: "pointer", whiteSpace: "nowrap" as const }}>
                  <Clock size={11} /> Complete Details
                </button>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.green }}>
                  <CheckCircle2 size={12} /> Complete
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Quotations section (raised from this page, dispatch once finishing is done) ─
function quotationStatusStyle(status: Quotation["status"]) {
  switch (status) {
    case "received":          return { bg: "rgba(30,102,64,0.10)",   color: T.green,       border: "rgba(30,102,64,0.22)"  };
    case "dispatched":        return { bg: "rgba(110,15,45,0.08)",   color: T.royalBurgundy, border: "rgba(110,15,45,0.18)" };
    case "partially-received": return { bg: "rgba(200,155,71,0.14)", color: "#8B6018",     border: "rgba(200,155,71,0.32)" };
    case "in-finishing":      return { bg: "rgba(200,155,71,0.10)",  color: "#8B6018",     border: "rgba(200,155,71,0.24)" };
    default:                  return { bg: "rgba(139,112,96,0.10)", color: T.taupe,       border: T.borderDef };
  }
}

function QuotationsSection({ quotations, onDispatch }: { quotations: Quotation[]; onDispatch: (q: Quotation) => void }) {
  const [tab, setTab] = useState<"active" | "all">("active");
  const rows = useMemo(() =>
    [...quotations]
      .filter(q => tab === "all" || q.status !== "dispatched")
      .sort((a, b) => b.createdAt - a.createdAt),
  [quotations, tab]);

  if (quotations.length === 0) return null;

  return (
    <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={18} color={T.royalBurgundy} />
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>Quotations</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {([["active", "Active"], ["all", "All"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${tab === key ? T.royalBurgundy : T.borderDef}`, background: tab === key ? "rgba(110,15,45,0.06)" : "transparent", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: tab === key ? T.royalBurgundy : T.taupe, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No quotations raised yet.</div>
      ) : rows.map((q, i) => {
        const st = quotationStatusStyle(q.status);
        const receivedCount = q.sarees.filter(s => s.finishingStatus === "received").length;
        const canDispatch = q.status === "received" || q.status === "partially-received";
        return (
          <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 24px", borderBottom: i < rows.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.warmIvory, flexWrap: "wrap" as const }}>
            <div style={{ minWidth: 140 }}>
              <div style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.royalBurgundy }}>{q.quotationNumber}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{q.quotationDate}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{q.customerName}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>{q.customerCity || "—"}</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, minWidth: 70 }}>{receivedCount}/{q.sarees.length}<span style={{ color: T.taupe, fontWeight: 400 }}> received</span></div>
            <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 999, padding: "3px 11px", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: st.color, textTransform: "capitalize" as const, whiteSpace: "nowrap" as const }}>
              {q.status.replace("-", " ")}
            </div>
            <button onClick={() => canDispatch && onDispatch(q)} disabled={!canDispatch}
              title={canDispatch ? "Dispatch the received sarees from this quotation" : "Waiting on finishing to complete"}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: canDispatch ? `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)` : "rgba(139,112,96,0.12)", border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 12.5, color: canDispatch ? "#FFF" : T.taupe, cursor: canDispatch ? "pointer" : "not-allowed", whiteSpace: "nowrap" as const }}>
              <Truck size={13} /> Dispatch
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export interface InventoryRecord {
  id: string; // Saree ID
  designCode: string;
  sareeType: string;
  weaverName: string;
  date: string; // qcPassDate or receivedDate
  status: "QC Passed" | "Finishing complete" | "Dispatched" | "Damaged — Review Needed";
  rawType: "readySaree" | "return";
  originalId: string; // readySaree id or return id
  bulkOrderRef?: string;
  batchId?: string;
  quotationRef?: string;
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

export const getSareeColor = (id: string): string => {
  const colors = ["Crimson Red", "Golden Yellow", "Deep Pink", "Midnight Blue", "Kora Cream", "Teal Green", "Magenta Orange", "Emerald Gold", "Royal Violet"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function InventoryPage({
  canRaiseQuotation = true, canDispatchWholesale = true, canDispatchShop = true, canSeeMoney = true,
  showQuickDispatch = true, showCategorySplit = true, showQuotationsSection = true, showDispatchHistory = true,
}: {
  canRaiseQuotation?: boolean;
  /** Wholesale dispatch always involves per-saree pricing and GST, so it's tied
   *  to money visibility rather than gated separately. */
  canDispatchWholesale?: boolean;
  canDispatchShop?: boolean;
  canSeeMoney?: boolean;
  /** Sidebar "Quick Dispatch" card — same three actions as the action bar, just
   *  a second entry point. Independent of the action bar so it can be hidden
   *  even when at least one dispatch action remains available. */
  showQuickDispatch?: boolean;
  showCategorySplit?: boolean;
  showQuotationsSection?: boolean;
  showDispatchHistory?: boolean;
} = {}) {
  const { returns, dispatches, dispatchSarees, updateDispatch, readySarees, raiseQuotation, quotations, markQuotationDispatched } = useFinishing();
  const { getDesign } = useDesignLibrary();
  const { bulkOrders, markDispatched } = useBulkOrders();
  const { batches } = useBatches();
  const { firms } = useFirms();

  // ── Clickable code modals ───────────────────────────────────────────────────
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  // ── Selection States ────────────────────────────────────────────────────────
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [mirroredRows, setMirroredRows]       = useState<WeaverSareeRow[]>([]);
  const [viewingItem, setViewingItem]         = useState<InventoryRecord | null>(null);
  const [modal,    setModal]                  = useState<"shop" | "wholesale" | "quotation" | null>(null);
  const [toast,    setToast]                  = useState("");
  const [scanMsg,  setScanMsg]                = useState("");
  const [quotationDispatch, setQuotationDispatch] = useState<Quotation | null>(null);
  const [resumeDispatch, setResumeDispatch]   = useState<DispatchRecord | null>(null);
  // Nothing to select for if every dispatch route is closed off — the action
  // bar and the table's checkboxes fold away together in that case.
  const hasAnyDispatchAction = canDispatchShop || canDispatchWholesale || canRaiseQuotation;

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
        status: r.inventoryStatus === "Ready for Dispatch" ? "Finishing complete" : (r.inventoryStatus.includes("Damaged") ? "Damaged — Review Needed" : r.inventoryStatus) as any,
        rawType: "return",
        originalId: r.id,
        bulkOrderRef: boRef,
        batchId: bId,
        quotationRef: r.quotationRef,
      });
    });

    return list;
  }, [readySarees, returns, bulkOrders, batches]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total        = allRecords.length;
  const pendingCount = allRecords.filter(r => r.status === "QC Passed").length;
  const ready        = allRecords.filter(r => r.status === "Finishing complete").length;
  const dispatched   = allRecords.filter(r => r.status === "Dispatched").length;
  const damaged      = allRecords.filter(r => r.status === "Damaged — Review Needed").length;

  // Dispatched this month
  const thisMonth  = dispatches.filter(d => {
    try { return new Date(d.dispatchDate).getMonth() === new Date().getMonth(); } catch { return true; }
  }).reduce((acc, d) => acc + d.sareeIds.length, 0);

  // ── Selection helpers — driven by the "All Sarees Inventory" table's own filters/tabs ──
  const dispatchableSelected = useMemo(() => {
    return mirroredRows.filter(r => selected.has(r.sareeId)).map(r => ({
      id: r.sareeId,
      originalId: r.sareeId,
      designCode: r.designCode || "",
      sareeType: r.sareeTypeName || r.sareeTypeCode || "—",
      weaverName: r.ownerLabel || "—",
      date: r.finishingCompletedDate || r.qcDate || r.assignedDate || "",
      status: r.finishingStatus === "completed" ? "Finishing complete" : r.qcStatus === "passed" ? "QC Passed" : "In Production",
      bulkOrderRef: undefined as string | undefined,
    }));
  }, [mirroredRows, selected]);

  // Whole inventory table as dispatch-shaped rows — the pool the modals' scan
  // and "select from inventory" controls draw from.
  const availableSarees = useMemo<FinishingReturn[]>(() => mirroredRows.map(rowToDispatchSaree), [mirroredRows]);

  const selectedSarees = useMemo(
    () => availableSarees.filter(s => selected.has(s.sareeId)),
    [availableSarees, selected]
  );

  const toggleSareeRow = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAllVisible = useCallback((ids: string[]) => {
    setSelected(prev => {
      const allSelected = ids.length > 0 && ids.every(id => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  // Simulated barcode scan
  const handleScan = useCallback(() => {
    const unselected = mirroredRows.filter(r => !selected.has(r.sareeId));
    if (!unselected.length) { setScanMsg("No more sarees to scan."); setTimeout(() => setScanMsg(""), 2000); return; }
    setScanMsg("Scanning…");
    setTimeout(() => {
      const r = unselected[Math.floor(Math.random() * unselected.length)];
      setSelected(prev => { const next = new Set(prev); next.add(r.sareeId); return next; });
      setScanMsg(`Scanned: ${r.sareeId}`);
      setTimeout(() => setScanMsg(""), 2500);
    }, 800);
  }, [mirroredRows, selected]);

  const handleShopConfirm = (transport: TransportData, opts?: { skipped?: boolean; picked?: FinishingReturn[] }) => {
    // The modal owns the list once sarees can be scanned or picked inside it.
    const sareeIds = opts?.picked?.length
      ? opts.picked.map(s => s.sareeId || s.id)
      : dispatchableSelected.map(r => r.id);
    dispatchSarees(sareeIds, {
      type: "shop", sareeIds, dispatchDate: transport.dispatchDate || new Date().toISOString().slice(0, 10),
      lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
      pendingTransport: !!opts?.skipped && !(transport.lrNumber && transport.transportCompany && transport.vehicleNumber),
      pendingReceipt: !!opts?.skipped,
    });
    setModal(null);
    setSelected(new Set());
    setToast(opts?.skipped
      ? `${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to Shop — complete remaining details from Dispatch History`
      : `${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to Shop`);
  };

  // Sarees belonging to a quotation that have come back from finishing and are ready to dispatch.
  const quotationDispatchSarees = useMemo(() => {
    if (!quotationDispatch) return [];
    return returns.filter(r => r.quotationRef === quotationDispatch.quotationNumber && r.inventoryStatus === "Ready for Dispatch");
  }, [quotationDispatch, returns]);

  const handleWholesaleConfirm = (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef?: string, opts?: { skipped?: boolean; picked?: FinishingReturn[]; quotationRef?: string }) => {
    // The modal owns the saree list now (scanned / picked / pulled from a
    // quotation), so it is the source of truth when it supplies one.
    const sareeIds = opts?.picked?.length
      ? opts.picked.map(s => s.sareeId || s.id)
      : quotationDispatch ? quotationDispatchSarees.map(r => r.sareeId) : dispatchableSelected.map(r => r.id);
    const customer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId);
    const subtotal = sareeIds.reduce((sum, id) => sum + (parseFloat(inv.prices[id]) || 0), 0);
    const gstAmount = inv.applyGst ? subtotal * (parseFloat(inv.gstPct) || 0) / 100 : 0;
    const dispatchId = dispatchSarees(sareeIds, {
      type: "wholesale", sareeIds, dispatchDate: transport.dispatchDate || new Date().toISOString().slice(0, 10),
      lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
      customerId, customerName: customer?.name, customerPhone: customer?.phone,
      expectedDelivery: transport.expectedDelivery, specialInstructions: transport.specialInstructions,
      invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate,
      pricePerSaree: sareeIds.length ? Math.round(subtotal / sareeIds.length) : 0,
      totalAmount: subtotal,
      gstPct: inv.applyGst ? parseFloat(inv.gstPct) || 0 : 0,
      grandTotal: subtotal + gstAmount,
      firmId: inv.firmId, paymentDueDate: inv.paymentDueDate, invoiceNotes: inv.invoiceNotes,
      bulkOrderRef,
      quotationRef: opts?.quotationRef ?? quotationDispatch?.quotationNumber,
      pendingTransport: !!opts?.skipped && !(transport.lrNumber && transport.transportCompany && transport.vehicleNumber),
      pendingReceipt: !!opts?.skipped,
    });
    if (bulkOrderRef) {
      markDispatched(bulkOrderRef, inv.invoiceNumber);
    }
    if (quotationDispatch) {
      markQuotationDispatched(quotationDispatch.id, dispatchId);
    }
    setModal(null);
    setQuotationDispatch(null);
    setSelected(new Set());
    setToast(opts?.skipped
      ? `Invoice raised — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}, complete transport & receipt later`
      : `Invoice sent — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}`);
  };

  const handleRaiseQuotation = (inv: InvoiceData, customerId: string, bulkOrderRef?: string, picked?: FinishingReturn[]) => {
    const customer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId);
    // The modal's own list wins — sarees may have been scanned or picked there.
    const quoteSarees = (picked?.length ? picked : selectedSarees).map(s => ({
      id: s.sareeId || s.id,
      designCode: s.designCode,
      sareeTypeCode: s.sareeTypeCode,
      sareeType: s.sareeType,
      weaverName: s.weaverName,
    }));
    const subtotal = quoteSarees.reduce((sum, r) => sum + (parseFloat(inv.prices[r.id]) || 0), 0);
    const gstAmount = inv.applyGst ? subtotal * (parseFloat(inv.gstPct) || 0) / 100 : 0;
    const firm = firms.find(f => f.id === inv.firmId);
    raiseQuotation({
      quotationNumber: inv.invoiceNumber,
      quotationDate: inv.invoiceDate,
      customerId,
      customerName: customer?.name ?? "—",
      customerCity: customer?.city,
      customerPhone: customer?.phone,
      customerAddress: customer?.address,
      customerGst: customer?.gstCode,
      bulkOrderRef,
      sarees: quoteSarees.map(r => ({
        sareeId: r.id,
        designCode: r.designCode,
        sareeTypeCode: r.sareeTypeCode,
        sareeType: r.sareeType,
        weaverName: r.weaverName,
        finishingStatus: "pending" as const,
      })),
      prices: inv.prices,
      applyGst: inv.applyGst,
      gstPct: inv.gstPct,
      firmId: inv.firmId,
      firmName: firm?.firmName,
      notes: inv.invoiceNotes,
      subtotal,
      grandTotal: subtotal + gstAmount,
      raisedBy: "Admin",
      status: "raised",
    });
    setModal(null);
    setSelected(new Set());
    setToast(`Quotation ${inv.invoiceNumber} raised for ${customer?.name} — sent to finishing`);
  };

  return (
    <MoneyAccessProvider allowed={canSeeMoney}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                {/* Scan */}
                <button onClick={handleScan}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, background: T.deepWine, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as const }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.royalBurgundy; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.deepWine; }}>
                  <Scan size={14} color="#FFF" /> Scan
                </button>
                <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
                  Scans a random unselected saree from the table below and selects it.
                </span>
              </div>

              {/* Scan feedback */}
              {scanMsg && (
                <div style={{ marginTop: 2, background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 8, padding: "7px 12px", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>
                  {scanMsg}
                </div>
              )}
            </div>

            {/* Action bar — always visible so the dispatch routes are discoverable
                before any saree is picked. The modals themselves gate on selection.
                Folds away entirely once every dispatch route is closed off. */}
            {hasAnyDispatchAction && (
              <motion.div layout transition={{ duration: 0.2, ease: EASE }}
                style={{ background: T.deepWine, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 20px rgba(61,14,26,0.20)" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.80)", flex: 1 }}>
                  {selected.size > 0 ? (
                    <>
                      <strong style={{ color: "#FFF" }}>{selected.size}</strong> selected
                      {dispatchableSelected.length !== selected.size && ` (${dispatchableSelected.length} ready for dispatch)`}
                    </>
                  ) : (
                    <>No sarees selected — <span style={{ color: "rgba(255,255,255,0.62)" }}>pick sarees from the table below, or open an action to start</span></>
                  )}
                </span>
                {canDispatchShop && (
                  <button onClick={() => setModal("shop")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: T.antiqueGold, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.deepWine, cursor: "pointer" }}>
                    <ShoppingBag size={15} /> Dispatch to Shop
                  </button>
                )}
                {canDispatchWholesale && (
                  <button onClick={() => setModal("wholesale")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: "#FFF", border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.royalBurgundy, cursor: "pointer" }}>
                    <Users size={15} /> Dispatch to Wholesale
                  </button>
                )}
                {canRaiseQuotation && (
                  <button onClick={() => setModal("quotation")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: "transparent", border: `1px solid rgba(255,255,255,0.35)`, borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: "#FFF", cursor: "pointer" }}>
                    <FileText size={15} /> Raise Quotation
                  </button>
                )}
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())} title="Clear selection"
                    style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={14} color="#FFF" />
                  </button>
                )}
              </motion.div>
            )}

            {/* All Sarees Inventory — same table used on the Production page */}
            <div style={{ ...card, borderRadius: 16, padding: 20 }}>
              <WeaverSareesSection
                ownerType="all"
                selectable={hasAnyDispatchAction}
                selectedIds={selected}
                onToggleRow={toggleSareeRow}
                onToggleAll={toggleAllVisible}
                onVisibleChange={setMirroredRows}
              />
            </div>
          </div>

          {/* ── QUICK ACTIONS SIDEBAR ───────────────────────────────────── */}
          {(showQuickDispatch || showCategorySplit) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 100 }}>
            {/* Dispatch buttons */}
            {showQuickDispatch && (
            <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 14 }}>Quick Dispatch</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {canDispatchShop && (
                  <button onClick={() => setModal("shop")}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left" as const }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ShoppingBag size={18} color="#FFF" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF" }}>Dispatch to Shop</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>
                        {selected.size > 0 ? `${selected.size} saree${selected.size > 1 ? "s" : ""} ready` : "Select sarees first"}
                      </div>
                    </div>
                  </button>
                )}
                {canDispatchWholesale && (
                  <button onClick={() => setModal("wholesale")}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, cursor: "pointer", textAlign: "left" as const, boxShadow: "0 1px 6px rgba(44,24,16,0.06)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Users size={18} color={T.royalBurgundy} />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Dispatch to Wholesale</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>With tax invoice generation</div>
                    </div>
                  </button>
                )}
                {canRaiseQuotation && (
                  <button onClick={() => setModal("quotation")}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, cursor: "pointer", textAlign: "left" as const, boxShadow: "0 1px 6px rgba(44,24,16,0.06)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={18} color={T.antiqueGold} />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Raise Quotation</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>Send to finishing before dispatch</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
            )}

            {/* Category split */}
            {showCategorySplit && (
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
            )}
          </div>
          )}
        </div>
      </div>

      {/* ── QUOTATIONS ───────────────────────────────────────────────────── */}
      {showQuotationsSection && (
        <div style={{ padding: "0 48px", marginTop: 40 }}>
          <QuotationsSection
            quotations={quotations}
            onDispatch={q => { setQuotationDispatch(q); setModal("wholesale"); }}
          />
        </div>
      )}

      {/* ── DISPATCH HISTORY ─────────────────────────────────────────────── */}
      {showDispatchHistory && (
        <div style={{ padding: "0 48px 80px", marginTop: 24 }}>
          <DispatchHistorySection dispatches={dispatches} firms={firms} onResume={setResumeDispatch} />
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === "shop" && (
          <DispatchShopModal
            key="shop-modal"
            sarees={selectedSarees}
            available={availableSarees}
            onConfirm={handleShopConfirm}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "wholesale" && canDispatchWholesale && quotationDispatch && (
          <DispatchWholesaleModal
            key="wholesale-modal-quotation"
            sarees={quotationDispatchSarees}
            available={availableSarees}
            initialCustomerId={quotationDispatch.customerId}
            initialBulkOrderRef={quotationDispatch.bulkOrderRef}
            onConfirm={handleWholesaleConfirm}
            onClose={() => { setModal(null); setQuotationDispatch(null); }}
          />
        )}
        {/* Opens with or without a prior selection — sarees can be added inside. */}
        {modal === "wholesale" && canDispatchWholesale && !quotationDispatch && (() => {
          // Auto-detect bulk order from selected sarees
          const selectedRecords = allRecords.filter(r => dispatchableSelected.some(d => d.id === r.id));
          const detectedRef = selectedRecords.find(r => r.bulkOrderRef)?.bulkOrderRef;
          const detectedOrder = detectedRef ? bulkOrders.find(o => o.ref === detectedRef) : undefined;
          // Map bulk order customerId to WHOLESALE_CUSTOMERS
          const detectedCustomerId = detectedOrder?.customerId
            ? WHOLESALE_CUSTOMERS.find(c => c.id === detectedOrder.customerId)?.id
            : undefined;
          return (
            <DispatchWholesaleModal
              key="wholesale-modal"
              sarees={selectedSarees}
              available={availableSarees}
              initialBulkOrderRef={detectedRef}
              initialCustomerId={detectedCustomerId}
              onConfirm={handleWholesaleConfirm}
              onClose={() => setModal(null)}
            />
          );
        })()}
        {modal === "quotation" && canRaiseQuotation && (() => {
          const selectedRecords = allRecords.filter(r => dispatchableSelected.some(d => d.id === r.id));
          const detectedRef = selectedRecords.find(r => r.bulkOrderRef)?.bulkOrderRef;
          const detectedOrder = detectedRef ? bulkOrders.find(o => o.ref === detectedRef) : undefined;
          const detectedCustomerId = detectedOrder?.customerId
            ? WHOLESALE_CUSTOMERS.find(c => c.id === detectedOrder.customerId)?.id
            : undefined;
          return (
            <RaiseQuotationModal
              key="quotation-modal"
              sarees={selectedSarees}
              available={availableSarees}
              initialBulkOrderRef={detectedRef}
              initialCustomerId={detectedCustomerId}
              onConfirm={handleRaiseQuotation}
              onClose={() => setModal(null)}
            />
          );
        })()}
      </AnimatePresence>
      <AnimatePresence>
        {resumeDispatch && (
          <ResumeDispatchModal
            record={resumeDispatch}
            onSave={patch => {
              updateDispatch(resumeDispatch.id, patch);
              setResumeDispatch(null);
              setToast("Dispatch details completed");
            }}
            onClose={() => setResumeDispatch(null)}
          />
        )}
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
    </MoneyAccessProvider>
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
            {item.quotationRef && (
              <div style={{ marginTop: 8, marginLeft: item.bulkOrderRef ? 6 : 0, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(110,15,45,0.06)', border: '1px solid rgba(110,15,45,0.16)', borderRadius: 999, padding: '3px 10px', fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.royalBurgundy }}>
                <FileText size={10} /> {item.quotationRef}
              </div>
            )}
          </div>

          {/* Core info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {infoCell('Saree Type', item.sareeType)}
            {infoCell('Saree Color', getSareeColor(item.id))}
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

          {/* Finishing complete */}
          {item.status === 'Finishing complete' && (
            <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 18 }}>
              <div style={{ background: 'rgba(30,102,64,0.04)', border: '1px solid rgba(30,102,64,0.12)', borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                <CheckCircle2 size={22} color={T.green} style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.green }}>Finishing Complete</div>
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
