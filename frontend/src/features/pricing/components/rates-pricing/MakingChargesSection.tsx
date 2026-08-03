import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Plus, Check, X, AlertTriangle, BarChart2, Eye } from "lucide-react";
import { T, F, cardStyle, inputStyle, labelStyle, thStyle, tdStyle } from "./theme";
import { SectionTitle, GoldLink, JariWeightField, SareeTypeCombobox } from "./sharedUI";
import type { SareeTypeRecord } from "./sareeTypeData";

export function MakingChargesSection({
  rates, setRates, onView,
}: {
  rates: SareeTypeRecord[];
  setRates: React.Dispatch<React.SetStateAction<SareeTypeRecord[]>>;
  onView: (row: SareeTypeRecord) => void;
}) {
  const [editRow, setEditRow] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Edit form state
  const [editVals, setEditVals] = useState<Partial<SareeTypeRecord>>({});

  // New form state
  const [newVals, setNewVals] = useState<Partial<SareeTypeRecord>>({});

  function openEdit(i: number) {
    if (editRow === i) { setEditRow(null); return; }
    setEditRow(i);
    setEditVals({ ...rates[i] });
  }

  function saveEdit(i: number) {
    setRates(prev => prev.map((r, idx) => idx === i ? { ...r, ...editVals, changed: "Just now" } as SareeTypeRecord : r));
    setEditRow(null);
  }

  function saveNew() {
    if (!newVals.type?.trim() || !newVals.code?.trim()) return;
    const entry: SareeTypeRecord = {
      code: newVals.code!.trim(),
      type: newVals.type!.trim(),
      description: newVals.description ?? "",
      charge: newVals.charge ?? "0",
      retail: newVals.retail ?? "0",
      wholesale: newVals.wholesale ?? "0",
      stdWeight: newVals.stdWeight ?? "0",
      warpWeight: newVals.warpWeight ?? "0",
      reshamWeight: newVals.reshamWeight ?? "0",
      jariWeight: newVals.jariWeight ?? "0",
      changed: "Just now",
    };
    setRates(prev => [entry, ...prev]);
    setNewVals({});
    setShowNewForm(false);
  }

  // All current type names for the combobox
  const typeNames = rates.map(r => r.type);

  return (
    <div style={{ padding: "96px 56px 48px" }}>
      <SectionTitle link={
        <GoldLink><BarChart2 size={13} /> View Rate Change History →</GoldLink>
      }>
        Making Charge Rates — Per Saree Type
      </SectionTitle>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 24px 0", lineHeight: 1.7 }}>
        These charges are applied to each saree during production billing. Making charge is the amount paid to the weaver per saree woven. All prices in Indian Rupees (₹).
      </p>

      {/* Rates Table */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Code", "Saree Type", "Making Charge", "Retail", "Wholesale", "Std Weight", "Last Changed", "Actions"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rates.map((row, i) => (
              <React.Fragment key={row.code}>
                <tr style={{ background: editRow === i ? "rgba(110,15,45,0.03)" : "transparent" }}>
                  <td style={tdStyle}>
                    <span style={{
                      fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600,
                      background: "rgba(110,15,45,0.08)", padding: "3px 8px", borderRadius: 6,
                    }}>{row.code}</span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{row.type}</td>
                  <td style={{ ...tdStyle, fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.antiqueGold }}>
                    ₹{parseInt(row.charge).toLocaleString("en-IN")}
                  </td>
                  <td style={tdStyle}>₹{parseInt(row.retail).toLocaleString("en-IN")}</td>
                  <td style={tdStyle}>₹{parseInt(row.wholesale).toLocaleString("en-IN")}</td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11 }}>{row.stdWeight}g</td>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{row.changed}</td>
                  <td style={{ ...tdStyle }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => onView(row)}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          background: "transparent", border: `1px solid ${T.borderDef}`,
                          color: T.taupe, borderRadius: 10, padding: "5px 10px",
                          fontFamily: F.ui, fontSize: 12, cursor: "pointer",
                        }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => openEdit(i)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: "transparent", border: `1px solid ${T.royalBurgundy}`,
                          color: T.royalBurgundy, borderRadius: 10, padding: "5px 12px",
                          fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Inline edit form */}
                <tr>
                  <td colSpan={8} style={{ padding: 0, borderBottom: "none" }}>
                    <AnimatePresence>
                      {editRow === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ background: T.cream, borderTop: `2px solid ${T.antiqueGold}`, padding: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
                                Editing: {row.type} — <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{row.code}</span>
                              </span>
                              <button onClick={() => setEditRow(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, display: "flex", alignItems: "center", gap: 4 }}>
                                <X size={16} />
                              </button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 18 }}>
                              {/* Col 1 — Identity */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                  <label style={labelStyle}>Saree Type Name *</label>
                                  <SareeTypeCombobox
                                    value={editVals.type ?? row.type}
                                    onChange={v => setEditVals(p => ({ ...p, type: v }))}
                                    options={typeNames.filter(n => n !== row.type)}
                                  />
                                </div>
                                <div>
                                  <label style={labelStyle} htmlFor="short-code">Short Code</label>
                                  <input id="short-code" value={row.code} readOnly style={{ ...inputStyle, background: "#EDE5D8", color: T.taupe, cursor: "not-allowed" }} />
                                  <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4, display: "block" }}>Code cannot be changed</span>
                                </div>
                                <div>
                                  <label style={labelStyle} htmlFor="description">Description</label>
                                  <textarea id="description" rows={2} value={editVals.description ?? row.description} onChange={e => setEditVals(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} placeholder="Short description…" />
                                </div>
                              </div>
                              {/* Col 2 — Pricing */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                  <label style={labelStyle} htmlFor="making-charge">Making Charge (₹) *</label>
                                  <input id="making-charge" type="number" value={editVals.charge ?? row.charge} onChange={e => setEditVals(p => ({ ...p, charge: e.target.value }))} style={inputStyle} />
                                </div>
                                <div>
                                  <label style={labelStyle} htmlFor="retail-price">Retail Price (₹)</label>
                                  <input id="retail-price" type="number" value={editVals.retail ?? row.retail} onChange={e => setEditVals(p => ({ ...p, retail: e.target.value }))} style={inputStyle} />
                                </div>
                                <div>
                                  <label style={labelStyle} htmlFor="wholesale-price">Wholesale Price (₹)</label>
                                  <input id="wholesale-price" type="number" value={editVals.wholesale ?? row.wholesale} onChange={e => setEditVals(p => ({ ...p, wholesale: e.target.value }))} style={inputStyle} />
                                </div>
                              </div>
                              {/* Col 3 — Weights */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                  <label style={labelStyle} htmlFor="standard-weight-g">Standard Weight (g) *</label>
                                  <input id="standard-weight-g" type="number" value={editVals.stdWeight ?? row.stdWeight} onChange={e => setEditVals(p => ({ ...p, stdWeight: e.target.value }))} style={inputStyle} placeholder="Enter manually" />
                                </div>
                                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: 14 }}>
                                  <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div>
                                      <label style={{ ...labelStyle, marginBottom: 3 }}>Warp Weight (g)</label>
                                      <input type="number" value={editVals.warpWeight ?? row.warpWeight} onChange={e => setEditVals(p => ({ ...p, warpWeight: e.target.value }))} style={inputStyle} />
                                    </div>
                                    <div>
                                      <label style={{ ...labelStyle, marginBottom: 3 }}>Resham Weight (g)</label>
                                      <input type="number" value={editVals.reshamWeight ?? row.reshamWeight} onChange={e => setEditVals(p => ({ ...p, reshamWeight: e.target.value }))} style={inputStyle} />
                                    </div>
                                    <JariWeightField
                                      reels={editVals.jariWeight ?? row.jariWeight}
                                      onChange={v => setEditVals(p => ({ ...p, jariWeight: v }))}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div style={{
                              background: "rgba(196,146,58,0.10)", border: `1px solid rgba(200,155,71,0.35)`,
                              borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
                            }}>
                              <AlertTriangle size={15} color={T.antiqueGold} />
                              <span style={{ fontFamily: F.ui, fontSize: 12, color: "#7A5E1A" }}>
                                Changing making charges affects all future production bills for <strong>{row.type}</strong>. Changes are logged in rate history.
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                              <button onClick={() => saveEdit(i)} style={{
                                background: T.green, color: "#fff", border: "none", borderRadius: 999,
                                padding: "9px 22px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                              }}>
                                <Check size={14} /> Save Changes
                              </button>
                              <button onClick={() => setEditRow(null)} style={{
                                background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                                borderRadius: 999, padding: "9px 18px", fontFamily: F.ui, fontSize: 13, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
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

      {/* Add New Saree Type */}
      <button
        onClick={() => { setShowNewForm(!showNewForm); setNewVals({}); }}
        style={{
          width: "100%", marginTop: 16, background: T.royalBurgundy, color: "#fff",
          border: "none", borderRadius: 999, height: 48, fontFamily: F.ui, fontSize: 14,
          fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8,
        }}
      >
        <Plus size={16} /> Add New Saree Type
      </button>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden", marginTop: 12 }}
          >
            <div style={{ ...cardStyle, padding: 24 }}>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, marginBottom: 18 }}>
                New Saree Type
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 18 }}>
                {/* Col 1 — Identity */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Saree Type Name * <span style={{ color: T.antiqueGold, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select existing or type new)</span></label>
                    <SareeTypeCombobox
                      value={newVals.type ?? ""}
                      onChange={v => setNewVals(p => ({ ...p, type: v }))}
                      options={typeNames}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="short-code-2">Short Code *</label>
                    <input id="short-code-2" value={newVals.code ?? ""} onChange={e => setNewVals(p => ({ ...p, code: e.target.value }))} style={{ ...inputStyle, fontFamily: F.mono }} placeholder="e.g. KS-006" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="description-2">Description</label>
                    <textarea id="description-2" rows={2} value={newVals.description ?? ""} onChange={e => setNewVals(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} placeholder="Short description…" />
                  </div>
                </div>
                {/* Col 2 — Pricing */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle} htmlFor="making-charge-2">Making Charge (₹) *</label>
                    <input id="making-charge-2" type="number" value={newVals.charge ?? ""} onChange={e => setNewVals(p => ({ ...p, charge: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="retail-price-2">Retail Price (₹)</label>
                    <input id="retail-price-2" type="number" value={newVals.retail ?? ""} onChange={e => setNewVals(p => ({ ...p, retail: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="wholesale-price-2">Wholesale Price (₹)</label>
                    <input id="wholesale-price-2" type="number" value={newVals.wholesale ?? ""} onChange={e => setNewVals(p => ({ ...p, wholesale: e.target.value }))} style={inputStyle} placeholder="0" />
                  </div>
                </div>
                {/* Col 3 — Weights */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle} htmlFor="standard-weight-g-2">Standard Weight (g) *</label>
                    <input id="standard-weight-g-2" type="number" value={newVals.stdWeight ?? ""} onChange={e => setNewVals(p => ({ ...p, stdWeight: e.target.value }))} style={inputStyle} placeholder="Enter manually" />
                  </div>
                  <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: 3 }}>Warp Weight (g)</label>
                        <input type="number" value={newVals.warpWeight ?? ""} onChange={e => setNewVals(p => ({ ...p, warpWeight: e.target.value }))} style={inputStyle} placeholder="0" />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: 3 }}>Resham Weight (g)</label>
                        <input type="number" value={newVals.reshamWeight ?? ""} onChange={e => setNewVals(p => ({ ...p, reshamWeight: e.target.value }))} style={inputStyle} placeholder="0" />
                      </div>
                      <JariWeightField
                        reels={newVals.jariWeight ?? ""}
                        onChange={v => setNewVals(p => ({ ...p, jariWeight: v }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={saveNew}
                  disabled={!newVals.type?.trim() || !newVals.code?.trim()}
                  style={{
                    background: (!newVals.type?.trim() || !newVals.code?.trim()) ? T.taupe : T.green,
                    color: "#fff", border: "none", borderRadius: 999,
                    padding: "9px 22px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                    cursor: (!newVals.type?.trim() || !newVals.code?.trim()) ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 6, opacity: (!newVals.type?.trim() || !newVals.code?.trim()) ? 0.55 : 1,
                  }}
                >
                  <Check size={14} /> Save New Type
                </button>
                <button onClick={() => { setShowNewForm(false); setNewVals({}); }} style={{
                  background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                  borderRadius: 999, padding: "9px 18px", fontFamily: F.ui, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <X size={13} /> Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
