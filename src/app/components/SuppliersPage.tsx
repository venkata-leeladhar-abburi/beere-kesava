import React, { useMemo, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Search, Plus, Eye, MapPin, Phone, Building2, Package, IndianRupee,
  AlertTriangle, CheckCircle2, ArrowLeft, FileText, TrendingUp, Star,
  X, Send, Clock, Wallet, Image as ImageIcon,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "./DateFilterBar";
import {
  useSuppliers, Supplier, Purchase, SareeTag, formatINR, parseINR, initialsOf,
  lineProfit, purchaseTotals, expandSareePieces,
} from "./SupplierContext";
import { PurchaseFormModal, FormState as PurchaseFormState, EMPTY_FORM as EMPTY_PURCHASE_FORM } from "./ExternalPurchasesPage";

const T = {
  silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B", darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314", warmCream: "#F5E8D0",
  taupe: "#8B7060", green: "#1E6640", greenBg: "rgba(30,102,64,0.09)",
  greenMid: "#2D9158", crimson: "#C0392B", crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)", borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const EASE = [0.22, 1, 0.36, 1] as const;

const STATES = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Gujarat", "Uttar Pradesh", "Maharashtra", "Kerala"];
const PAYMENT_TERMS = ["30 days", "15 days", "45 days", "60 days", "90 days", "Advance"];
const SPECIALTIES = ["Plain Silk", "Kanjivaram", "Mysore Silk", "Patola", "Banarasi", "Gadwal", "Pochampally Ikat", "Mixed"];

function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: EASE }} style={style}>
      {children}
    </motion.div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 6,
  border: `1px solid rgba(110,15,45,0.12)`, fontFamily: F.ui,
  fontSize: 14, color: T.luxuryBrown, background: "#FFF",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12, fontWeight: 600,
  color: T.luxuryBrown, display: "block", marginBottom: 6,
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:   { bg: "rgba(30,102,64,0.09)",  color: T.greenMid, label: "Active" },
    inactive: { bg: "rgba(139,112,96,0.10)", color: T.taupe,    label: "Inactive" },
    overdue:  { bg: "rgba(192,57,43,0.08)",  color: T.crimson,  label: "Overdue" },
  };
  const s = map[status] ?? map.active;
  return <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20 }}>{s.label}</span>;
}

function PayStatusPill({ status }: { status: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    Paid:    { color: T.green, bg: "rgba(30,102,64,0.09)" },
    Pending: { color: "rgba(230,126,34,1)", bg: "rgba(230,126,34,0.12)" },
    Partial: { color: T.crimson, bg: "rgba(192,57,43,0.08)" },
  };
  const s = styles[status] || { color: T.taupe, bg: T.cream };
  return <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11, color: s.color, background: s.bg, borderRadius: 999, padding: "3px 10px", display: "inline-block" }}>{status}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={i <= rating ? T.antiqueGold : "none"} color={i <= rating ? T.antiqueGold : T.taupe} />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Supplier card
// ─────────────────────────────────────────────────────────────────────────────

