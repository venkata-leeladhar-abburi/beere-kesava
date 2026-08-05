import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Check, X, Clock } from "lucide-react";
import { T, F, cardStyle, inputStyle, labelStyle, thStyle, tdStyle } from "./theme";
import { SectionTitle, GoldLink } from "./sharedUI";
import { WHOLESALE } from "./staticData";

export function WholesaleTermsSection() {
  const [editTermsRow, setEditTermsRow] = useState<number | null>(0);
  const [editAlertDay, setEditAlertDay] = useState(false);

  return (
    <div style={{ padding: "48px 56px" }}>
      <SectionTitle>Wholesale Payment Terms</SectionTitle>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 20px 0", lineHeight: 1.7 }}>
        Configure payment terms and overdue alert thresholds for each wholesale customer. Alert start day is a global setting applied to all customers.
      </p>

      {/* Global Alert Setting Strip */}
      <div style={{
        background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.28)`,
        borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={16} color={T.antiqueGold} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
            Payment alerts start from:{" "}
            <strong style={{ color: T.antiqueGold, fontSize: 14 }}>Day 45</strong>{" "}
            for all customers
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!editAlertDay ? (
            <GoldLink onClick={() => setEditAlertDay(true)}>
              <Edit2 size={12} /> Edit Alert Day
            </GoldLink>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Alert starts from Day:</span>
              <input type="number" defaultValue="45" style={{ ...inputStyle, width: 70 }} />
              <button style={{ background: T.green, color: "#fff", border: "none", borderRadius: 999, padding: "6px 14px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Save
              </button>
              <button onClick={() => setEditAlertDay(false)} style={{ background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 999, padding: "6px 12px", fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Terms Table */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Customer Name", "Code", "Current Terms", "Alert Starts", "Overdue From", "Last Changed", "Edit"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WHOLESALE.map((row, i) => (
              <React.Fragment key={row.code}>
                <tr style={{ background: editTermsRow === i ? "rgba(110,15,45,0.03)" : "transparent" }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{row.name}</td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{row.code}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown,
                      background: T.cream, padding: "3px 10px", borderRadius: 6,
                    }}>{row.terms}</span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.antiqueGold }}>{row.alert}</td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.crimson }}>{row.overdue}</td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.changed}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => setEditTermsRow(editTermsRow === i ? null : i)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "transparent", border: `1px solid ${T.royalBurgundy}`,
                        color: T.royalBurgundy, borderRadius: 10, padding: "5px 12px",
                        fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} style={{ padding: 0, borderBottom: "none" }}>
                    <AnimatePresence>
                      {editTermsRow === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ background: T.cream, borderTop: `2px solid ${T.antiqueGold}`, padding: 20 }}>
                            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 14 }}>
                              Editing Terms: {row.name}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                              <div>
                                <label style={labelStyle} htmlFor="payment-terms-days">Payment Terms (Days) *</label>
                                <input id="payment-terms-days" type="number" defaultValue={parseInt(row.terms)} style={inputStyle} />
                              </div>
                              <div>
                                <label style={labelStyle} htmlFor="notes">Notes</label>
                                <textarea id="notes" rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="Optional notes about this customer's terms…" />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <button style={{
                                background: T.green, color: "#fff", border: "none", borderRadius: 999,
                                padding: "8px 20px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                              }}>
                                <Check size={13} /> Save Terms
                              </button>
                              <button onClick={() => setEditTermsRow(null)} style={{
                                background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                                borderRadius: 999, padding: "8px 16px", fontFamily: F.ui, fontSize: 12, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 5,
                              }}>
                                <X size={13} /> Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
