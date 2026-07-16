import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2, Package, FileText, ClipboardList, Building2 } from "lucide-react";
import { PurchaseOrder, POItem } from "./POContext";
import { useFirms } from "./FirmsContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  crimson:       "#C0392B",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ─── Vendors ──────────────────────────────────────────────────────────────────
const VENDORS = [
  { name: "Sri Venkateswara Textiles", city: "Ongole, AP",       type: "Warp" },
  { name: "Lakshmi Thread House",      city: "Chennai, TN",      type: "Warp / Resham" },
  { name: "Kanchipuram Silks",         city: "Kanchipuram, TN",  type: "Resham" },
  { name: "Mysore Silk Co.",           city: "Mysore, KA",       type: "Resham / Warp" },
  { name: "Surat Zari Works",          city: "Surat, GJ",        type: "Jari" },
  { name: "Varanasi Zari House",       city: "Varanasi, UP",     type: "Jari" },
];

// ─── Empty material row ───────────────────────────────────────────────────────
function emptyItem(): POItem & { _key: number; quantityGm: number } {
  return {
    _key: Date.now() + Math.random(),
    materialType: "Warp",
    subtype: "",
    description: "",
    quantity: 0,
    quantityGm: 0,
    unit: "kg",
    pricePerUnit: 0,
    subtotal: 0,
  };
}

type ExtItem = POItem & { _key: number; quantityGm: number };

