import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Search, Plus, Eye, MapPin, Phone, Building2, Package,
  IndianRupee, AlertTriangle, CheckCircle2, ArrowLeft, FileText,
  TrendingUp, Star,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "./DateFilterBar";

const T = {
  silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B", darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314", warmCream: "#F5E8D0",
  taupe: "#8B7060", green: "#1E6640", greenBg: "rgba(30,102,64,0.09)",
  greenMid: "#2D9158", crimson: "#C0392B", crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)", borderGold: "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const EASE = [0.22, 1, 0.36, 1] as const;

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

interface Vendor {
  id: string; name: string; initials: string; contactName: string;
  phone: string; whatsapp?: string; city: string; state: string;
  address: string; gstCode: string; type: string; terms: string;
  bankName?: string; accountNo?: string; notes?: string;
  status: "active" | "inactive" | "overdue";
  totalOrders: number; totalSpend: string; outstanding: string;
  lastOrder: string; rating: number;
}

const INITIAL_VENDORS: Vendor[] = [
  { id: "VEN-001", name: "Sri Venkateswara Textiles", initials: "SV", contactName: "Ravi Kumar", phone: "+91 94440 12345", whatsapp: "+91 94440 12345", city: "Ongole", state: "Andhra Pradesh", address: "12, Trunk Road, Ongole, Andhra Pradesh - 523001", gstCode: "37AAACS1234F1Z1", type: "Warp", terms: "Net 30", bankName: "SBI", accountNo: "31234567890", notes: "Reliable supplier since 2018. Provides premium quality warp yarn.", status: "active", totalOrders: 34, totalSpend: "18,40,000", outstanding: "0", lastOrder: "15 Jun 2026", rating: 5 },
  { id: "VEN-002", name: "Lakshmi Thread House", initials: "LT", contactName: "Suresh Babu", phone: "+91 98888 22222", whatsapp: "+91 98888 22222", city: "Chennai", state: "Tamil Nadu", address: "82, Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu - 600017", gstCode: "33AABCL4444G1Z2", type: "Warp / Resham", terms: "Net 15", bankName: "HDFC", accountNo: "09876543210", notes: "Specialises in fine grade warp and resham. Quick turnaround.", status: "active", totalOrders: 28, totalSpend: "12,60,000", outstanding: "0", lastOrder: "20 Jun 2026", rating: 4 },
  { id: "VEN-003", name: "Kanchipuram Silks", initials: "KS", contactName: "Murugan R.", phone: "+91 99999 55555", city: "Kanchipuram", state: "Tamil Nadu", address: "15, Gandhi Road, Kanchipuram, Tamil Nadu - 631501", gstCode: "33BBBBK5555H1Z3", type: "Resham", terms: "Net 45", bankName: "Canara Bank", accountNo: "11223344556", notes: "Premium silk resham. Preferred vendor for high-end designs.", status: "overdue", totalOrders: 19, totalSpend: "9,80,000", outstanding: "2,20,000", lastOrder: "02 May 2026", rating: 4 },
  { id: "VEN-004", name: "Mysore Silk Co.", initials: "MS", contactName: "Anand Prakash", phone: "+91 91111 33333", city: "Mysore", state: "Karnataka", address: "44, MG Road, Mysore, Karnataka - 570001", gstCode: "29CCCCM3333I1Z4", type: "Resham / Warp", terms: "Net 30", bankName: "ICICI", accountNo: "65432198765", notes: "Heritage supplier. Supplies both resham and warp at bulk rates.", status: "active", totalOrders: 22, totalSpend: "14,50,000", outstanding: "0", lastOrder: "10 Jun 2026", rating: 5 },
  { id: "VEN-005", name: "Surat Zari Works", initials: "SZ", contactName: "Hardik Shah", phone: "+91 93333 77777", whatsapp: "+91 93333 77777", city: "Surat", state: "Gujarat", address: "102, Ring Road, Surat, Gujarat - 395002", gstCode: "24DDDDZ7777J1Z5", type: "Jari", terms: "Net 60", bankName: "Axis Bank", accountNo: "98765432101", notes: "Best quality Jari in the market. Occasional delays during festive season.", status: "active", totalOrders: 15, totalSpend: "11,20,000", outstanding: "0", lastOrder: "28 May 2026", rating: 4 },
  { id: "VEN-006", name: "Varanasi Zari House", initials: "VZ", contactName: "Rakesh Tiwari", phone: "+91 95555 99999", city: "Varanasi", state: "Uttar Pradesh", address: "55, Dashashwamedh Ghat Road, Varanasi, UP - 221001", gstCode: "09EEEEV9999K1Z6", type: "Jari", terms: "Advance", bankName: "PNB", accountNo: "44556677889", notes: "Traditional Banarasi Jari. Advance payment required. Best quality.", status: "inactive", totalOrders: 8, totalSpend: "6,80,000", outstanding: "0", lastOrder: "4 months ago", rating: 3 },
];