function SupplierCard({ supplier, onView }: { supplier: Supplier; onView: (s: Supplier) => void }) {
  const { statsFor } = useSuppliers();
  const stats = statsFor(supplier.id);
  const [hov, setHov] = useState(false);

  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(74,6,27,0.14)" }} transition={{ duration: 0.22 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "#FFF", borderRadius: 20, border: `1.5px solid ${hov ? "rgba(110,15,45,0.22)" : T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 12px rgba(74,6,27,0.05)", transition: "border-color 0.2s" }}>
      <div style={{ height: 6, background: supplier.status === "overdue" ? "linear-gradient(90deg,#C0392B,#E74C3C)" : supplier.status === "inactive" ? `linear-gradient(90deg,${T.taupe},#B0A090)` : `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${T.darkBurgundy},${T.royalBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(110,15,45,0.25)" }}>
              <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 800, color: "#FFF" }}>{supplier.initials}</span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 3 }}>{supplier.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", padding: "1px 7px", borderRadius: 4 }}>{supplier.id}</span>
                <StatusPill status={supplier.status} />
              </div>
            </div>
          </div>
          <StarRating rating={supplier.rating} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}><MapPin size={13} color={T.royalBurgundy} />{supplier.city}, {supplier.state}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}><Phone size={13} color={T.royalBurgundy} />{supplier.phone}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}><Package size={13} color={T.royalBurgundy} />{supplier.specialty}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: T.silkCream, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
          {[
            { label: "Purchases", value: String(stats.purchases.length) },
            { label: "Sarees",    value: String(stats.sareeCount) },
            { label: "Outstanding", value: formatINR(stats.outstanding), alert: stats.outstanding > 0 },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "10px 12px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", textAlign: "center" }}>
              <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: (s as any).alert ? T.crimson : T.luxuryBrown }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>Terms: <strong style={{ color: T.luxuryBrown }}>{supplier.terms}</strong></span>
          <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Last: {stats.lastPurchaseDate}</span>
        </div>

        <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 14 }}>
          <motion.button onClick={() => onView(supplier)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ width: "100%", padding: "9px 0", background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, color: "#FFF", border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Eye size={13} /> View Profile
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / edit supplier form — same field set as the wholesale customer form
// ─────────────────────────────────────────────────────────────────────────────

interface SupplierFormValues {
  name: string; contactName: string; phone: string; whatsapp: string;
  city: string; state: string; address: string; terms: string;
  bankName: string; accountNo: string; gstCode: string;
  specialty: string; notes: string;
}

function emptyForm(): SupplierFormValues {
  return {
    name: "", contactName: "", phone: "", whatsapp: "",
    city: "", state: "Andhra Pradesh", address: "", terms: "30 days",
    bankName: "", accountNo: "", gstCode: "", specialty: "Plain Silk", notes: "",
  };
}

function SupplierFormFields({
  form, setForm, errors, cardPreview, onCardChange,
}: {
  form: SupplierFormValues;
  setForm: (f: SupplierFormValues) => void;
  errors: Record<string, string>;
  cardPreview: string | null;
  onCardChange: (dataUrl: string | null) => void;
}) {
  const set = (k: keyof SupplierFormValues, v: string) => setForm({ ...form, [k]: v });
  const err = (k: string) => errors[k]
    ? <div style={{ color: T.crimson, fontSize: 11, marginTop: 3, fontFamily: F.ui }}>{errors[k]}</div>
    : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Business Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop"
            style={{ ...inp, border: errors.name ? `1.5px solid ${T.crimson}` : inp.border }} />
          {err("name")}
        </div>
        <div>
          <label style={lbl}>Owner / Contact Name *</label>
          <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business"
            style={{ ...inp, border: errors.contactName ? `1.5px solid ${T.crimson}` : inp.border }} />
          {err("contactName")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Phone Number *</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number"
              style={{ ...inp, border: errors.phone ? `1.5px solid ${T.crimson}` : inp.border }} />
            {err("phone")}
          </div>
          <div>
            <label style={lbl}>WhatsApp Number</label>
            <input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" style={inp} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>City *</label>
            <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City"
              style={{ ...inp, border: errors.city ? `1.5px solid ${T.crimson}` : inp.border }} />
            {err("city")}
          </div>
          <div>
            <label style={lbl}>State *</label>
            <select value={form.state} onChange={e => set("state", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Supplies (Saree Type)</label>
            <select value={form.specialty} onChange={e => set("specialty", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Payment Terms *</label>
            <select value={form.terms} onChange={e => set("terms", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Business Address</label>
          <textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3}
            style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>Bank Name</label>
            <input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" style={inp} />
          </div>
          <div>
            <label style={lbl}>Account Number</label>
            <input value={form.accountNo} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." style={inp} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={lbl}>GST Number</label>
            <input value={form.gstCode} onChange={e => set("gstCode", e.target.value.toUpperCase())} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)"
              style={{ ...inp, fontFamily: F.mono, fontSize: 13 }} />
          </div>
          <div>
            <label style={lbl}>Visiting Card Photo</label>
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => onCardChange(ev.target?.result as string);
              reader.readAsDataURL(file);
            }} style={{ ...inp, padding: "8px 12px", cursor: "pointer" }} />
          </div>
        </div>
        {cardPreview && (
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}`, position: "relative" }}>
            <img src={cardPreview} alt="Visiting card" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
            <button onClick={() => onCardChange(null)}
              style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={13} />
            </button>
          </div>
        )}
        <div>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={2}
            style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

