import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X as LucideX } from "lucide-react";
import { BulkOrder } from "../contexts/BulkOrderContext";
import { WholesaleCustomerSelectSection, WHOLESALE_CUSTOMERS } from "./WholesaleCustomerSelectSection";

const T = {
  royalBurgundy: "#6E0F2D", darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47", luxuryBrown: "#3B2314",
  taupe: "#8B7060", crimson: "#C0392B",
  warmIvory: "#FFFDF9",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

function formatDateLabel(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (order: BulkOrder) => void;
  nextRef: string;
  onAddCustomerClick?: () => void;
}

export function BulkOrderCreateModal({ open, onClose, onSubmit, nextRef, onAddCustomerClick }: Props) {
  const [customerId, setCustomerId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [visitingCard, setVisitingCard] = useState<File | null>(null);
  const [gstCode, setGstCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [photos, setPhotos] = useState<File[]>([]);

  const selectedCustomer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId);

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const selected = WHOLESALE_CUSTOMERS.find(c => c.id === id);
    if (selected) {
      setAddress(selected.address || "");
      setPhone(selected.phone || "");
      setGstCode(selected.gstCode || "");
    } else {
      setAddress("");
      setPhone("");
      setGstCode("");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customerId = "Please select a wholesale customer";
    if (!quantity || parseInt(quantity, 10) < 1) e.quantity = "Quantity must be at least 1";
    if (!deliveryDate) e.deliveryDate = "Please select a delivery deadline";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const customer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId)!;
    const order: BulkOrder = {
      ref: nextRef,
      customer: customer.name,
      customerId: customer.id,
      due: formatDateLabel(deliveryDate),
      status: "on-track",
      sareeType: "",
      design: "",
      done: 0,
      total: parseInt(quantity, 10),
      instructions: instructions || undefined,
      createdDate: new Date().toISOString().split("T")[0],
      dispatchStatus: "pending",
      paymentStatus: "pending",
      amountDue: estimatedValue ? parseInt(estimatedValue, 10) : 0,
      amountPaid: 0,
      address: address || undefined,
      phone: phone || undefined,
      gstCode: gstCode || undefined,
      visitingCardUrl: visitingCard ? URL.createObjectURL(visitingCard) : undefined,
      visitingCardName: visitingCard ? visitingCard.name : undefined,
      photoUrls: photos.map(p => URL.createObjectURL(p)),
    };
    onSubmit(order);
    setCustomerId(""); setAddress(""); setPhone(""); setVisitingCard(null); setGstCode("");
    setPhotos([]);
    setQuantity(""); setDeliveryDate(""); setEstimatedValue(""); setInstructions(""); setPriority("Normal"); setErrors({});
  };

  const today = new Date();
  const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 44, border: `1px solid ${T.borderDef}`, borderRadius: 10,
    padding: "0 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
    background: T.warmIvory, outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6, display: "block",
  };

  const errStyle: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 12, color: T.crimson, marginTop: 4,
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.taupe,
    textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16,
    paddingBottom: 8, borderBottom: `1px solid ${T.borderDef}`,
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 1500,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, overflowY: "auto",
          }}
        >
          <motion.div
            initial={{ y: 20, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.96 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 680,
              background: "#FFFFFF",
              borderRadius: 20,
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
              overflow: "hidden",
              maxHeight: "90vh",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              background: `linear-gradient(100deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`,
              padding: "22px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9" }}>
                  Create Bulk Order
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, marginTop: 4 }}>
                  New wholesale customer order · {nextRef}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <LucideX size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: "28px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Section 1 — Customer */}
              <WholesaleCustomerSelectSection
                customerId={customerId}
                handleCustomerSelect={handleCustomerSelect}
                errors={errors}
                selectedCustomer={selectedCustomer}
                onClose={onClose}
                onAddCustomerClick={onAddCustomerClick}
              />

              {/* Section 2 — Order Details */}
              <div>
                <div style={sectionLabel}>2 · Order Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Order Photos (Multiple allowed)</label>
                    <div style={{ border: `1.5px dashed ${T.borderDef}`, borderRadius: 12, padding: "14px 16px", background: T.warmIvory, display: "flex", flexDirection: "column", gap: 12 }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        id="bulk-order-photos-upload"
                        style={{ display: "none" }}
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          setPhotos(prev => [...prev, ...files]);
                        }}
                      />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {photos.map((file, idx) => (
                          <div key={idx} style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
                            <img src={URL.createObjectURL(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button
                              type="button"
                              onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                              style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: "rgba(61,14,26,0.8)", border: "none", color: "#FFF", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label htmlFor="bulk-order-photos-upload" style={{ width: 72, height: 72, borderRadius: 10, border: `1.5px dashed ${T.borderDef}`, background: "rgba(110,15,45,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <span style={{ fontSize: 20, color: T.royalBurgundy, fontWeight: 300 }}>+</span>
                          <span style={{ fontSize: 9, color: T.taupe, fontWeight: 600 }}>Add Photo</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Quantity (sarees)</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      placeholder="e.g. 40"
                      style={{ ...inputStyle, borderColor: errors.quantity ? T.crimson : T.borderDef }}
                    />
                    {errors.quantity && <div style={errStyle}>{errors.quantity}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>Delivery Deadline</label>
                    <input
                      type="date"
                      min={minDate}
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      style={{ ...inputStyle, borderColor: errors.deliveryDate ? T.crimson : T.borderDef }}
                    />
                    {errors.deliveryDate && <div style={errStyle}>{errors.deliveryDate}</div>}
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Estimated Value (₹)</label>
                    <input
                      type="number"
                      value={estimatedValue}
                      onChange={e => setEstimatedValue(e.target.value)}
                      placeholder="Enter estimated value"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3 — Additional */}
              <div>
                <div style={sectionLabel}>3 · Additional</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Special Instructions (Optional)</label>
                    <textarea
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      placeholder="Any special production or packaging instructions..."
                      style={{ ...inputStyle, height: 80, resize: "vertical", paddingTop: 10, paddingBottom: 10 } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <div style={{ display: "flex", gap: 16 }}>
                      {(["Normal", "Urgent"] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          style={{
                            display: "flex", alignItems: "center", gap: 9, padding: "10px 20px",
                            borderRadius: 10,
                            border: `1.5px solid ${priority === p ? (p === "Urgent" ? T.crimson : T.royalBurgundy) : T.borderDef}`,
                            background: priority === p ? (p === "Urgent" ? "rgba(192,57,43,0.07)" : "rgba(110,15,45,0.07)") : T.warmIvory,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: `2px solid ${priority === p ? (p === "Urgent" ? T.crimson : T.royalBurgundy) : T.taupe}`,
                            background: priority === p ? (p === "Urgent" ? T.crimson : T.royalBurgundy) : "transparent",
                          }} />
                          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: priority === p ? (p === "Urgent" ? T.crimson : T.royalBurgundy) : T.luxuryBrown }}>
                            {p}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: "20px 28px", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", height: 52,
                  background: T.royalBurgundy, border: "none", borderRadius: 12,
                  fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: "#FFFDF9",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: "0 4px 16px rgba(110,15,45,0.30)",
                }}
              >
                ✓ Create Bulk Order
              </motion.button>
              <motion.button
                onClick={onClose}
                whileHover={{ background: "rgba(110,15,45,0.05)" }}
                style={{
                  width: "100%", height: 44,
                  background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 12,
                  fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe,
                  cursor: "pointer",
                }}
              >
                × Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
