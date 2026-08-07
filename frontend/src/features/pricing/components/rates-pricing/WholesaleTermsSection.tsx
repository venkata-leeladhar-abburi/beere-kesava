import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Check, X, Clock } from "lucide-react";
import { T, F, cardStyle, inputStyle, labelStyle, thStyle, tdStyle } from "./theme";
import { SectionTitle, GoldLink } from "./sharedUI";
import { customersApi, BackendCustomer } from "../../../../shared/api/customers";

interface CustomerTermsState {
  termsDays: number;
  notes: string;
}

export function WholesaleTermsSection() {
  const [editTermsRowId, setEditTermsRowId] = useState<string | null>(null);
  const [editAlertDay, setEditAlertDay] = useState(false);
  const [globalAlertDay, setGlobalAlertDay] = useState(45);
  const [tempAlertDay, setTempAlertDay] = useState(45);

  const [customerTerms, setCustomerTerms] = useState<Record<string, CustomerTermsState>>({});
  const [editForm, setEditForm] = useState<{ days: number; notes: string }>({ days: 30, notes: "" });

  const { data: customersRes, isLoading } = useQuery({
    queryKey: ["wholesale-terms-customers"],
    queryFn: () => customersApi.list(),
  });

  const wholesaleCustomers = useMemo(() => {
    return (customersRes?.items ?? []).filter(c => c.type === "WHOLESALE");
  }, [customersRes]);

  const handleEditClick = (cust: BackendCustomer) => {
    if (editTermsRowId === cust.id) {
      setEditTermsRowId(null);
    } else {
      setEditTermsRowId(cust.id);
      const current = customerTerms[cust.id] || { termsDays: 30, notes: "" };
      setEditForm({ days: current.termsDays, notes: current.notes });
    }
  };

  const handleSaveTerms = (id: string) => {
    setCustomerTerms(prev => ({
      ...prev,
      [id]: { termsDays: editForm.days, notes: editForm.notes },
    }));
    setEditTermsRowId(null);
  };

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
            <strong style={{ color: T.antiqueGold, fontSize: 14 }}>Day {globalAlertDay}</strong>{" "}
            for all customers
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!editAlertDay ? (
            <GoldLink onClick={() => { setTempAlertDay(globalAlertDay); setEditAlertDay(true); }}>
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
              <input
                type="number"
                value={tempAlertDay}
                onChange={e => setTempAlertDay(Number(e.target.value))}
                style={{ ...inputStyle, width: 70 }}
              />
              <button
                onClick={() => { setGlobalAlertDay(tempAlertDay); setEditAlertDay(false); }}
                style={{ background: T.green, color: "#fff", border: "none", borderRadius: 999, padding: "6px 14px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Save
              </button>
              <button
                onClick={() => setEditAlertDay(false)}
                style={{ background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 999, padding: "6px 12px", fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Terms Table */}
      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            Loading wholesale customers…
          </div>
        ) : wholesaleCustomers.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            No wholesale customers registered in the system yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Customer Name", "Code", "Current Terms", "Alert Starts", "Overdue From", "Last Changed", "Edit"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wholesaleCustomers.map(cust => {
                const terms = customerTerms[cust.id]?.termsDays || 30;
                const alertDay = globalAlertDay;
                const overdueDay = globalAlertDay + 1;
                const code = cust.id.slice(-6).toUpperCase();
                const isEditing = editTermsRowId === cust.id;

                return (
                  <React.Fragment key={cust.id}>
                    <tr style={{ background: isEditing ? "rgba(110,15,45,0.03)" : "transparent" }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{cust.name}</td>
                      <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>WHL-{code}</td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown,
                          background: T.cream, padding: "3px 10px", borderRadius: 6,
                        }}>{terms} days</span>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.antiqueGold }}>Day {alertDay}</td>
                      <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.crimson }}>Day {overdueDay}</td>
                      <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                        {new Date(cust.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleEditClick(cust)}
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
                          {isEditing && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{ background: T.cream, borderTop: `2px solid ${T.antiqueGold}`, padding: 20 }}>
                                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 14 }}>
                                  Editing Terms: {cust.name}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                                  <div>
                                    <label style={labelStyle} htmlFor="payment-terms-days">Payment Terms (Days) *</label>
                                    <input
                                      id="payment-terms-days"
                                      type="number"
                                      value={editForm.days}
                                      onChange={e => setEditForm(f => ({ ...f, days: Number(e.target.value) }))}
                                      style={inputStyle}
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle} htmlFor="notes">Notes</label>
                                    <textarea
                                      id="notes"
                                      rows={2}
                                      value={editForm.notes}
                                      onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                      style={{ ...inputStyle, resize: "none" }}
                                      placeholder="Optional notes about this customer's terms…"
                                    />
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                  <button
                                    onClick={() => handleSaveTerms(cust.id)}
                                    style={{
                                      background: T.green, color: "#fff", border: "none", borderRadius: 999,
                                      padding: "8px 20px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                      display: "flex", alignItems: "center", gap: 6,
                                    }}
                                  >
                                    <Check size={13} /> Save Terms
                                  </button>
                                  <button
                                    onClick={() => setEditTermsRowId(null)}
                                    style={{
                                      background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                                      borderRadius: 999, padding: "8px 16px", fontFamily: F.ui, fontSize: 12, cursor: "pointer",
                                      display: "flex", alignItems: "center", gap: 5,
                                    }}
                                  >
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
