import { Check, X, AlertTriangle } from "lucide-react";
import { T, F, cardStyle, inputStyle, labelStyle } from "./theme";
import { SectionTitle } from "./sharedUI";

export function JariSettingsSection() {
  return (
    <div style={{ padding: "48px 56px" }}>
      <SectionTitle>Jari Measurement Settings</SectionTitle>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 24px 0", lineHeight: 1.7 }}>
        Define the conversion ratio between Buns and Reels for Jari material. This setting affects all Jari-related calculations system-wide.
      </p>

      <div style={{ ...cardStyle, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 8 }}>
            1 Bun = 4 Reels
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            The current conversion is set to 4 Reels per Bun. This is used when calculating Jari deductions and stock tracking across all weaver accounts.
          </p>
        </div>

        <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 28px 0" }} />

        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>1 Bun equals:</label>
            <input
              type="number"
              defaultValue="4"
              style={{ ...inputStyle, width: 90, fontFamily: F.mono, fontSize: 20, fontWeight: 700, textAlign: "center" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (singular):</label>
            <input defaultValue="Reel" style={{ ...inputStyle, width: 110 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (plural):</label>
            <input defaultValue="Reels" style={{ ...inputStyle, width: 110 }} />
          </div>
        </div>

        <div style={{
          background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
          borderRadius: 8, padding: "12px 18px", display: "flex", alignItems: "center",
          gap: 10, marginBottom: 24, maxWidth: 600, margin: "0 auto 24px",
        }}>
          <AlertTriangle size={16} color={T.crimson} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, lineHeight: 1.6 }}>
            <strong>Warning:</strong> Changing the Bun-to-Reel conversion will affect all Jari calculations system-wide, including historical display values and future deduction calculations. This should only be changed if the physical measurement standard changes.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button style={{
            background: T.green, color: "#fff", border: "none", borderRadius: 999,
            padding: "10px 28px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <Check size={15} /> Save Conversion Settings
          </button>
          <button style={{
            background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
            borderRadius: 999, padding: "10px 20px", fontFamily: F.ui, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