const PAYMENT_TERMS = ["30 days", "15 days", "45 days", "60 days", "90 days", "Advance"];
const STATES = ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Gujarat", "Uttar Pradesh", "Maharashtra", "Kerala"];
const MATERIAL_TYPES = ["All Types", "Warp", "Resham", "Jari", "Warp / Resham", "Resham / Warp"];
const spendByMonth = [
  { month: "Jan", spend: 280000 }, { month: "Feb", spend: 340000 }, { month: "Mar", spend: 290000 },
  { month: "Apr", spend: 420000 }, { month: "May", spend: 380000 }, { month: "Jun", spend: 450000 },
];
const spendByType = [
  { name: "Warp", value: 2840000, fill: T.royalBurgundy },
  { name: "Resham", value: 1960000, fill: T.antiqueGold },
  { name: "Jari", value: 1200000, fill: T.green },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "rgba(30,102,64,0.09)", color: "#2D9158", label: "Active" },
    inactive: { bg: "rgba(139,112,96,0.10)", color: T.taupe, label: "Inactive" },
    overdue: { bg: "rgba(192,57,43,0.08)", color: "#C0392B", label: "Overdue" },
  };
  const s = map[status] ?? map.active;
  return <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20 }}>{s.label}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={i <= rating ? T.antiqueGold : "none"} color={i <= rating ? T.antiqueGold : T.taupe} />)}
    </div>
  );
}

