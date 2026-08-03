import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Plus, Printer, Package, ArrowRight, CheckCircle2 } from "lucide-react";
import { T, F } from "../theme";
import { STATUS_CFG, MAT_TAG } from "../data";
import type { BatchRow } from "../types";
import { ModalOverlay, ModalHeader } from "../common/primitives";

// ─── ADD NEW STOCK MODAL ──────────────────────────────────────────────────────
export function AddNewStockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    materialType: "Warp",
    details: "",
    vendor: "",
    receivedDate: "",
    quantity: "",
    quantityGm: "",
    jariUnit: "Reels" as "Reels" | "Buns",
    warpReshamUnit: "kg" as "kg" | "g",
    pricePerKg: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.details || !form.vendor || !form.receivedDate || !form.quantity) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); setForm({ materialType: "Warp", details: "", vendor: "", receivedDate: "", quantity: "", quantityGm: "", jariUnit: "Reels", warpReshamUnit: "kg", pricePerKg: "", notes: "" }); }, 1800);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
    border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10,
    padding: "11px 14px", outline: "none", background: T.warmIvory, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe,
    letterSpacing: "0.3px", marginBottom: 6, display: "block",
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Add New Stock" subtitle="Record a new material delivery from a vendor" onClose={onClose} />
      <div style={{ padding: "28px 28px 24px" }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,102,64,0.12)", border: "2px solid rgba(30,102,64,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Check size={32} color={T.green} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.green, marginBottom: 8 }}>Stock Added Successfully!</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>The new batch has been recorded and is now in the system.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={labelStyle}>Material Type *</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Warp", "Resham", "Jari"].map(t => (
                  <motion.button
                    key={t}
                    onClick={() => set("materialType", t)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                      fontFamily: F.ui, fontWeight: 700, fontSize: 14,
                      background: form.materialType === t ? T.royalBurgundy : T.warmIvory,
                      color: form.materialType === t ? "#FFFDF9" : T.taupe,
                      border: form.materialType === t ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                    }}
                  >{t}</motion.button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle} htmlFor="material-details">Material Details *</label>
                <input id="material-details" value={form.details} onChange={e => set("details", e.target.value)} placeholder="e.g. Cotton/Silk, Silk Red, Polyester 2G Gold" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="vendor-name">Vendor Name *</label>
                <input id="vendor-name" value={form.vendor} onChange={e => set("vendor", e.target.value)} placeholder="e.g. Sri Venkateswara Textiles" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle} htmlFor="date-received">Date Received *</label>
                <input id="date-received" type="date" value={form.receivedDate} onChange={e => set("receivedDate", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>
                  {form.materialType === "Jari" ? `Quantity (${form.jariUnit}) *` : `Quantity Received (${form.warpReshamUnit || "kg"}) *`}
                </label>
                {form.materialType === "Jari" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      {(["Reels", "Buns"] as const).map(u => (
                        <button key={u} onClick={() => set("jariUnit", u)} style={{
                          flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
                          fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                          background: form.jariUnit === u ? T.royalBurgundy : T.warmIvory,
                          color: form.jariUnit === u ? "#FFFDF9" : T.taupe,
                          border: form.jariUnit === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                        }}>{u}</button>
                      ))}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" style={{ ...inputStyle, paddingRight: 52 }} />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{form.jariUnit}</span>
                    </div>
                    {form.quantity && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold }}>
                        = {form.jariUnit === "Reels" ? `${Math.round(parseFloat(form.quantity) / 4)} Buns` : `${Math.round(parseFloat(form.quantity) * 4)} Reels`} <span style={{ color: T.taupe }}>(1 Bun = 4 Reels)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      {(["kg", "g"] as const).map(u => (
                        <button key={u} onClick={() => set("warpReshamUnit", u)} style={{
                          flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
                          fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                          background: (form.warpReshamUnit || "kg") === u ? T.royalBurgundy : T.warmIvory,
                          color: (form.warpReshamUnit || "kg") === u ? "#FFFDF9" : T.taupe,
                          border: (form.warpReshamUnit || "kg") === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                        }}>{u}</button>
                      ))}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{form.warpReshamUnit || "kg"}</span>
                    </div>
                    {form.quantity && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>
                        = {(form.warpReshamUnit || "kg") === "kg" ? `${(parseFloat(form.quantity) * 1000).toFixed(0)} g` : `${(parseFloat(form.quantity) / 1000).toFixed(3)} kg`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="price-per-kg">Price Per Kg (₹)</label>
              <input id="price-per-kg" type="number" value={form.pricePerKg} onChange={e => set("pricePerKg", e.target.value)} placeholder="e.g. 280" style={inputStyle} />
              {form.quantity && form.pricePerKg && (
                <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, fontWeight: 600 }}>
                  Total value: ₹{(parseFloat(form.quantity) * parseFloat(form.pricePerKg)).toLocaleString("en-IN")}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle} htmlFor="notes-additional-info">Notes / Additional Info</label>
              <textarea id="notes-additional-info" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes about this batch..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
                whileTap={{ scale: 0.97 }}
                style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Plus size={16} /> Add to Stock
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

// ─── BATCH VIEW DETAILS MODAL ─────────────────────────────────────────────────
export function BatchViewDetailsModal({ batch, onClose }: { batch: BatchRow | null; onClose: () => void }) {
  if (!batch) return null;
  const sc = STATUS_CFG[batch.statusType];
  const remPct = batch.received > 0 ? Math.round((batch.remaining / batch.received) * 100) : 0;
  const usagePct = batch.received > 0 ? Math.round((batch.given / batch.received) * 100) : 0;
  const mt = MAT_TAG[batch.type];

  return (
    <ModalOverlay open={!!batch} onClose={onClose}>
      <ModalHeader title="Batch Details" subtitle={`Full information for batch ${batch.id}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "6px 14px", borderRadius: 8, letterSpacing: "0.3px" }}>{batch.id}</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: mt.col, background: mt.bg, padding: "6px 14px", borderRadius: 20 }}>{batch.type}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20 }}>
            {sc.icon} {sc.text}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Material Details", value: batch.details },
            { label: "Vendor", value: batch.vendor },
            { label: "Date Received", value: batch.date },
            { label: "Material Type", value: batch.type },
          ].map(row => (
            <div key={row.label} style={{ background: T.silkCream, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 5 }}>{row.label}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Received", value: batch.received, color: T.luxuryBrown, icon: <Package size={18} color={T.royalBurgundy} /> },
            { label: "Given to Weavers", value: batch.given, color: T.taupe, icon: <ArrowRight size={18} color={T.antiqueGold} /> },
            { label: "Remaining", value: batch.remaining, color: sc.color, icon: <CheckCircle2 size={18} color={sc.color} /> },
          ].map(row => (
            <div key={row.label} style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 16px 14px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{row.icon}</div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: batch.type === "Jari" ? 20 : 28, color: row.color, lineHeight: 1.2 }}>
                {batch.type === "Jari" ? (
                  <>
                    <div>{row.value} Buns</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.taupe, marginTop: 3 }}>({row.value * 4} Reels)</div>
                  </>
                ) : (
                  row.value
                )}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 4 }}>
                {row.label} {batch.type === "Jari" ? "" : "(kg)"}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: T.silkCream, borderRadius: 14, padding: "18px 20px", marginBottom: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Stock remaining</span>
              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: sc.color }}>{remPct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(110,15,45,0.10)", borderRadius: 4 }}>
              <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 4 }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Usage rate</span>
              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.antiqueGold }}>{usagePct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(200,155,71,0.12)", borderRadius: 4 }}>
              <div style={{ width: `${usagePct}%`, height: "100%", background: T.antiqueGold, borderRadius: 4 }} />
            </div>
          </div>
        </div>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(110,15,45,0.22)" }}
          whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}
        >
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── PRINT BARCODE MODAL ──────────────────────────────────────────────────────
export function PrintBarcodeModal({ batch, onClose }: { batch: BatchRow | null; onClose: () => void }) {
  if (!batch) return null;
  const mt = MAT_TAG[batch.type];
  const barPattern = batch.id.split("").map(c => c.charCodeAt(0));

  return (
    <ModalOverlay open={!!batch} onClose={onClose}>
      <ModalHeader title="Print Barcode" subtitle={`Barcode label for batch ${batch.id}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ background: "#FFFFFF", border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 16, padding: "28px 28px 24px", marginBottom: 22, textAlign: "center" }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Beere Kesava & Brothers Silks</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown, marginBottom: 4 }}>{batch.type} — {batch.details}</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 18 }}>{batch.vendor} · {batch.date}</div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, height: 60, marginBottom: 10 }}>
            {barPattern.slice(0, 32).map((v, i) => (
              <div key={i} style={{ width: i % 3 === 0 ? 3 : 1.5, height: `${40 + (v % 20)}%`, background: T.darkBurgundy, borderRadius: 1 }} />
            ))}
          </div>

          <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, letterSpacing: "3px", marginBottom: 14 }}>{batch.id}</div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: mt.col, background: mt.bg, padding: "4px 12px", borderRadius: 6, letterSpacing: "1px" }}>{batch.type}</span>
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, background: T.silkCream, padding: "4px 12px", borderRadius: 6 }}>Received: {batch.received} kg</span>
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, background: T.silkCream, padding: "4px 12px", borderRadius: 6 }}>Remaining: {batch.remaining} kg</span>
          </div>
        </div>

        <div style={{ background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 22 }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "#7A5E1C", lineHeight: 1.6 }}>
            <strong>Print instructions:</strong> This barcode label can be printed and attached to the physical material batch for easy scanning and tracking.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
            Cancel
          </motion.button>
          <motion.button
            onClick={() => { window.print(); }}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Printer size={16} /> Print Barcode Label
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}
