import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, FileText, ClipboardList, Building2 } from "lucide-react";
import { PurchaseOrder } from "../contexts/POContext";
import { useFirms } from "../../firms/contexts/FirmsContext";
import { T, F, VENDORS, ExtItem, emptyItem } from "./POTypesAndVendors";
import { PODocPreview } from "./PODocPreview";
import { POMaterialRow } from "./POMaterialRow";
import { POVendorDetailsSection } from "./POVendorDetailsSection";

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
                <POVendorDetailsSection
                  selectedVendorIdx={selectedVendorIdx}
                  setSelectedVendorIdx={setSelectedVendorIdx}
                  vendorContact={vendorContact}
                  setVendorContact={setVendorContact}
                  vendor={vendor}
                  deliveryDate={deliveryDate}
                  setDeliveryDate={setDeliveryDate}
                  showAddVendor={showAddVendor}
                  setShowAddVendor={setShowAddVendor}
                  errors={errors}
                  setErrors={setErrors}
                  inputStyle={inputStyle}
                  labelStyle={labelStyle}
                  sectionTitleStyle={sectionTitleStyle}
                />

                {/* MATERIALS */}
                <div>
                  <div style={sectionTitleStyle}><FileText size={15} color={T.royalBurgundy} /> Materials to Order</div>
                  <p style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, margin: "0 0 14px", lineHeight: 1.5 }}>
                    What materials are you ordering from this vendor?
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {materials.map(m => (
                      <POMaterialRow
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