function VendorCard({ vendor, onView }: { vendor: Vendor; onView: (v: Vendor) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(74,6,27,0.14)" }} transition={{ duration: 0.22 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "#FFF", borderRadius: 20, border: `1.5px solid ${hov ? "rgba(110,15,45,0.22)" : T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 12px rgba(74,6,27,0.05)", transition: "border-color 0.2s" }}>
      <div style={{ height: 6, background: vendor.status === "overdue" ? "linear-gradient(90deg,#C0392B,#E74C3C)" : vendor.status === "inactive" ? `linear-gradient(90deg,${T.taupe},#B0A090)` : `linear-gradient(90deg,${T.deepWine},${T.royalBurgundy})` }} />
      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${T.darkBurgundy},${T.royalBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(110,15,45,0.25)" }}>
              <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 800, color: "#FFF" }}>{vendor.initials}</span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 3 }}>{vendor.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", padding: "1px 7px", borderRadius: 4 }}>{vendor.id}</span>
                <StatusPill status={vendor.status} />
              </div>
            </div>
          </div>
          <StarRating rating={vendor.rating} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}><MapPin size={13} color={T.royalBurgundy} />{vendor.city}, {vendor.state}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}><Phone size={13} color={T.royalBurgundy} />{vendor.phone}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}><Package size={13} color={T.royalBurgundy} />{vendor.type}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, background: T.silkCream, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
          {[{ label: "Orders", value: String(vendor.totalOrders) }, { label: "Total Spend", value: `₹${vendor.totalSpend}` }, { label: "Outstanding", value: vendor.outstanding === "0" ? "₹0" : `₹${vendor.outstanding}` }].map((s, i) => (
            <div key={s.label} style={{ padding: "10px 12px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", textAlign: "center" }}>
              <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: s.label === "Outstanding" && vendor.outstanding !== "0" ? T.crimson : T.luxuryBrown }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>Terms: <strong style={{ color: T.luxuryBrown }}>{vendor.terms}</strong></span>
          <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Last: {vendor.lastOrder}</span>
        </div>
        <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 14 }}>
          <motion.button onClick={() => onView(vendor)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ width: "100%", padding: "9px 0", background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, color: "#FFF", border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Eye size={13} /> View Profile
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function AddVendorModal({ onSave, onCancel, nextId }: { onSave: (v: Vendor) => void; onCancel: () => void; nextId: string }) {
  const [form, setForm] = useState({
    name: "", contactName: "", phone: "", whatsapp: "",
    city: "", state: "Andhra Pradesh", address: "",
    gstCode: "", type: "Warp", terms: "30 days",
    bankName: "", accountNo: "", notes: "", visitingCard: "",
  });
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 6,
    border: `1px solid rgba(110,15,45,0.12)`, fontFamily: F.ui,
    fontSize: 14, color: T.luxuryBrown, background: "#FFF",
    outline: "none", boxSizing: "border-box" as const,
  };
  const lbl: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 12, fontWeight: 600,
    color: T.luxuryBrown, display: "block", marginBottom: 6,
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.contactName.trim()) errs.contactName = "Required";
    if (!form.phone.trim()) errs.phone = "Required";
    if (!form.city.trim()) errs.city = "Required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const initials = form.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    onSave({
      id: nextId, name: form.name, initials,
      contactName: form.contactName, phone: form.phone,
      whatsapp: form.whatsapp, city: form.city, state: form.state,
      address: form.address, gstCode: form.gstCode, type: form.type,
      terms: form.terms, bankName: form.bankName, accountNo: form.accountNo,
      notes: form.notes, visitingCard: cardPreview || undefined,
      status: "active", totalOrders: 0, totalSpend: "0",
      outstanding: "0", lastOrder: "—", rating: 3,
    } as any);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(30,10,20,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }} onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFF", borderRadius: 16, padding: 32,
          border: `1px solid rgba(110,15,45,0.10)`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
          width: "100%", maxWidth: 940, maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, color: T.luxuryBrown, margin: "0 0 6px 0" }}>Add a New Vendor</h3>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Fill in the business and contact details. Payment terms can be set here and changed later.</p>
          </div>
          <div style={{ padding: "4px 12px", background: T.silkCream, borderRadius: 20, fontFamily: F.mono, fontSize: 11, color: T.taupe, flexShrink: 0 }}>{nextId} will be assigned</div>
        </div>

        {/* Form Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Business Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" style={{ ...inp, border: errors.name ? "1.5px solid #C0392B" : inp.border }} />
              {errors.name && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.name}</div>}
            </div>
            <div>
              <label style={lbl}>Owner / Contact Name *</label>
              <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" style={{ ...inp, border: errors.contactName ? "1.5px solid #C0392B" : inp.border }} />
              {errors.contactName && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.contactName}</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>Phone Number *</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" style={{ ...inp, border: errors.phone ? "1.5px solid #C0392B" : inp.border }} />
                {errors.phone && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.phone}</div>}
              </div>
              <div>
                <label style={lbl}>WhatsApp Number</label>
                <input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" style={inp} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>City *</label>
                <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" style={{ ...inp, border: errors.city ? "1.5px solid #C0392B" : inp.border }} />
                {errors.city && <div style={{ color: "#C0392B", fontSize: 11, marginTop: 3 }}>{errors.city}</div>}
              </div>
              <div>
                <label style={lbl}>State *</label>
                <select value={form.state} onChange={e => set("state", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>Material Type</label>
                <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
                  {MATERIAL_TYPES.filter(t => t !== "All Types").map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Payment Terms *</label>
                <select value={form.terms} onChange={e => set("terms", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
                  {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column */}
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
                <input value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" style={inp} />
              </div>
              <div>
                <label style={lbl}>Visiting Card Photo</label>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setCardPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} style={{ ...inp, padding: "8px 12px", backgroundColor: "#FFF", cursor: "pointer" }} />
              </div>
            </div>
            {cardPreview && (
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid rgba(110,15,45,0.12)`, maxHeight: 120 }}>
                <img src={cardPreview} alt="Visiting Card" style={{ width: "100%", height: 120, objectFit: "cover" }} />
              </div>
            )}
            <div>
              <label style={lbl}>Notes</label>
              <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." style={inp} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 32, paddingTop: 24, borderTop: `1px solid rgba(110,15,45,0.08)` }}>
          <button onClick={onCancel} style={{ padding: "10px 24px", background: "transparent", color: T.taupe, borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "10px 32px", background: T.royalBurgundy, color: "#FFF", borderRadius: 8, border: "none", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} /> Save Vendor
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

const MAT_TAG_PO: Record<string, { col: string; bg: string }> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"   },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)"  },
  Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"    },
};

function PurchaseOrderHistoryTable({ orders }: { orders: any[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: T.silkCream }}>{["PO Reference","Materials","Total Value","Receipt Details","Status"].map(h => <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>)}</tr></thead>
      <tbody>{orders.map((o, i) => <tr key={o.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>{o.id}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{o.date}</div>
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {o.materials.map((m: any, mi: number) => {
               const mt = MAT_TAG_PO[m.type] || MAT_TAG_PO.Warp;
               return (
                 <div key={mi} style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: mi < o.materials.length - 1 ? `1px solid ${T.borderDef}` : "none" }}>
                   <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: mt.col, background: mt.bg, borderRadius: 4, padding: "2px 6px", marginTop: 1 }}>{m.type}</span>
                   <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                     <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown }}>{m.description}</span>
                     {m.invoiceAmount && <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Invoice: <span style={{fontFamily: F.mono, fontWeight: 600}}>{m.invoiceAmount}</span></span>}
                   </div>
                   <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 6px", borderRadius: 4, marginTop: 1 }}>{m.qty}</span>
                 </div>
               );
            })}
          </div>
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top", fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: "#8B6018" }}>
          {o.totalAmount}
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          {o.grnId ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: T.royalBurgundy }}>{o.grnId}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.luxuryBrown }}>{o.firmName}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{o.receivedDate}</div>
            </div>
          ) : (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</div>
          )}
        </td>
        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: o.status === "Delivered" ? T.greenBg : T.silkCream, color: o.status === "Delivered" ? T.greenMid : T.taupe, padding: "3px 8px", borderRadius: 6 }}>{o.status}</span>
            {o.receiveStatus && (
               <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, background: o.receiveStatus === "Match" ? T.greenBg : "rgba(242,153,74,0.15)", color: o.receiveStatus === "Match" ? T.greenMid : "#E67E22", padding: "2px 6px", borderRadius: 4 }}>
                 {o.receiveStatus}
               </span>
            )}
          </div>
        </td>
      </tr>)}</tbody>
    </table>
  );
}

function VendorProfile({ vendor, onBack, onUpdate }: { vendor: Vendor; onBack: () => void; onUpdate?: (v: Vendor) => void }) {
  const [tab, setTab] = useState<"overview" | "orders" | "contact" | "edit">("overview");
  const tabs = [{ key: "overview", label: "Overview" }, { key: "orders", label: "Order History" }, { key: "contact", label: "Contact Details" }, { key: "edit", label: "Edit Profile" }] as const;
  const [orderDateFilter, setOrderDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  
  const [form, setForm] = useState(vendor);
  const set = (k: keyof Vendor, v: string) => setForm(p => ({ ...p, [k]: v }));
  
  React.useEffect(() => { setForm(vendor); }, [vendor]);

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 6,
    border: `1px solid rgba(110,15,45,0.12)`, fontFamily: F.ui,
    fontSize: 14, color: T.luxuryBrown, background: "#FFF",
    outline: "none", boxSizing: "border-box" as const,
  };
  const lbl: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 12, fontWeight: 600,
    color: T.luxuryBrown, display: "block", marginBottom: 6,
  };
  
  const t1 = vendor.type.split(" / ")[0] || "Warp";
  const t2 = vendor.type.split(" / ")[1] || "Resham";
  
  const mockOrders = [
    { 
      id: "PO-2026-041", date: "15 Jun 2026", 
      status: "Delivered", grnId: "GRN-2026-MAY-814", firmName: "Beere Kesava Silks (Head Firm)", receivedDate: "20 May 2026", receiveStatus: "Match",
      materials: [
        { type: t1, description: "Premium quality raw threads", qty: "60 kg", invoiceAmount: "₹1,20,000" },
        { type: t2, description: "Standard dye grade lot", qty: "60 kg", invoiceAmount: "₹1,20,000" }
      ],
      totalAmount: "₹2,40,000" 
    },
    { 
      id: "PO-2026-028", date: "02 May 2026", 
      status: "Delivered", grnId: "GRN-2026-MAY-011", firmName: "Beere Kesava Silks (Head Firm)", receivedDate: "17 May 2026", receiveStatus: "Short",
      materials: [
        { type: t1, description: "Red 30 kg", qty: "30 kg", invoiceAmount: "₹1,25,000" },
        { type: t2, description: "Gold 24 kg", qty: "24 kg", invoiceAmount: "₹1,00,000" }
      ],
      totalAmount: "₹2,25,000" 
    },
    { 
      id: "PO-2026-014", date: "10 Mar 2026", 
      status: "Pending",
      materials: [
        { type: t1, description: "Polyester 2G Gold 6 Buns", qty: "6 Buns", invoiceAmount: "₹65,000" }
      ],
      totalAmount: "₹65,000" 
    },
    { 
      id: "PO-2026-005", date: "18 Jan 2026", 
      status: "Approved",
      materials: [
        { type: t1, description: "Bulk replenishment stock", qty: "100 kg", invoiceAmount: "₹2,00,000" }
      ],
      totalAmount: "₹2,00,000" 
    },
  ];
  return (
    <div style={{ padding: "40px 56px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ background: "transparent", border: `1px solid ${T.borderDef}`, padding: "10px 20px", borderRadius: 8, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Vendors
        </motion.button>
        <div style={{ display: "flex", gap: 10 }}>
          <StatusPill status={vendor.status} />
          <span style={{ fontFamily: F.mono, fontSize: 13, background: T.silkCream, border: `1px solid ${T.borderDef}`, padding: "5px 12px", borderRadius: 6, color: T.luxuryBrown, fontWeight: 600 }}>{vendor.id}</span>
        </div>
      </div>

      <FadeUp>
        <div style={{ background: `linear-gradient(135deg,${T.darkBurgundy},#1A040B)`, borderRadius: 20, border: "1.5px solid rgba(200,155,71,0.25)", padding: 32, color: "#FFF", marginBottom: 8, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 800, flexShrink: 0, boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>{vendor.initials}</div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>{vendor.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} color={T.antiqueGold} />{vendor.city}, {vendor.state}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}><Package size={13} color={T.antiqueGold} />{vendor.type}</span>
                <StarRating rating={vendor.rating} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>TOTAL SPEND</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.goldLight }}>₹{vendor.totalSpend}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>OUTSTANDING</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: vendor.outstanding !== "0" ? "#F87171" : T.goldLight }}>{vendor.outstanding === "0" ? "₹0" : `₹${vendor.outstanding}`}</div>
            </div>
          </div>
        </div>
      </FadeUp>

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
          {tab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Orders Ever", value: String(vendor.totalOrders), mono: false },
                  { label: "Total Spend", value: `₹${vendor.totalSpend}`, color: T.royalBurgundy },
                  { label: "Outstanding Balance", value: vendor.outstanding === "0" ? "₹0" : `₹${vendor.outstanding}`, color: vendor.outstanding !== "0" ? T.crimson : T.green },
                  { label: "Payment Terms", value: vendor.terms, mono: true },
                ].map(s => (
                  <div key={s.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: s.mono ? F.mono : F.display, fontSize: s.mono ? 20 : 26, fontWeight: 700, color: (s as any).color || T.luxuryBrown }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {vendor.notes && (
                <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "22px 26px", marginBottom: 16 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 10 }}>NOTES</div>
                  <p style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65, margin: 0 }}>{vendor.notes}</p>
                </div>
              )}
              <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>Recent Purchase Orders</div>
                </div>
                <PurchaseOrderHistoryTable orders={mockOrders.slice(0, 2)} />
              </div>
            </div>
          )}
          {tab === "orders" && (
            <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 12 }}>Full Purchase Order History</div>
                <DateFilterBar filter={orderDateFilter} onChange={setOrderDateFilter} />
              </div>
              <PurchaseOrderHistoryTable orders={mockOrders.filter(o => matchesDateFilter(o.date, orderDateFilter))} />
            </div>
          )}
          {tab === "contact" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Contact Person", value: vendor.contactName, Icon: Building2 },
                { label: "Phone", value: vendor.phone, Icon: Phone },
                { label: "WhatsApp", value: vendor.whatsapp || "—", Icon: Phone },
                { label: "GST Number", value: vendor.gstCode || "—", Icon: FileText },
                { label: "Bank Name", value: vendor.bankName || "—", Icon: IndianRupee },
                { label: "Account Number", value: vendor.accountNo || "—", Icon: IndianRupee },
              ].map(f => (
                <div key={f.label} style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>{f.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}><f.Icon size={14} color={T.royalBurgundy} /> {f.value}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Address</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{vendor.address || "—"}</div>
              </div>
              {vendor.notes && (
                <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 8 }}>Notes</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65 }}>{vendor.notes}</div>
                </div>
              )}
            </div>
          )}
          {tab === "edit" && (
            <div style={{ background: "#FFF", borderRadius: 14, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>Edit Profile</div>
                <button onClick={() => onUpdate?.(form)} style={{ padding: "8px 16px", background: T.royalBurgundy, color: "#FFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "none" }}>Save Changes</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={lbl}>Business Name *</label>
                    <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name of the business or shop" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Owner / Contact Name *</label>
                    <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Who to speak to at this business" style={inp} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Phone Number *</label>
                      <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Main contact number" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>WhatsApp Number</label>
                      <input value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="If different" style={inp} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>City *</label>
                      <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>State *</label>
                      <select value={form.state} onChange={e => set("state", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Material Type</label>
                      <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
                        {MATERIAL_TYPES.filter(t => t !== "All Types").map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Payment Terms *</label>
                      <select value={form.terms} onChange={e => set("terms", e.target.value)} style={{ ...inp, cursor: "pointer", backgroundColor: "#FFF" }}>
                        {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={lbl}>Business Address</label>
                    <textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address for delivery and billing" rows={3} style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Bank Name</label>
                      <input value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} placeholder="For any refunds" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Account Number</label>
                      <input value={form.accountNo || ""} onChange={e => set("accountNo", e.target.value)} placeholder="Account No." style={inp} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>GST Number</label>
                    <input value={form.gstCode} onChange={e => set("gstCode", e.target.value)} placeholder="15-digit GSTIN (e.g. 36AAAAA1111A1Z1)" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Notes</label>
                    <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions or supplier notes..." rows={3} style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All");

  const totalSpendVal = React.useMemo(() => {
    const total = vendors.reduce((acc, v) => acc + (parseFloat(v.totalSpend.replace(/,/g, "")) || 0), 0);
    return `₹${(total / 100000).toFixed(1)}L`;
  }, [vendors]);

  const spendByType = React.useMemo(() => {
    let warp = 0;
    let resham = 0;
    let jari = 0;
    vendors.forEach(v => {
      const spend = parseFloat(v.totalSpend.replace(/,/g, "")) || 0;
      const type = v.type.toLowerCase();
      if (type.startsWith("warp")) {
        warp += spend;
      } else if (type.startsWith("resham")) {
        resham += spend;
      } else if (type.startsWith("jari")) {
        jari += spend;
      } else {
        warp += spend;
      }
    });
    return [
      { name: "Warp", value: warp, fill: T.royalBurgundy },
      { name: "Resham", value: resham, fill: T.antiqueGold },
      { name: "Jari", value: jari, fill: T.green },
    ];
  }, [vendors]);

  const nextId = `VEN-${String(vendors.length + 1).padStart(3, "0")}`;
  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const mSearch = !q || v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.contactName.toLowerCase().includes(q);
    const mType = typeFilter === "All Types" || v.type.includes(typeFilter);
    const mStatus = statusFilter === "All" || v.status === statusFilter.toLowerCase();
    return mSearch && mType && mStatus;
  });

  if (selectedVendor) return <VendorProfile vendor={selectedVendor} onBack={() => setSelectedVendor(null)} onUpdate={(v) => { setVendors(prev => prev.map(old => old.id === v.id ? v : old)); setSelectedVendor(v); }} />;

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", paddingBottom: 100 }}>
      {/* Hero Header */}
      <div style={{ minHeight: 230, background: T.darkBurgundy, display: "flex", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: -100, width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(200,155,71,0.022) 48px,rgba(200,155,71,0.022) 49px)` }} />
        <div style={{ padding: "44px 56px 90px", display: "flex", width: "100%", alignItems: "flex-start", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},rgba(200,155,71,0))` }} />
              <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "2.5px", color: "rgba(200,155,71,0.82)", textTransform: "uppercase" as const, fontWeight: 600 }}>Since 1999 · Supplier Management</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
              <h1 style={{ fontFamily: F.display, fontSize: 52, color: "#FFFDF9", margin: 0, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.0 }}>Vendors</h1>
              <span style={{ fontFamily: F.display, fontSize: 30, color: T.antiqueGold, fontStyle: "italic", fontWeight: 400 }}>&amp; Supplier Registry</span>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.60)", margin: "6px 0 0", maxWidth: 540, lineHeight: 1.65 }}>Manage all raw material vendors. Track purchase history, payment terms, and outstanding amounts for every supplier.</p>
          </div>
          <motion.button onClick={() => setShowAddForm(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ alignSelf: "flex-start", padding: "13px 24px", background: `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})`, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.darkBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(200,155,71,0.35)", flexShrink: 0 }}>
            <Plus size={15} /> Add New Vendor
          </motion.button>
        </div>
      </div>

      {/* Stats Strip */}
      <div style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}>
        <div style={{ background: "linear-gradient(135deg,#5D1027 0%,#2C0913 100%)", borderRadius: 24, display: "flex", alignItems: "stretch", boxShadow: "0 24px 72px rgba(0,0,0,0.32),0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { icon: Building2, label: "Total Vendors", value: String(vendors.length), sub: "Active supplier relationships", hi: false },
            { icon: CheckCircle2, label: "Active Vendors", value: String(vendors.filter(v => v.status === "active").length), sub: "Currently supplying materials", hi: false },
            { icon: IndianRupee, label: "Total Spend", value: totalSpendVal, sub: "This year · All material types", hi: true },
            { icon: AlertTriangle, label: "Overdue Payments", value: String(vendors.filter(v => v.status === "overdue").length), sub: "Vendors awaiting settlement", hi: false },
            { icon: TrendingUp, label: "New This Year", value: "2", sub: "Recently onboarded vendors", hi: false },
          ].map((m, i, arr) => (
            <div key={m.label} style={{ flex: 1, padding: "26px 20px", background: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none", borderRight: i < arr.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.icon size={22} color={m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 7, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>{m.label}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 6 }}>{m.value}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)" }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <AddVendorModal
            nextId={nextId}
            onCancel={() => setShowAddForm(false)}
            onSave={v => { setVendors(p => [v, ...p]); setShowAddForm(false); }}
          />
        )}
      </AnimatePresence>

      {/* Analytics */}
      <div style={{ padding: "48px 56px 32px" }}>
        <FadeUp>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
            <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Vendor Analytics</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
            <div style={{ background: "#FFF", borderRadius: 20, border: `1.5px solid ${T.borderDef}`, padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)" }}>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 20 }}>Monthly Vendor Spend</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={spendByMonth} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RechartsTooltip formatter={(v: any) => [`₹${(v/100000).toFixed(1)}L`, "Spend"]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
                  <Bar dataKey="spend" fill={T.royalBurgundy} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#FFF", borderRadius: 20, border: `1.5px solid ${T.borderDef}`, padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)" }}>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 20 }}>Spend by Material Type</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={spendByType} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={32}>
                    {spendByType.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <RechartsTooltip formatter={(v: any) => [`₹${(v/100000).toFixed(1)}L`]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}` }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {spendByType.map(s => (
                  <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: s.fill }} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.name}</span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>₹{(s.value/100000).toFixed(1)}L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Directory */}
      <div style={{ padding: "0 56px" }}>
        <FadeUp>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Vendor Directory</h2>
            </div>
            <motion.button onClick={() => setShowAddForm(!showAddForm)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ padding: "10px 22px", background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(110,15,45,0.22)" }}>
              <Plus size={14} /> Add New Vendor
            </motion.button>
          </div>

          <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor name, city, or contact…"
                style={{ width: "100%", padding: "9px 12px 9px 38px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Active", "Overdue", "Inactive"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "8px 16px", borderRadius: 20, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: statusFilter === s ? T.royalBurgundy : "transparent", color: statusFilter === s ? "#FFF" : T.taupe, border: statusFilter === s ? "none" : `1.5px solid rgba(110,15,45,0.18)`, transition: "all 0.15s" }}>{s}</button>
              ))}
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: "9px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer", outline: "none" }}>
              {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {filtered.map((v, i) => (
              <FadeUp key={v.id} delay={i * 0.06}>
                <VendorCard vendor={v} onView={setSelectedVendor} />
              </FadeUp>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "60px 24px", textAlign: "center" }}>
                <Building2 size={44} color={T.taupe} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No vendors match your search or filter.</div>
              </div>
            )}
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
