// ── New weaver registration modal/form ──────────────────────────────────────
import React from "react";
import { motion } from "motion/react";
import { Plus, Camera } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";

export function NewWeaverModal({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) {
  const fieldStyle: React.CSSProperties = { width: "100%", height: 48, padding: "0 16px", fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 8 };

  return (
    <div style={expanded ? { position: "fixed", inset: 0, zIndex: 1250, background: "rgba(26,10,15,0.42)", backdropFilter: "blur(4px)", padding: "32px 48px", overflowY: "auto" } : { padding: "40px 48px", paddingBottom: 80 }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: "32px", boxShadow: expanded ? "0 30px 90px rgba(0,0,0,0.25)" : "0 8px 32px rgba(74,6,27,0.06)", maxWidth: 900, margin: expanded ? "24px auto" : "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: F.display, fontSize: 28, color: T.luxuryBrown, margin: 0 }}>Add a New Weaver</h2>
            {!expanded && <motion.button onClick={() => setExpanded(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Open Form</motion.button>}
            {expanded && <button onClick={() => setExpanded(false)} style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, background: "none", border: "none", cursor: "pointer" }}>Cancel ×</button>}
          </div>

          {!expanded ? (
            <motion.button onClick={() => setExpanded(true)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              style={{ width: "100%", height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#FFFDF9", border: "none", borderRadius: 14, fontFamily: F.ui, fontSize: 18, fontWeight: 600, cursor: "pointer", background: `linear-gradient(135deg, ${T.royalBurgundy}, ${T.deepWine})` }}>
              <Plus size={20} /> Register New Weaver
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: F.display, fontSize: 28, color: T.luxuryBrown, marginBottom: 8 }}>New Weaver Registration</div>
              <div style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, marginBottom: 32 }}>Fill in all the details below. Fields marked with * are required.</div>

              {/* ── Photo Upload ── */}
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>Photo of Weaver *</label>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14, marginTop: -4 }}>Upload a clear photo for easy identification. Appears on profile and batch records.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%",
                    border: "2px dashed rgba(110,15,45,0.25)",
                    background: "rgba(110,15,45,0.04)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                  }}>
                    <Camera size={28} color="rgba(110,15,45,0.35)" strokeWidth={1.5} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(110,15,45,0.45)", marginTop: 8, fontWeight: 600 }}>Upload Photo</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>
                    JPG or PNG · Max 5MB · Mandatory
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                {/* First / Last name split */}
                <div>
                  <label style={labelStyle} htmlFor="first-name">First Name *</label>
                  <input id="first-name" style={fieldStyle} placeholder="First name" />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="last-name">Last Name *</label>
                  <input id="last-name" style={fieldStyle} placeholder="Last name" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: -16, marginBottom: 20 }}>
                    The weaver will be identified by their first name in all batch IDs and saree records.
                  </div>
                </div>
                {/* Email */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>
                    Email ID *
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 400, color: T.taupe, marginLeft: 8 }}>Used for records and notifications.</span>
                  </label>
                  <input aria-label="weaver@example.com" style={fieldStyle} type="email" placeholder="weaver@example.com" />
                </div>
                <div><label style={labelStyle}>Mobile Number *</label><input aria-label="10-digit mobile number" style={fieldStyle} placeholder="10-digit mobile number" /></div>
                <div><label style={labelStyle}>Village / Area *</label><input aria-label="E.g., Dharmavaram, AP" style={fieldStyle} placeholder="E.g., Dharmavaram, AP" /></div>
                <div><label style={labelStyle}>Number of Looms *</label><input aria-label="Total active looms" style={fieldStyle} type="number" placeholder="Total active looms" /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Full Address</label><input aria-label="Complete postal address" style={fieldStyle} placeholder="Complete postal address" /></div>
              </div>

              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 18, color: T.luxuryBrown, marginBottom: 20, paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
                Bank Account Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                <div><label style={labelStyle}>Bank Name</label><input aria-label="E.g., State Bank of India" style={fieldStyle} placeholder="E.g., State Bank of India" /></div>
                <div><label style={labelStyle}>Account Holder Name</label><input aria-label="Name as per bank" style={fieldStyle} placeholder="Name as per bank" /></div>
                <div><label style={labelStyle}>Account Number</label><input aria-label="Account number" style={fieldStyle} placeholder="Account number" /></div>
                <div><label style={labelStyle}>IFSC Code</label><input aria-label="11-character IFSC code" style={fieldStyle} placeholder="11-character IFSC code" /></div>
              </div>

              <div style={{ display: "flex", gap: 16, justifyContent: "flex-end", borderTop: `1px solid ${T.borderDef}`, paddingTop: 32 }}>
                <motion.button onClick={() => setExpanded(false)} whileHover={{ scale: 1.02 }}
                  style={{ width: 140, height: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.taupe, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }}
                  style={{ width: 240, height: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer", background: T.royalBurgundy }}>
                  Save Weaver
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </FadeUp>
    </div>
  );
}