function AddSupplierModal({ onSave, onCancel, nextId }: {
  onSave: (v: SupplierFormValues, card: string | null) => void;
  onCancel: () => void;
  nextId: string;
}) {
  const [form, setForm] = useState<SupplierFormValues>(emptyForm());
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())        errs.name = "Required";
    if (!form.contactName.trim()) errs.contactName = "Required";
    if (!form.phone.trim())       errs.phone = "Required";
    if (!form.city.trim())        errs.city = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form, cardPreview);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(30,10,20,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onCancel}>
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: "#FFF", borderRadius: 16, padding: 32, border: `1px solid ${T.borderDef}`, boxShadow: "0 32px 80px rgba(0,0,0,0.22)", width: "100%", maxWidth: 940, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Supplier</h3>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
          </div>
          <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: F.mono, fontSize: 11, color: T.taupe, flexShrink: 0 }}>{nextId} will be assigned</div>
        </div>

        <SupplierFormFields form={form} setForm={setForm} errors={errors} cardPreview={cardPreview} onCardChange={setCardPreview} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.borderDef}` }}>
          <button onClick={onCancel} style={{ padding: "10px 24px", background: "transparent", color: T.taupe, borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "10px 32px", background: T.royalBurgundy, color: "#FFF", borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} /> Save Supplier
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Saree inventory table (used in Overview + Order History)
// ─────────────────────────────────────────────────────────────────────────────

function SareeInventoryTable({ rows }: { rows: (SareeTag & { purchaseId: string; invoiceNumber: string })[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  // A line bought in bulk becomes one row per physical saree, each with its own code.
  const pieces = expandSareePieces(rows);

  if (rows.length === 0) {
    return <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No sarees match this filter.</div>;
  }

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: T.silkCream }}>
              {["Photo", "Saree ID", "Line Serial", "Purchase Order", "Type", "Colour", "Weight", "Purchase Date", "Buying Price", "Sell %", "Selling Price", "Profit"].map(h => (
                <th key={h} style={{ padding: "11px 14px", fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pieces.map((s, i) => (
              <tr key={`${s.purchaseId}-${s.id}-${i}`} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.45)" }}>
                <td style={{ padding: "10px 14px" }}>
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.id} onClick={() => setPreview(s.imageUrl!)}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", cursor: "pointer", border: `1px solid ${T.borderDef}` }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon size={14} color={T.taupe} />
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 11.5, fontWeight: 600, color: T.royalBurgundy }}>{s.id}</td>
                <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{s.lineCode}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginLeft: 6 }}>pc {s.pieceNo}/{s.lineQuantity}</span>
                </td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{s.purchaseId}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{s.sareeType || "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{s.color || "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.weight || "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.date}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{formatINR(s.price)}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.sellPercent}%</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: "#8B6018" }}>{formatINR(s.finalAmount)}</td>
                <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.green }}>{formatINR(lineProfit(s))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {preview && (
          <div onClick={() => setPreview(null)}
            style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(20,8,14,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={preview} alt="Saree" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Purchase (order) history table with saree drill-down
// ─────────────────────────────────────────────────────────────────────────────

function PurchaseHistoryTable({ purchases }: { purchases: Purchase[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (purchases.length === 0) {
    return <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No purchases in this period.</div>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: T.silkCream }}>
          {["Purchase Ref", "Invoice", "Sarees", "Buying Price", "Selling Price", "Profit", "Bill Amount", "Payment", ""].map(h => (
            <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {purchases.map((p, i) => (
          <React.Fragment key={p.id}>
            <tr style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>{p.id}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</div>
              </td>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.luxuryBrown }}>{p.invoiceNumber || "—"}</div>
                {p.invoiceFileName && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <FileText size={11} color={T.royalBurgundy} />
                    <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{p.invoiceFileName}</span>
                  </div>
                )}
              </td>
              <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{p.sareeCount}</td>
              {(() => {
                const t = purchaseTotals(p.sarees);
                return (
                  <>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{formatINR(t.buying)}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 600, color: T.antiqueGold, whiteSpace: "nowrap" }}>{formatINR(t.selling)}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.green, whiteSpace: "nowrap" }}>{formatINR(t.profit)}</td>
                  </>
                );
              })()}
              <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13.5, fontWeight: 700, color: "#8B6018" }}>{p.billAmount}</td>
              <td style={{ padding: "14px 16px" }}><PayStatusPill status={p.status} /></td>
              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  style={{ background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "6px 12px", fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {expanded === p.id ? "Hide sarees" : `View ${p.sareeCount} sarees`}
                </button>
              </td>
            </tr>
            {expanded === p.id && (
              <tr>
                <td colSpan={9} style={{ padding: 0, background: "rgba(247,242,234,0.7)", borderTop: `1px solid ${T.borderDef}` }}>
                  <div style={{ padding: "6px 16px 16px" }}>
                    <SareeInventoryTable rows={p.sarees.map(s => ({ ...s, purchaseId: p.id, invoiceNumber: p.invoiceNumber }))} />
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Supplier profile
// ─────────────────────────────────────────────────────────────────────────────

function SupplierProfile({ supplier, onBack, onRaiseRequest }: {
  supplier: Supplier;
  onBack: () => void;
  onRaiseRequest: (supplierId: string) => void;
}) {
  const { statsFor, payments, requests, updateSupplier } = useSuppliers();
  const [tab, setTab] = useState<"overview" | "orders" | "payments" | "contact" | "edit">("overview");
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "orders",   label: "Order History" },
    { key: "payments", label: "Payment History" },
    { key: "contact",  label: "Contact Details" },
    { key: "edit",     label: "Edit Profile" },
  ] as const;

  // Independent date filters — the overview inventory and the order history each
  // carry their own time range so one doesn't disturb the other.
  const [invFilter, setInvFilter]     = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [orderFilter, setOrderFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [payFilter, setPayFilter]     = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [typeFilter, setTypeFilter]       = useState("All Types");
  const [colorFilter, setColorFilter]     = useState("All Colours");
  const [purchaseFilter, setPurchaseFilter] = useState("All Purchases");
  const [sareeSearch, setSareeSearch] = useState("");

  const stats = statsFor(supplier.id);

  // Every saree ever bought from this supplier, flattened for the inventory view.
  const allSarees = useMemo(
    () => stats.purchases.flatMap(p => p.sarees.map(s => ({ ...s, purchaseId: p.id, invoiceNumber: p.invoiceNumber }))),
    [stats.purchases]
  );

  const sareeTypes  = useMemo(() => ["All Types", ...Array.from(new Set(allSarees.map(s => s.sareeType).filter(Boolean)))], [allSarees]);
  const sareeColors = useMemo(() => ["All Colours", ...Array.from(new Set(allSarees.map(s => s.color).filter(Boolean)))], [allSarees]);
  // Purchase orders this supplier's sarees came from, newest first, for the PO filter dropdown.
  const purchaseOptions = useMemo(
    () => [...stats.purchases].sort((a, b) => (b.date > a.date ? 1 : -1)),
    [stats.purchases]
  );

  const filteredSarees = useMemo(() => allSarees.filter(s => {
    const q = sareeSearch.toLowerCase();
    const mSearch = !q || s.id.toLowerCase().includes(q) || s.sareeType.toLowerCase().includes(q) || s.color.toLowerCase().includes(q);
    const mType     = typeFilter === "All Types" || s.sareeType === typeFilter;
    const mColor    = colorFilter === "All Colours" || s.color === colorFilter;
    const mPurchase = purchaseFilter === "All Purchases" || s.purchaseId === purchaseFilter;
    return mSearch && mType && mColor && mPurchase && matchesDateFilter(s.date, invFilter);
  }), [allSarees, sareeSearch, typeFilter, colorFilter, purchaseFilter, invFilter]);

  // Money spent + paid within the overview's selected time range.
  const rangePurchases = useMemo(
    () => stats.purchases.filter(p => matchesDateFilter(p.date, invFilter)),
    [stats.purchases, invFilter]
  );
  const rangeBilled = rangePurchases.reduce((sum, p) => sum + parseINR(p.billAmount), 0);
  const myPayments  = useMemo(() => payments.filter(p => p.supplierId === supplier.id), [payments, supplier.id]);
  const rangePaid   = myPayments.filter(p => matchesDateFilter(p.date, invFilter)).reduce((sum, p) => sum + p.amount, 0);

  const filteredOrders   = useMemo(() => stats.purchases.filter(p => matchesDateFilter(p.date, orderFilter)), [stats.purchases, orderFilter]);
  const filteredPayments = useMemo(() => myPayments.filter(p => matchesDateFilter(p.date, payFilter)), [myPayments, payFilter]);
  const filteredPaidSum  = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const myRequests = requests.filter(r => r.supplierId === supplier.id);

  // Spend trend by month, derived from this supplier's actual purchases.
  const spendByMonth = useMemo(() => {
    const buckets = new Map<string, number>();
    stats.purchases.forEach(p => {
      const month = (p.date || "").split(" ").slice(1).join(" ") || "—"; // "01 Jun 2026" → "Jun 2026"
      buckets.set(month, (buckets.get(month) || 0) + parseINR(p.billAmount));
    });
    return Array.from(buckets, ([month, spend]) => ({ month, spend })).reverse();
  }, [stats.purchases]);

  // Billed amount grouped by payment status — the number that matters most when
  // deciding which supplier needs to be paid next.
  const paymentStatusBreakdown = useMemo(() => {
    const colors: Record<string, string> = { Paid: T.green, Pending: T.antiqueGold, Partial: T.crimson };
    const buckets = new Map<string, number>();
    stats.purchases.forEach(p => {
      buckets.set(p.status, (buckets.get(p.status) || 0) + parseINR(p.billAmount));
    });
    return Array.from(buckets, ([name, value]) => ({ name, value, fill: colors[name] || T.taupe }))
      .filter(b => b.value > 0);
  }, [stats.purchases]);

  // Edit-profile form state, reset whenever a different supplier is opened.
  const [form, setForm] = useState<SupplierFormValues>({
    name: supplier.name, contactName: supplier.contactName, phone: supplier.phone,
    whatsapp: supplier.whatsapp || "", city: supplier.city, state: supplier.state,
    address: supplier.address, terms: supplier.terms, bankName: supplier.bankName || "",
    accountNo: supplier.accountNo || "", gstCode: supplier.gstCode,
    specialty: supplier.specialty, notes: supplier.notes || "",
  });
  const [cardPreview, setCardPreview] = useState<string | null>(supplier.visitingCard || null);
  const [savedFlash, setSavedFlash] = useState(false);

  React.useEffect(() => {
    setForm({
      name: supplier.name, contactName: supplier.contactName, phone: supplier.phone,
      whatsapp: supplier.whatsapp || "", city: supplier.city, state: supplier.state,
      address: supplier.address, terms: supplier.terms, bankName: supplier.bankName || "",
      accountNo: supplier.accountNo || "", gstCode: supplier.gstCode,
      specialty: supplier.specialty, notes: supplier.notes || "",
    });
    setCardPreview(supplier.visitingCard || null);
  }, [supplier]);

  const saveProfile = () => {
    updateSupplier(supplier.id, { ...form, visitingCard: cardPreview || undefined });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const card: React.CSSProperties = { background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" };

  return (
    <div style={{ padding: "40px 56px", background: T.silkCream, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ background: "transparent", border: `1px solid ${T.borderDef}`, padding: "10px 20px", borderRadius: 8, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Suppliers
        </motion.button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <motion.button onClick={() => onRaiseRequest(supplier.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, border: "none", padding: "10px 20px", borderRadius: 8, color: T.darkBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,71,0.3)" }}>
            <Send size={14} /> Raise Purchase Request
          </motion.button>
          <StatusPill status={supplier.status} />
          <span style={{ fontFamily: F.mono, fontSize: 13, background: "#FFF", border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>{supplier.id}</span>
        </div>
      </div>

      {/* Hero */}
      <FadeUp>
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 800, flexShrink: 0, boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>{supplier.initials}</div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>{supplier.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} color={T.antiqueGold} />{supplier.city}, {supplier.state}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><Package size={13} color={T.antiqueGold} />{supplier.specialty}</span>
                <StarRating rating={supplier.rating} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 44, alignItems: "center" }}>
            {[
              { label: "TOTAL PURCHASED", value: formatINR(stats.totalPurchased), color: T.goldLight },
              { label: "TOTAL PAID",      value: formatINR(stats.totalPaid),      color: "#7EE2A8" },
              { label: "OUTSTANDING",     value: formatINR(stats.outstanding),    color: stats.outstanding > 0 ? "#F87171" : T.goldLight },
            ].map(m => (
              <div key={m.label} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${T.borderDef}`, marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "14px 22px", fontFamily: F.ui, fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: tab === t.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent", marginBottom: -2, cursor: "pointer", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Time-range controls drive every number and the inventory below. */}
              <div style={{ ...card, padding: "18px 22px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Time Range</div>
                <DateFilterBar filter={invFilter} onChange={setInvFilter} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "Purchases in Range", value: String(rangePurchases.length),        sub: `${filteredSarees.length} sarees`,                     color: T.luxuryBrown, Icon: Package },
                  { label: "Billed in Range",    value: formatINR(rangeBilled),               sub: "Total invoiced by supplier",                          color: "#8B6018",     Icon: FileText },
                  { label: "Paid in Range",      value: formatINR(rangePaid),                 sub: "Amount settled to supplier",                          color: T.green,       Icon: Wallet },
                  { label: "Balance in Range",   value: formatINR(rangeBilled - rangePaid),   sub: rangeBilled - rangePaid > 0 ? "Still to be paid" : "Fully settled", color: rangeBilled - rangePaid > 0 ? T.crimson : T.green, Icon: IndianRupee },
                ].map(s => (
                  <div key={s.label} style={{ ...card, padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <s.Icon size={15} color={T.royalBurgundy} />
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600 }}>{s.label}</div>
                    </div>
                    <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Analytics */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                <div style={{ ...card, padding: "24px 28px" }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 20 }}>Purchase Spend by Month</div>
                  {spendByMonth.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchases recorded yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={spendByMonth} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <RechartsTooltip formatter={(v: any) => [formatINR(Number(v)), "Spend"]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
                        <Bar dataKey="spend" fill={T.royalBurgundy} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div style={{ ...card, padding: "24px 28px" }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>Purchases by Payment Status</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 16 }}>Billed amount split by what's paid, partial, or still pending.</div>
                  {paymentStatusBreakdown.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchases recorded yet.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={paymentStatusBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={32}>
                            {paymentStatusBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <RechartsTooltip formatter={(v: any) => [formatINR(Number(v))]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        {paymentStatusBreakdown.map(s => (
                          <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.fill }} />
                              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.name}</span>
                            </div>
                            <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{formatINR(s.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* External purchase inventory */}
              <div style={card}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>External Purchase Inventory</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 3 }}>Every saree bought from {supplier.name} in the selected time range.</div>
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "6px 12px", borderRadius: 8 }}>
                      {filteredSarees.length} saree{filteredSarees.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Buying / selling / profit across the sarees currently listed */}
                  {filteredSarees.length > 0 && (() => {
                    const t = purchaseTotals(filteredSarees);
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
                        {[
                          { label: "Pieces", text: String(t.pieces), color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
                          { label: "Buying Price", text: formatINR(t.buying), color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
                          { label: "Selling Price", text: formatINR(t.selling), color: T.antiqueGold, bg: "rgba(200,155,71,0.10)", border: T.borderGold },
                          { label: "Profit", text: formatINR(t.profit), color: T.green, bg: T.greenBg, border: "rgba(30,102,64,0.20)" },
                        ].map(({ label, text, color, bg, border }) => (
                          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                            <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 4 }}>{label}</div>
                            <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color }}>{text}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: "1 1 240px" }}>
                      <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
                      <input value={sareeSearch} onChange={e => setSareeSearch(e.target.value)} placeholder="Search saree ID, type, colour…"
                        style={{ ...inp, paddingLeft: 34, background: T.silkCream, fontSize: 13 }} />
                    </div>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 150, cursor: "pointer", background: T.silkCream, fontSize: 13 }}>
                      {sareeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 150, cursor: "pointer", background: T.silkCream, fontSize: 13 }}>
                      {sareeColors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={purchaseFilter} onChange={e => setPurchaseFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 190, cursor: "pointer", background: T.silkCream, fontSize: 13 }}>
                      <option value="All Purchases">All Purchase Orders</option>
                      {purchaseOptions.map(p => (
                        <option key={p.id} value={p.id}>{p.id} · {p.invoiceNumber || "no invoice"}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <SareeInventoryTable rows={filteredSarees} />
              </div>

              {/* Purchase requests raised for this supplier */}
              {myRequests.length > 0 && (
                <div style={card}>
                  <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}`, fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Purchase Requests</div>
                  {myRequests.map((r, i) => (
                    <div key={r.id} style={{ padding: "14px 22px", borderTop: i > 0 ? `1px solid ${T.borderDef}` : "none", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, minWidth: 90 }}>{r.id}</div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.quantity} × {r.sareeType}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 2 }}>{r.reason}</div>
                      </div>
                      <div style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: "#8B6018" }}>{formatINR(r.estimatedAmount)}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{r.requestedDate}</div>
                      <span style={{
                        fontFamily: F.ui, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: r.status === "approved" ? "rgba(30,102,64,0.09)" : r.status === "rejected" ? T.crimsonBg : "rgba(230,126,34,0.12)",
                        color: r.status === "approved" ? T.greenMid : r.status === "rejected" ? T.crimson : "rgba(230,126,34,1)",
                      }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ORDER HISTORY ────────────────────────────────────────────── */}
          {tab === "orders" && (
            <div style={card}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Full Purchase History</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "6px 12px", borderRadius: 8 }}>
                      {filteredOrders.length} purchase{filteredOrders.length !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.13)", padding: "6px 12px", borderRadius: 8 }}>
                      {formatINR(filteredOrders.reduce((sum, p) => sum + parseINR(p.billAmount), 0))}
                    </span>
                  </div>
                </div>
                <DateFilterBar filter={orderFilter} onChange={setOrderFilter} />
              </div>
              <PurchaseHistoryTable purchases={filteredOrders} />
            </div>
          )}

          {/* ── PAYMENT HISTORY ──────────────────────────────────────────── */}
          {tab === "payments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {[
                  { label: "Paid in Range",  value: formatINR(filteredPaidSum),      color: T.green },
                  { label: "Paid All Time",  value: formatINR(stats.totalPaid),      color: T.luxuryBrown },
                  { label: "Outstanding",    value: formatINR(stats.outstanding),    color: stats.outstanding > 0 ? T.crimson : T.green },
                ].map(s => (
                  <div key={s.label} style={{ ...card, padding: "20px 22px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 12 }}>Payments Made</div>
                  <DateFilterBar filter={payFilter} onChange={setPayFilter} />
                </div>
                {filteredPayments.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No payments in this period.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: T.silkCream }}>
                        {["Payment Ref", "Date", "Against Purchase", "Mode", "Reference", "Amount"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p, i) => (
                        <tr key={p.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11.5, fontWeight: 600, color: T.royalBurgundy }}>{p.id}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{p.date}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11.5, color: T.luxuryBrown }}>{p.purchaseId || "—"}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{p.mode}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{p.reference}</td>
                          <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.green }}>{formatINR(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── CONTACT DETAILS ──────────────────────────────────────────── */}
          {tab === "contact" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Contact Person", value: supplier.contactName, Icon: Building2 },
                { label: "Phone",          value: supplier.phone, Icon: Phone },
                { label: "WhatsApp",       value: supplier.whatsapp || "—", Icon: Phone },
                { label: "GST Number",     value: supplier.gstCode || "—", Icon: FileText },
                { label: "Bank Name",      value: supplier.bankName || "—", Icon: IndianRupee },
                { label: "Account Number", value: supplier.accountNo || "—", Icon: IndianRupee },
                { label: "Payment Terms",  value: supplier.terms, Icon: Clock },
                { label: "Supplies",       value: supplier.specialty, Icon: Package },
              ].map(f => (
                <div key={f.label} style={{ ...card, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>{f.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}><f.Icon size={14} color={T.royalBurgundy} /> {f.value}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", ...card, padding: "20px 22px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Address</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{supplier.address || "—"}</div>
              </div>
              {supplier.notes && (
                <div style={{ gridColumn: "1 / -1", ...card, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Notes</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{supplier.notes}</div>
                </div>
              )}
              {supplier.visitingCard && (
                <div style={{ gridColumn: "1 / -1", ...card, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: T.taupe, marginBottom: 10 }}>Visiting Card</div>
                  <img src={supplier.visitingCard} alt="Visiting card" style={{ maxWidth: 380, width: "100%", borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
                </div>
              )}
            </div>
          )}

          {/* ── EDIT PROFILE ─────────────────────────────────────────────── */}
          {tab === "edit" && (
            <div style={{ ...card, padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>Edit Profile</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {savedFlash && (
                    <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.green, display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={14} /> Saved
                    </span>
                  )}
                  <button onClick={saveProfile}
                    style={{ padding: "9px 18px", background: T.royalBurgundy, color: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "none" }}>
                    Save Changes
                  </button>
                </div>
              </div>
              <SupplierFormFields form={form} setForm={setForm} errors={{}} cardPreview={cardPreview} onCardChange={setCardPreview} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function SuppliersPage() {
  const { suppliers, statsFor, addSupplier, raiseRequest, requests, nextSupplierId } = useSuppliers();
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Types");
  const [toast, setToast] = useState("");

  // Keep the open profile in step with edits made from the Edit Profile tab.
  const liveSelected = selected ? suppliers.find(s => s.id === selected.id) ?? null : null;

  const totals = useMemo(() => {
    let purchased = 0, paid = 0, outstanding = 0, sarees = 0;
    suppliers.forEach(s => {
      const st = statsFor(s.id);
      purchased += st.totalPurchased;
      paid += st.totalPaid;
      outstanding += st.outstanding;
      sarees += st.sareeCount;
    });
    return { purchased, paid, outstanding, sarees };
  }, [suppliers, statsFor]);

  const specialties = useMemo(
    () => ["All Types", ...Array.from(new Set(suppliers.map(s => s.specialty)))],
    [suppliers]
  );

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const mSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q);
    const mStatus = statusFilter === "All" || s.status === statusFilter.toLowerCase();
    const mSpec   = specialtyFilter === "All Types" || s.specialty === specialtyFilter;
    return mSearch && mStatus && mSpec;
  });

  const pendingRequests = requests.filter(r => r.status === "pending").length;

  // Raising a purchase request uses the exact same form as adding an external
  // purchase — supplier, invoice and per-saree detail — so it's ready to convert
  // into a real purchase the moment the superadmin approves it.
  const initialPurchaseFormFor = (supplierId: string | null): PurchaseFormState => {
    const s = suppliers.find(x => x.id === supplierId);
    return {
      ...EMPTY_PURCHASE_FORM,
      supplierId: s?.id || "",
      supplier: s?.name || "",
      location: s ? `${s.city}, ${s.state}` : "",
      date: new Date().toISOString().slice(0, 10),
      gstNumber: s?.gstCode || "",
    };
  };

  const handleRaiseRequest = (form: PurchaseFormState, sarees: SareeTag[], request?: { urgency: "Normal" | "Urgent"; reason: string }) => {
    const s = suppliers.find(x => x.id === form.supplierId);
    const totals = purchaseTotals(sarees);
    const estimated = parseINR(form.billAmount) || totals.selling;
    raiseRequest({
      supplierId: form.supplierId,
      supplierName: s?.name ?? form.supplier,
      requestedBy: "Admin",
      requestedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      sareeType: sarees[0]?.sareeType || s?.specialty || "—",
      quantity: totals.pieces,
      estimatedAmount: estimated,
      urgency: request?.urgency ?? "Normal",
      reason: request?.reason ?? "",
      // Full purchase payload so the superadmin approves the real thing.
      location: form.location,
      gstNumber: form.gstNumber,
      invoiceNumber: form.invoiceNumber,
      purchaseDate: form.date,
      billAmount: form.billAmount,
      notes: form.notes,
      invoiceFileName: form.invoiceFileName || undefined,
      sarees,
    });
    setRequestFor(null);
    setToast(`Purchase request sent to superadmin for ${s?.name ?? form.supplier}`);
    setTimeout(() => setToast(""), 3200);
  };

  if (liveSelected) {
    return (
      <>
        <SupplierProfile
          supplier={liveSelected}
          onBack={() => setSelected(null)}
          onRaiseRequest={id => setRequestFor(id)}
        />
        <AnimatePresence>
          {requestFor && (
            <PurchaseFormModal
              mode="request"
              initial={initialPurchaseFormFor(requestFor)}
              initialSarees={[]}
              onClose={() => setRequestFor(null)}
              onSubmit={handleRaiseRequest}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>{toast && <Toast msg={toast} />}</AnimatePresence>
      </>
    );
  }

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{ minHeight: 230, background: T.darkBurgundy, display: "flex", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: -100, width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(200,155,71,0.022) 48px,rgba(200,155,71,0.022) 49px)` }} />
        <div style={{ padding: "44px 56px 90px", display: "flex", width: "100%", alignItems: "flex-start", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},rgba(200,155,71,0))` }} />
              <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "2.5px", color: "rgba(200,155,71,0.82)", textTransform: "uppercase", fontWeight: 600 }}>Since 1999 · Saree Supplier Network</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
              <h1 style={{ fontFamily: F.display, fontSize: 52, color: "#FFFDF9", margin: 0, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.0 }}>Suppliers</h1>
              <span style={{ fontFamily: F.display, fontSize: 30, color: T.antiqueGold, fontStyle: "italic", fontWeight: 400 }}>&amp; External Sourcing</span>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.60)", margin: "6px 0 0", maxWidth: 560, lineHeight: 1.65 }}>
              Manage every saree supplier. Track external purchase inventory, payment history, and raise purchase requests for approval.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignSelf: "flex-start", flexShrink: 0 }}>
            <motion.button onClick={() => setRequestFor(suppliers[0]?.id ?? "")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ padding: "13px 22px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(200,155,71,0.4)", borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.goldLight, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Send size={15} /> Raise Purchase Request
            </motion.button>
            <motion.button onClick={() => setShowAdd(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ padding: "13px 24px", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.darkBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(200,155,71,0.35)" }}>
              <Plus size={15} /> Add New Supplier
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}>
        <div style={{ background: "linear-gradient(135deg,#5D1027 0%,#2C0913 100%)", borderRadius: 24, display: "flex", alignItems: "stretch", boxShadow: "0 24px 72px rgba(0,0,0,0.32),0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { icon: Building2,     label: "Total Suppliers",   value: String(suppliers.length),                                 sub: "Registered saree suppliers", hi: false },
            { icon: Package,       label: "Sarees Purchased",  value: String(totals.sarees),                                    sub: "Across all external buys",   hi: false },
            { icon: IndianRupee,   label: "Total Purchased",   value: `₹${(totals.purchased / 100000).toFixed(1)}L`,            sub: "Billed by all suppliers",    hi: true  },
            { icon: CheckCircle2,  label: "Total Paid",        value: `₹${(totals.paid / 100000).toFixed(1)}L`,                 sub: "Settled to suppliers",       hi: false },
            { icon: AlertTriangle, label: "Outstanding",       value: `₹${(totals.outstanding / 100000).toFixed(1)}L`,          sub: "Yet to be paid",             hi: false },
            { icon: TrendingUp,    label: "Pending Requests",  value: String(pendingRequests),                                  sub: "Awaiting superadmin",        hi: false },
          ].map((m, i, arr) => (
            <div key={m.label} style={{ flex: 1, padding: "26px 18px", background: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none", borderRight: i < arr.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.icon size={20} color={m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 9.5, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>{m.label}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 5 }}>{m.value}</div>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)" }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Directory */}
      <div style={{ padding: "48px 56px 0" }}>
        <FadeUp>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Supplier Directory</h2>
            </div>
            <motion.button onClick={() => setShowAdd(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ padding: "10px 22px", background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(110,15,45,0.22)" }}>
              <Plus size={14} /> Add New Supplier
            </motion.button>
          </div>

          <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by supplier name, city, or contact…"
                style={{ width: "100%", padding: "9px 12px 9px 38px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Active", "Overdue", "Inactive"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding: "8px 16px", borderRadius: 20, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: statusFilter === s ? T.royalBurgundy : "transparent", color: statusFilter === s ? "#FFF" : T.taupe, border: statusFilter === s ? "none" : `1.5px solid rgba(110,15,45,0.18)`, transition: "all 0.15s" }}>{s}</button>
              ))}
            </div>
            <select value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)}
              style={{ padding: "9px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer", outline: "none" }}>
              {specialties.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {filtered.map((s, i) => (
              <FadeUp key={s.id} delay={i * 0.06}>
                <SupplierCard supplier={s} onView={setSelected} />
              </FadeUp>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "60px 24px", textAlign: "center" }}>
                <Building2 size={44} color={T.taupe} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No suppliers match your search or filter.</div>
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Purchase requests */}
      <div style={{ padding: "48px 56px 0" }}>
        <FadeUp>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
            <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Purchase Requests</h2>
          </div>
          <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
            {requests.length === 0 ? (
              <div style={{ padding: "44px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No purchase requests raised yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.silkCream }}>
                    {["Request", "Supplier", "Items", "Estimated", "Urgency", "Raised", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                      <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{r.id}</td>
                      <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.supplierName}</td>
                      <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{r.quantity} × {r.sareeType}</td>
                      <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: "#8B6018" }}>{formatINR(r.estimatedAmount)}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: r.urgency === "Urgent" ? T.crimsonBg : "rgba(139,112,96,0.10)", color: r.urgency === "Urgent" ? T.crimson : T.taupe }}>{r.urgency}</span>
                      </td>
                      <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.requestedDate}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          fontFamily: F.ui, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                          background: r.status === "approved" ? "rgba(30,102,64,0.09)" : r.status === "rejected" ? T.crimsonBg : "rgba(230,126,34,0.12)",
                          color: r.status === "approved" ? T.greenMid : r.status === "rejected" ? T.crimson : "rgba(230,126,34,1)",
                        }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </FadeUp>
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddSupplierModal
            nextId={nextSupplierId()}
            onCancel={() => setShowAdd(false)}
            onSave={(v, cardUrl) => {
              addSupplier({
                name: v.name, contactName: v.contactName, phone: v.phone, whatsapp: v.whatsapp,
                city: v.city, state: v.state, address: v.address, gstCode: v.gstCode,
                specialty: v.specialty, terms: v.terms, bankName: v.bankName, accountNo: v.accountNo,
                notes: v.notes, visitingCard: cardUrl || undefined, status: "active", rating: 3,
              });
              setShowAdd(false);
              setToast(`Supplier ${v.name} added`);
              setTimeout(() => setToast(""), 3000);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {requestFor !== null && (
          <PurchaseFormModal
            mode="request"
            initial={initialPurchaseFormFor(requestFor)}
            initialSarees={[]}
            onClose={() => setRequestFor(null)}
            onSubmit={handleRaiseRequest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast msg={toast} />}</AnimatePresence>
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: T.darkBurgundy, color: "#FFF", padding: "14px 22px", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, zIndex: 1500, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 9 }}>
      <CheckCircle2 size={16} color={T.antiqueGold} /> {msg}
    </motion.div>
  );
}
