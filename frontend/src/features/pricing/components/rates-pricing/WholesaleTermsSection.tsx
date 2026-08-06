import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Check, X, Clock } from "lucide-react";
import { T, F, cardStyle, labelStyle, thStyle, tdStyle } from "./theme";
import { SectionTitle, GoldLink } from "./sharedUI";
import { Button, NumberInput, Textarea } from "../../../../shared/ui/primitives";
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
              <NumberInput defaultValue={45} className="w-[70px] bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
              <Button className="rounded-full bg-[#1E6640] text-white hover:bg-[#1E6640]/90 px-3.5 py-1.5 text-[12px] font-semibold h-auto" variant="primary">
                Save
              </Button>
              <Button variant="secondary" className="rounded-full h-auto px-3 py-1.5 text-[12px]" onClick={() => setEditAlertDay(false)}>
                Cancel
              </Button>
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
                    <Button
                      variant="secondary" size="sm" iconLeft={Edit2}
                      className="rounded-[10px] border-[#6E0F2D] text-[#6E0F2D] h-auto py-[5px] px-3 text-[12px] font-medium"
                      onClick={() => setEditTermsRow(editTermsRow === i ? null : i)}
                    >
                      Edit
                    </Button>
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
                                <NumberInput id="payment-terms-days" defaultValue={parseInt(row.terms)} className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
                              </div>
                              <div>
                                <label style={labelStyle} htmlFor="notes">Notes</label>
                                <Textarea id="notes" rows={2} className="resize-none bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" placeholder="Optional notes about this customer's terms…" />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <Button variant="primary" iconLeft={Check} className="rounded-full bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto px-5 py-2 text-[12px] font-semibold">
                                Save Terms
                              </Button>
                              <Button variant="secondary" iconLeft={X} className="rounded-full h-auto px-4 py-2 text-[12px]" onClick={() => setEditTermsRow(null)}>
                                Cancel
                              </Button>
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
