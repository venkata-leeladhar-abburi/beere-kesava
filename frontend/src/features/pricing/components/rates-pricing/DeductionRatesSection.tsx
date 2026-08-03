import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Check, X, AlertTriangle, ChevronRight, Package, Layers, Tag } from "lucide-react";
import { T, F, cardStyle, inputStyle, labelStyle } from "./theme";
import { SectionTitle, GoldLink } from "./sharedUI";

export function DeductionRatesSection() {
  const [editDeduction, setEditDeduction] = useState<string | null>("warp");

  return (
    <div style={{ padding: "48px 56px" }}>
      <SectionTitle>Raw Material Deduction Rates</SectionTitle>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 24px 0", lineHeight: 1.7 }}>
        When a weaver returns less raw material than the standard issue, a deduction is applied to their payment. These rates define the per-unit deduction value.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 16 }}>
        {/* Warp Card */}
        <div>
          <div style={{ ...cardStyle, borderTop: `4px solid ${T.royalBurgundy}`, padding: 24, borderRadius: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: T.royalBurgundy,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <Package size={16} color="#fff" />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Warp Deduction Rate</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}>₹5.20</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
              Applied when returned warp weight is less than the standard issued weight for the saree type.
            </p>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 14 }}>Last changed: 2 weeks ago</div>
            <button
              onClick={() => setEditDeduction(editDeduction === "warp" ? null : "warp")}
              style={{
                width: "100%", background: "transparent", border: `1px solid ${T.borderDef}`,
                borderRadius: 8, padding: "8px 0", fontFamily: F.ui, fontSize: 12,
                color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Edit2 size={12} /> Edit Rate
            </button>
          </div>

          {/* Warp inline edit */}
          <AnimatePresence>
            {editDeduction === "warp" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ background: "#fff", border: `1px solid ${T.borderDef}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>Deduction Rate (₹ per gram) *</label>
                      <input type="number" defaultValue="5.20" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Applies After Variance (grams) *</label>
                      <input type="number" defaultValue="5" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Reason</label>
                      <textarea rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="e.g. Vendor price increase…" />
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                    borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                  }}>
                    <AlertTriangle size={14} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                      This rate change will apply to all future warp deduction calculations immediately.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{
                      flex: 1, background: T.green, color: "#fff", border: "none", borderRadius: 999,
                      padding: "8px 0", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}>
                      <Check size={13} /> Save
                    </button>
                    <button onClick={() => setEditDeduction(null)} style={{
                      flex: 1, background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                      borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}>
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resham Card */}
        <div style={{ ...cardStyle, borderTop: `4px solid ${T.antiqueGold}`, padding: 24, borderRadius: 16, alignSelf: "start" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(200,155,71,0.15)",
            border: `1px solid rgba(200,155,71,0.30)`,
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Tag size={16} color={T.antiqueGold} />
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Resham Deduction Rate</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}>₹15.00</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
          <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
          <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
            Applied when returned resham (silk thread) weight is less than the standard issued quantity for the design.
          </p>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 14 }}>Last changed: 1 month ago</div>
          <button
            onClick={() => setEditDeduction(editDeduction === "resham" ? null : "resham")}
            style={{
              width: "100%", background: "transparent", border: `1px solid ${T.borderDef}`,
              borderRadius: 8, padding: "8px 0", fontFamily: F.ui, fontSize: 12,
              color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Edit2 size={12} /> Edit Rate
          </button>
          <AnimatePresence>
            {editDeduction === "resham" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                style={{ overflow: "hidden", marginTop: 16 }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Deduction Rate (₹ per gram) *</label>
                    <input type="number" defaultValue="15.00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Applies After Variance (grams) *</label>
                    <input type="number" defaultValue="3" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Reason</label>
                    <textarea rows={2} style={{ ...inputStyle, resize: "none" }} />
                  </div>
                  <div style={{
                    background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                    borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <AlertTriangle size={14} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future calculations.</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, background: T.green, color: "#fff", border: "none", borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <Check size={13} /> Save
                    </button>
                    <button onClick={() => setEditDeduction(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Jari Card */}
        <div style={{ ...cardStyle, borderTop: `4px solid #2C1810`, padding: 24, borderRadius: 16, alignSelf: "start" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#2C1810",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Layers size={16} color="#fff" />
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Jari Deduction Rate</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}>₹42.00</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 12 }}>per reel below standard</div>
          <div style={{
            display: "inline-block", background: "rgba(200,155,71,0.12)", border: `1px solid rgba(200,155,71,0.25)`,
            borderRadius: 999, padding: "3px 10px", marginBottom: 14,
          }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.antiqueGold }}>Jari is measured in Reels · 1 Bun = 4 Reels</span>
          </div>
          <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
          <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
            Applied when returned jari is less than the standard issued quantity. Measured in reels, not grams.
          </p>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 14 }}>Last changed: 3 weeks ago</div>
          <button
            onClick={() => setEditDeduction(editDeduction === "jari" ? null : "jari")}
            style={{
              width: "100%", background: "transparent", border: `1px solid ${T.borderDef}`,
              borderRadius: 8, padding: "8px 0", fontFamily: F.ui, fontSize: 12,
              color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Edit2 size={12} /> Edit Rate
          </button>
          <AnimatePresence>
            {editDeduction === "jari" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                style={{ overflow: "hidden", marginTop: 16 }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Deduction Rate (₹ per reel) *</label>
                    <input type="number" defaultValue="42.00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Applies After Variance (reels) *</label>
                    <input type="number" defaultValue="1" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Reason</label>
                    <textarea rows={2} style={{ ...inputStyle, resize: "none" }} />
                  </div>
                  <div style={{
                    background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                    borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <AlertTriangle size={14} color={T.crimson} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future Jari deduction calculations.</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, background: T.green, color: "#fff", border: "none", borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Save
                    </button>
                    <button onClick={() => setEditDeduction(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Variance Rule Strip */}
      <div style={{
        background: T.cream, border: `1px solid ${T.borderGold}`, borderRadius: 12,
        padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 5 }}>
            Current Variance Rule
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown }}>
            Deductions only apply when the returned material is more than <strong>5 grams</strong> (or <strong>1 reel</strong> for Jari) below the standard issued quantity.
          </div>
        </div>
        <GoldLink>
          <Edit2 size={12} /> Edit Variance Rule <ChevronRight size={14} />
        </GoldLink>
      </div>
    </div>
  );
}