// ─── PO Document Preview ──────────────────────────────────────────────────────
function PODocPreview({
  vendor,
  vendorCity,
  vendorContact,
  firmName,
  deliveryDate,
  materials,
  poNumber,
  notesVendor,
  urgency,
  today,
}: {
  vendor: string;
  vendorCity: string;
  vendorContact?: string;
  firmName?: string;
  deliveryDate: string;
  materials: ExtItem[];
  poNumber: string;
  notesVendor?: string;
  urgency: string;
  today: string;
}) {
  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 12,
      border: `1.5px solid ${T.borderDef}`,
      overflow: "hidden",
      fontSize: 12,
      fontFamily: F.ui,
    }}>
      {/* Header strip */}
      <div style={{
        background: T.darkBurgundy,
        padding: "14px 18px",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: "#FFFDF9", marginBottom: 2 }}>
          🪷 Beere Kesava &amp; Brothers Silks
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px" }}>Est. 1999</div>
        <div style={{ fontFamily: F.ui, fontSize: 10, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>
          Guntur, Andhra Pradesh · India
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Reference row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${T.borderDef}` }}>
          <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.royalBurgundy, fontWeight: 700 }}>
            Purchase Order No: {poNumber || "PO-2026-—"}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>Date: {today}</span>
        </div>

        {/* Purchasing Firm */}
        {firmName && (
          <div style={{ marginBottom: 10, background: "rgba(200,155,71,0.07)", border: `1px solid ${T.borderGold}`, borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, fontWeight: 500, marginBottom: 2 }}>Purchasing Firm:</div>
            <div style={{ fontFamily: F.display, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{firmName}</div>
          </div>
        )}

        {/* Vendor block */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, fontWeight: 500, marginBottom: 2 }}>Vendor:</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>
            {vendor || "—"}
          </div>
          {(vendorCity || vendorContact) && (
            <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 2 }}>
              {[vendorCity, vendorContact].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>

        {/* Delivery */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, fontWeight: 500 }}>Expected Delivery: </span>
          <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.luxuryBrown }}>{deliveryDate || "—"}</span>
          {urgency === "Urgent" && (
            <span style={{ marginLeft: 8, fontFamily: F.mono, fontSize: 9, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 7px", borderRadius: 4 }}>
              🔴 URGENT
            </span>
          )}
        </div>

        {/* Materials table — no price columns */}
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.8fr", background: T.silkCream, padding: "7px 10px", gap: 6 }}>
            {["Material", "Description", "Qty / Unit"].map(h => (
              <span key={h} style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>
          {materials.length === 0 ? (
            <div style={{ padding: "10px 12px", fontFamily: F.ui, fontSize: 11, color: T.taupe, fontStyle: "italic" }}>No materials added yet</div>
          ) : materials.map((m, i) => (
            <div key={m._key} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.8fr", padding: "8px 10px", gap: 6, background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory, borderTop: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.luxuryBrown, fontWeight: 600 }}>{m.materialType}</span>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, wordBreak: "break-word" }}>{m.description || "—"}</span>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{m.quantity || 0} {m.unit}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {notesVendor && (
          <div style={{ marginBottom: 10, background: T.silkCream, borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, fontWeight: 500, marginBottom: 3 }}>Instructions:</div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.luxuryBrown }}>{notesVendor}</div>
          </div>
        )}

        {/* Signature block */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
          {["Prepared by", "Approved by"].map(s => (
            <div key={s}>
              <div style={{ height: 24, borderBottom: `1.5px solid ${T.borderDef}`, marginBottom: 5 }} />
              <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe }}>{s}: _____________</div>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, marginTop: 2 }}>{s === "Prepared by" ? "Admin" : "Superadmin"}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 14, paddingTop: 10, borderTop: `1px solid ${T.borderDef}` }}>
          <div style={{ fontFamily: F.ui, fontSize: 9.5, color: T.taupe }}>Beere Kesava &amp; Brothers Silks · Est. 1999</div>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, color: T.antiqueGold, marginTop: 2, letterSpacing: "1px" }}>Tradition · Trust · Timeless Quality</div>
        </div>
      </div>
    </div>
  );
}

// ─── Material row component ───────────────────────────────────────────────────
function MaterialRow({
  item,
  onChange,
  onRemove,
  canRemove,
  errors,
}: {
  item: ExtItem;
  onChange: (updated: ExtItem) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors: Record<string, string>;
}) {
  const inputStyle: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
    border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8,
    padding: "8px 10px", outline: "none", background: T.warmIvory,
    width: "100%", boxSizing: "border-box" as const,
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  const set = (k: keyof ExtItem, v: unknown) => {
    const updated = { ...item, [k]: v } as ExtItem;
    // Reset unit when type changes
    if (k === "materialType") {
      updated.unit = v === "Jari" ? "Buns" : "kg";
    }
    onChange(updated);
  };

  return (
    <div style={{
      background: T.warmIvory,
      border: `1.5px solid ${T.borderDef}`,
      borderRadius: 12,
      padding: "16px 18px",
      position: "relative",
    }}>
      {canRemove && (
        <button
          onClick={onRemove}
          style={{
            position: "absolute", top: 10, right: 12,
            background: "none", border: "none", cursor: "pointer",
            color: T.taupe, display: "flex", alignItems: "center",
          }}
        >
          <Trash2 size={15} color={T.crimson} />
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, alignItems: "start" }}>
        {/* Material Type */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>Type *</label>
          <select value={item.materialType} onChange={e => set("materialType", e.target.value)} style={selectStyle}>
            <option value="Warp">Warp</option>
            <option value="Resham">Resham</option>
            <option value="Jari">Jari</option>
          </select>
          {errors[`mat-${item._key}-type`] && <div style={{ color: T.crimson, fontSize: 11, marginTop: 3 }}>{errors[`mat-${item._key}-type`]}</div>}
        </div>

        {/* Description */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>Description</label>
          <textarea
            value={item.description ?? ""}
            onChange={e => set("description", e.target.value)}
            placeholder="Color, grade, subtype, quality notes..."
            rows={2}
            style={{ ...inputStyle, resize: "none" as const }}
          />
        </div>

        {/* Quantity */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>
            Quantity * {item.materialType !== "Jari" ? "(kg + g)" : ""}
          </label>
          {item.materialType === "Jari" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 2 }}>
                {["Buns", "Reels"].map(u => (
                  <button key={u} onClick={() => set("unit", u)} style={{
                    flex: 1, padding: "7px 4px", borderRadius: 7, cursor: "pointer",
                    fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                    background: item.unit === u ? T.royalBurgundy : T.warmIvory,
                    color: item.unit === u ? "#FFFDF9" : T.taupe,
                    border: item.unit === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="number" min={0}
                  value={item.quantity || ""}
                  onChange={e => set("quantity", parseFloat(e.target.value) || 0)}
                  style={{ ...inputStyle, paddingRight: 44 }} placeholder="0"
                />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy }}>{item.unit}</span>
              </div>
              {item.quantity > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.antiqueGold }}>
                  = {item.unit === "Reels" ? `${Math.round(item.quantity / 4)} Buns` : `${Math.round(item.quantity * 4)} Reels`}
                  <span style={{ color: T.taupe }}> (1 Bun = 4 Reels)</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 2 }}>
                {["kg", "g"].map(u => (
                  <button key={u} onClick={() => set("unit", u)} style={{
                    flex: 1, padding: "7px 4px", borderRadius: 7, cursor: "pointer",
                    fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                    background: item.unit === u ? T.royalBurgundy : T.warmIvory,
                    color: item.unit === u ? "#FFFDF9" : T.taupe,
                    border: item.unit === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="number" min={0}
                  value={item.quantity || ""}
                  onChange={e => set("quantity", parseFloat(e.target.value) || 0)}
                  style={{ ...inputStyle, paddingRight: 32 }} placeholder="0"
                />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy }}>{item.unit}</span>
              </div>
              {item.quantity > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.antiqueGold, fontWeight: 600 }}>
                  = {item.unit === "kg" ? `${(item.quantity * 1000).toFixed(0)} g` : `${(item.quantity / 1000).toFixed(3)} kg`}
                </div>
              )}
            </div>
          )}
          {errors[`mat-${item._key}-qty`] && <div style={{ color: T.crimson, fontSize: 11, marginTop: 3 }}>{errors[`mat-${item._key}-qty`]}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface POCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (po: PurchaseOrder) => void;
  nextPONumber: string;
}

export function POCreateModal({ open, onClose, onSubmit, nextPONumber }: POCreateModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const todayDisplay = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const { firms } = useFirms();

  const [selectedFirmId, setSelectedFirmId] = useState("");
  const [selectedVendorIdx, setSelectedVendorIdx] = useState<number>(-1);
  const [vendorContact, setVendorContact] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [materials, setMaterials] = useState<ExtItem[]>([{ ...emptyItem() }]);
  const [poNumber, setPoNumber] = useState(nextPONumber);
  const [notesVendor, setNotesVendor] = useState("");
  const [notesAdmin, setNotesAdmin] = useState("");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddVendor, setShowAddVendor] = useState(false);

  // Sync PO number when prop changes
  useEffect(() => {
    setPoNumber(nextPONumber);
  }, [nextPONumber]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedFirmId("");
      setSelectedVendorIdx(-1);
      setVendorContact("");
      setDeliveryDate("");
      setMaterials([{ ...emptyItem() }]);
      setPoNumber(nextPONumber);
      setNotesVendor("");
      setNotesAdmin("");
      setUrgency("Normal");
      setErrors({});
      setShowAddVendor(false);
    }
  }, [open, nextPONumber]);

  const vendor = selectedVendorIdx >= 0 ? VENDORS[selectedVendorIdx] : null;
  const selectedFirm = firms.find(f => f.id === selectedFirmId) ?? null;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedFirmId) e.firm = "Please select a purchasing firm";
    if (!vendor) e.vendor = "Please select a vendor";
    if (!deliveryDate) e.deliveryDate = "Please select a delivery date";
    materials.forEach(m => {
      if (!m.quantity || m.quantity <= 0) e[`mat-${m._key}-qty`] = "Required";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const po: PurchaseOrder = {
      id: poNumber,
      poNumber,
      vendor: vendor!.name,
      vendorCity: vendor!.city,
      vendorContact: vendorContact || undefined,
      firmName: selectedFirm?.firmName,
      deliveryDate,
      materials: materials.map(m => ({
        materialType: m.materialType,
        subtype: m.subtype,
        description: m.description,
        quantity: m.quantity,
        unit: m.unit,
        pricePerUnit: 0,
        subtotal: 0,
      })),
      totalValue: 0,
      notesVendor: notesVendor || undefined,
      notesAdmin: notesAdmin || undefined,
      urgency,
      status: "pending",
      submittedDate: today,
      raisedBy: "Admin (BK)",
    };
    onSubmit(po);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown,
    border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10,
    padding: "10px 14px", outline: "none", background: T.warmIvory, boxSizing: "border-box" as const,
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe,
    letterSpacing: "0.3px", marginBottom: 6, display: "block",
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown,
    marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.borderDef}`,
    display: "flex", alignItems: "center", gap: 8,
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
            zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFDF9",
              borderRadius: 16,
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              width: "100%",
              maxWidth: 920,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              background: T.darkBurgundy,
              padding: "20px 28px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", marginBottom: 4 }}>
                  Create Purchase Order
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, letterSpacing: "0.5px" }}>
                  New material request to vendor — requires Superadmin approval
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.18)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                <X size={18} color="#FFFDF9" />
              </motion.button>
            </div>

            {/* Body: two panels */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* LEFT PANEL — Form */}
              <div style={{
                width: "55%",
                overflowY: "auto",
                padding: "24px 28px",
                borderRight: `1px solid ${T.borderDef}`,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}>

                {/* PURCHASING FIRM */}
                <div>
                  <div style={sectionTitleStyle}><Building2 size={15} color={T.royalBurgundy} /> Purchasing Firm</div>
                  <div>
                    <label style={labelStyle}>Firm Name *</label>
                    <select
                      value={selectedFirmId}
                      onChange={e => {
                        setSelectedFirmId(e.target.value);
                        setErrors(prev => ({ ...prev, firm: "" }));
                      }}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select purchasing firm…</option>
                      {firms.map(f => (
                        <option key={f.id} value={f.id}>{f.firmName}</option>
                      ))}
                    </select>
                    {errors.firm && <div style={{ color: T.crimson, fontSize: 11.5, marginTop: 4 }}>{errors.firm}</div>}
                    {selectedFirm && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, background: "rgba(200,155,71,0.10)", padding: "3px 10px", borderRadius: 6 }}>{selectedFirm.firmName}</span>
                        {selectedFirm.gstNumber && (
                          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: T.silkCream, padding: "3px 10px", borderRadius: 6 }}>GST: {selectedFirm.gstNumber}</span>
                        )}
                        {selectedFirm.bankName && (
                          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: T.silkCream, padding: "3px 10px", borderRadius: 6 }}>{selectedFirm.bankName}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* VENDOR DETAILS */}
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
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "3px 10px", borderRadius: 6 }}>{vendor.name}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: T.silkCream, padding: "3px 10px", borderRadius: 6 }}>{vendor.city}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, background: "rgba(200,155,71,0.10)", padding: "3px 10px", borderRadius: 6 }}>{vendor.type}</span>
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Vendor Contact Name</label>
                      <input value={vendorContact} onChange={e => setVendorContact(e.target.value)} placeholder="Contact person (optional)" style={inputStyle} />
                    </div>
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
                </div>

                {/* MATERIALS */}
                <div>
                  <div style={sectionTitleStyle}><FileText size={15} color={T.royalBurgundy} /> Materials to Order</div>
                  <p style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, margin: "0 0 14px", lineHeight: 1.5 }}>
                    What materials are you ordering from this vendor?
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {materials.map(m => (
                      <MaterialRow
                        key={m._key}
                        item={m}
                        onChange={updated => setMaterials(prev => prev.map(x => x._key === m._key ? updated : x))}
                        onRemove={() => setMaterials(prev => prev.filter(x => x._key !== m._key))}
                        canRemove={materials.length > 1}
                        errors={errors}
                      />
                    ))}
                  </div>
                  <motion.button
                    onClick={() => setMaterials(prev => [...prev, { ...emptyItem(), _key: Date.now() }])}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      marginTop: 12, width: "100%", padding: "11px 0",
                      borderRadius: 10, cursor: "pointer",
                      fontFamily: F.ui, fontWeight: 600, fontSize: 13,
                      background: "transparent", color: T.antiqueGold,
                      border: `1.5px dashed ${T.borderGold}`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}
                  >
                    <Plus size={15} /> Add Another Material
                  </motion.button>
                </div>

                {/* ADDITIONAL DETAILS */}
                <div>
                  <div style={sectionTitleStyle}><ClipboardList size={15} color={T.royalBurgundy} /> Additional Details</div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>PO Number</label>
                    <input value={poNumber} onChange={e => setPoNumber(e.target.value)} style={{ ...inputStyle, fontFamily: F.mono }} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Notes for Vendor (optional)</label>
                    <textarea
                      value={notesVendor}
                      onChange={e => setNotesVendor(e.target.value)}
                      placeholder="Any special instructions for this order..."
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Notes for Superadmin (optional)</label>
                    <textarea
                      value={notesAdmin}
                      onChange={e => setNotesAdmin(e.target.value)}
                      placeholder="Why is this order needed..."
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label style={labelStyle}>Urgency</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {(["Normal", "Urgent"] as const).map(u => (
                        <label key={u} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, color: urgency === u ? T.luxuryBrown : T.taupe, fontWeight: urgency === u ? 600 : 400 }}>
                          <input
                            type="radio"
                            value={u}
                            checked={urgency === u}
                            onChange={() => setUrgency(u)}
                            style={{ accentColor: T.royalBurgundy }}
                          />
                          {u === "Normal" ? "Normal" : "🔴 Urgent — Low Stock"}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: "100%", height: 52, borderRadius: 11, cursor: "pointer",
                      fontFamily: F.ui, fontWeight: 700, fontSize: 14.5,
                      background: T.royalBurgundy, color: "#FFFDF9", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <ClipboardList size={17} /> Submit for Superadmin Approval
                  </motion.button>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: "100%", height: 44, borderRadius: 10, cursor: "pointer",
                      fontFamily: F.ui, fontWeight: 500, fontSize: 13.5,
                      background: "transparent", color: T.taupe,
                      border: `1.5px solid rgba(110,15,45,0.18)`,
                    }}
                  >
                    × Cancel
                  </motion.button>
                </div>
              </div>

              {/* RIGHT PANEL — Preview */}
              <div style={{
                width: "45%",
                overflowY: "auto",
                padding: "24px 22px",
                background: T.silkCream,
              }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe, textAlign: "center", marginBottom: 14, letterSpacing: "0.4px", textTransform: "uppercase" }}>
                  PO Document Preview
                </div>
                <PODocPreview
                  vendor={vendor?.name || ""}
                  vendorCity={vendor?.city || ""}
                  vendorContact={vendorContact}
                  firmName={selectedFirm?.firmName}
                  deliveryDate={deliveryDate}
                  materials={materials}
                  poNumber={poNumber}
                  notesVendor={notesVendor}
                  urgency={urgency}
                  today={todayDisplay}
                />
                <div style={{ marginTop: 14, fontFamily: F.ui, fontSize: 11, color: T.taupe, textAlign: "center", fontStyle: "italic" }}>
                  This preview updates live as you fill the form
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
