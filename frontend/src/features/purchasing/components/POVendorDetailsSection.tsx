/* eslint-disable no-restricted-syntax */
import React from "react";
import { Package } from "lucide-react";
import { T, F, Vendor } from "./POTypesAndVendors";
import { Input, Button, Select, SelectItem } from "../../../shared/ui/primitives";
import { DatePicker, formatDate } from "../../../shared/ui/date";

interface POVendorDetailsSectionProps {
  vendors: Vendor[];
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
  labelStyle: React.CSSProperties;
  sectionTitleStyle: React.CSSProperties;
}

export function POVendorDetailsSection({
  vendors,
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
  labelStyle,
  sectionTitleStyle,
}: POVendorDetailsSectionProps) {
  return (
    <div>
      <div style={sectionTitleStyle}><Package size={15} color={T.royalBurgundy} /> Vendor Details</div>

      {/* Vendor dropdown */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle} htmlFor="vendor-name">Vendor Name *</label>
        <Select
          value={String(selectedVendorIdx)}
          onValueChange={val => {
            const v = parseInt(val);
            if (v === -99) { setShowAddVendor(true); return; }
            setSelectedVendorIdx(v);
            const sel = vendors[v];
            if (sel) {
              setVendorContact(sel.contactName || "");
            } else {
              setVendorContact("");
            }
            setErrors(prev => ({ ...prev, vendor: "" }));
          }}
          className="w-full"
        >
          <SelectItem value="-1">Select vendor…</SelectItem>
          {vendors.map((v, i) => (
            <SelectItem key={v.id} value={String(i)}>{v.name} · {v.city}</SelectItem>
          ))}
          <SelectItem value="-99">+ Add New Vendor</SelectItem>
        </Select>
        {errors.vendor && <div style={{ color: T.crimson, fontSize: 12, marginTop: 4 }}>{errors.vendor}</div>}
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
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.10)", padding: "2px 8px", borderRadius: 5 }}>{vendor.code || "VEN-XXX"}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>📍 {vendor.city}</span>
                </div>
              </div>
              <div style={{ background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 10px", flexShrink: 0 }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{vendor.terms || "Net 30"}</span>
              </div>
            </div>
            {/* Detail grid */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 0 }}>
              <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)`, borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Phone</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendor.phone || "—"}</div>
              </div>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Payment Terms</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendor.terms || "—"}</div>
              </div>
              <div style={{ padding: "12px 16px", borderRight: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>GST Number</div>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.5px" }}>{vendor.gstCode || "—"}</div>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>City</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendor.city || "—"}</div>
              </div>
            </div>
            {/* Contact Name */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(110,15,45,0.07)` }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Contact Name</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{vendorContact || "—"}</div>
            </div>
            {/* Address */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(110,15,45,0.07)`, background: "rgba(247,242,234,0.5)" }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe, marginBottom: 4 }}>Address</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.5 }}>{vendor.address || "—"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Add Vendor inline form */}
      {showAddVendor && (
        <div style={{ background: "rgba(200,155,71,0.06)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.antiqueGold, marginBottom: 10 }}>New Vendor Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 10 }}>
            {["Vendor Name", "City & State"].map(p => (
              <Input key={p} placeholder={p} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Button onClick={() => setShowAddVendor(false)} variant="secondary" size="sm" className="flex-1">Cancel</Button>
            <Button onClick={() => setShowAddVendor(false)} variant="primary" size="sm" className="flex-1">Add Vendor</Button>
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="expected-delivery-date">Expected Delivery Date *</label>
        <DatePicker
          id="expected-delivery-date"
          value={deliveryDate ? new Date(deliveryDate) : null}
          onChange={date => { setDeliveryDate(date ? formatDate(date, "iso") : ""); setErrors(prev => ({ ...prev, deliveryDate: "" })); }}
        />
        {errors.deliveryDate && <div style={{ color: T.crimson, fontSize: 12, marginTop: 4 }}>{errors.deliveryDate}</div>}
      </div>
    </div>
  );
}
