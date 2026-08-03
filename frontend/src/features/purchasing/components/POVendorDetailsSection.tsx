import React from "react";
import { motion } from "motion/react";
import { Package } from "lucide-react";
import { T, F, VENDORS, Vendor } from "./POTypesAndVendors";

interface POVendorDetailsSectionProps {
  selectedVendorIdx: number;
  setSelectedVendorIdx: (idx: number) => void;
  vendorContact: string;
  setVendorContact: (c: string) => void;
  vendor: Vendor | null;
  deliveryDate: string;
  setDeliveryDate: (d: string) => void;
  showAddVendor: boolean;
  setShowAddVendor: (v: boolean) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  sectionTitleStyle: React.CSSProperties;
}

export function POVendorDetailsSection({
  selectedVendorIdx,
  setSelectedVendorIdx,
  vendorContact,
  setVendorContact,
  vendor,
  deliveryDate,
  setDeliveryDate,
  showAddVendor,
  setShowAddVendor,
  errors,
  setErrors,
  inputStyle,
  labelStyle,
  sectionTitleStyle,
}: POVendorDetailsSectionProps) {
  return (
    <div>
      <div style={sectionTitleStyle}><Package size={15} color={T.royalBurgundy} /> Vendor Details</div>

      {/* Vendor dropdown */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Vendor Name *</label>
        <select
          value={selectedVendorIdx}
          onChange={e => {
            const v = parseInt(e.target.value);
            if (v === -99) { setShowAddVendor(true); return; }
            setSelectedVendorIdx(v);
            const sel = VENDORS[v];
            if (sel) {
              setVendorContact(sel.contactName || "");
            } else {
              setVendorContact("");
            }
            setErrors(prev => ({ ...prev, vendor: "" }));
          }}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value={-1}>Select vendor…</option>
          {VENDORS.map((v, i) => (
            <option key={i} value={i}>{v.name} · {v.city}</option>
          ))}
          <option value={-99} style={{ color: T.antiqueGold }}>+ Add New Vendor</option>
        </select>
        {errors.vendor && <div style={{ color: T.crimson, fontSize: 11.5, marginTop: 4 }}>{errors.vendor}</div>}
        {vendor && (
          <div style={{ marginTop: 14, background: "linear-gradient(135deg, rgba(110,15,45,0.04) 0%, rgba(110,15,45,0.02) 100%)", border: `1.5px solid rgba(110,15,45,0.14)`, borderRadius: 14, overflow: "hidden" }}>
            {/* Vendor header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid rgba(110,15,45,0.09)`, background: "rgba(110,15,45,0.06)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(110,15,45,0.25)" }}>
                <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 800, color: "#FFF" }}>{vendor.name.charAt(0)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown, lineHeight: 1.2 }}>{vendor.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.10)", padding: "2px 8px", borderRadius: 5 }}>{vendor.id || "VEN-XXX"}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>📍 {vendor.city}</span>
                </div>
              </div>
              <div style={{ background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 10px", flexShrink: 0 }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.antiqueGold }}>{vendor.terms || "Net 30"}</span>
              </div>
            </div>
            {/* Detail grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)`, borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Phone</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendor.phone || "—"}</div>
              </div>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Payment Terms</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendor.terms || "—"}</div>
              </div>
              <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>GST Number</div>
                <div style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.5px" }}>{vendor.gstCode || "—"}</div>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>City</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendor.city || "—"}</div>
              </div>
            </div>
            {/* Contact Name */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Contact Name</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendorContact || "—"}</div>
            </div>
            {/* Address */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(110,15,45,0.07)`, background: "rgba(247,242,234,0.5)" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Address</div>
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.5 }}>{vendor.address || "—"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Add Vendor inline form */}
      {showAddVendor && (
        <div style={{ background: "rgba(200,155,71,0.06)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.antiqueGold, marginBottom: 10 }}>New Vendor Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {["Vendor Name", "City & State"].map(p => (
              <input key={p} placeholder={p} style={{ ...inputStyle, fontSize: 12.5 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <motion.button onClick={() => setShowAddVendor(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Cancel</motion.button>
            <motion.button onClick={() => setShowAddVendor(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: T.antiqueGold, cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown }}>Add Vendor</motion.button>
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Expected Delivery Date *</label>
        <input
          type="date"
          value={deliveryDate}
          min={(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0]; })()}
          onChange={e => { setDeliveryDate(e.target.value); setErrors(prev => ({ ...prev, deliveryDate: "" })); }}
          style={inputStyle}
        />
        {errors.deliveryDate && <div style={{ color: T.crimson, fontSize: 11.5, marginTop: 4 }}>{errors.deliveryDate}</div>}
      </div>
    </div>
  );
}
