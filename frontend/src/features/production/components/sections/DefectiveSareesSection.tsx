import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye } from "lucide-react";
import {
  Shield, DownloadSimple, SealWarning, WarningCircle,
  Users as PhUsers, CaretDown as PhCaretDown,
} from "@phosphor-icons/react";
import { T, F } from "../theme";
import { DEFECTIVE_DATA } from "../data";
import type { CodeCallbacks } from "../types";
import { FadeUp, ProductionDialog } from "../common/primitives";

export function DefectiveSareesSection({ superadmin = false }: { superadmin?: boolean; onNavigate?: (tab: string) => void } & CodeCallbacks) {
  const [timeFiler, setTimeFilter] = useState("All Time");
  const [weaverFilter, setWeaverFilter] = useState("All Weavers");
  const [defectFilter, setDefectFilter] = useState("All Defect Types");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [viewDefect, setViewDefect] = useState<typeof DEFECTIVE_DATA[0] | null>(null);
  const [dlWeaver, setDlWeaver] = useState("All Weavers");
  const [dlDefectType, setDlDefectType] = useState("All Defect Types");
  const [dlPeriod, setDlPeriod] = useState("This Month");
  const [dlWeaverOpen, setDlWeaverOpen] = useState(false);
  const [dlDefectOpen, setDlDefectOpen] = useState(false);

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "13px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}` };

  const totalDeduction = DEFECTIVE_DATA.reduce((sum, r) => sum + parseInt(r.deduction.replace(/[₹,]/g, "")), 0);

  return (
    <FadeUp>
      <section id="prod-defective" style={{ padding: "36px 48px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 4, background: T.crimson, borderRadius: 2, alignSelf: "stretch" }} />
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: "0 0 4px 0", fontWeight: 600 }}>Defective Sarees — Failed Quality Check</h2>
              <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>These sarees failed quality check by worker staff. They are stored separately. View only — no action can be taken from this page.</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowDownloadDialog(true)}
            whileHover={{ scale: 1.03, backgroundColor: "#7A5E1C" }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,155,71,0.15)", color: "#8B6018", border: `1.5px solid rgba(200,155,71,0.35)`, borderRadius: 11, padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            <DownloadSimple size={16} color={T.antiqueGold} weight="bold" /> Download Defective Report
          </motion.button>
        </div>

        <div style={{ background: "rgba(192,57,43,0.05)", border: `1px solid rgba(192,57,43,0.18)`, borderRadius: 10, padding: "10px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>This is a view-only section. Defective sarees are managed by the system automatically. Deductions have already been applied to the relevant weavers.</span>
        </div>

        {superadmin && (
          <div style={{ background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.07)", padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Shield size={14} color={T.antiqueGold} />
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.antiqueGold, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Superadmin Only — Not visible to Admin</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Deductions Applied This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson, lineHeight: 1.1, marginBottom: 4 }}>
                  ₹{totalDeduction.toLocaleString("en-IN")}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>🔒 Full deduction details visible to Superadmin only</div>
              </div>
              <div style={{ borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 24 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Defective Sarees All Time</div>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, marginBottom: 4 }}>
                  48 sarees
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>🔒 Superadmin only — not visible to Admin</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["All Time", "This Month", "This Week", "Today"].map(f => (
              <button key={f} onClick={() => setTimeFilter(f)} style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${timeFiler === f ? T.royalBurgundy : T.borderDef}`, background: timeFiler === f ? T.royalBurgundy : "#FFF", color: timeFiler === f ? "#FFF" : T.taupe, fontFamily: F.ui, fontSize: 12, fontWeight: timeFiler === f ? 600 : 400, cursor: "pointer" }}>{f}</button>
            ))}
          </div>
          <select value={weaverFilter} onChange={e => setWeaverFilter(e.target.value)} style={{ height: 34, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "0 12px", fontFamily: F.ui, fontSize: 13, background: "#FFFDF9", color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
            <option>All Weavers</option>
            <option>Padma Veni</option>
            <option>Ravi Kumar</option>
            <option>Suresh Murti</option>
            <option>Own Factory</option>
          </select>
          <select value={defectFilter} onChange={e => setDefectFilter(e.target.value)} style={{ height: 34, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "0 12px", fontFamily: F.ui, fontSize: 13, background: "#FFFDF9", color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
            <option>All Defect Types</option>
            <option>Thread Break</option>
            <option>Design Error</option>
            <option>Jari Issue</option>
            <option>Weight Problem</option>
            <option>Measurement Error</option>
          </select>
        </div>

        <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 24px rgba(74,6,27,0.07)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr>
                {["Saree ID", "Weaver", "Batch", "Saree Type", "Defect Type(s)", "QC Date", "Deduction Applied", "Action"].map(col => (
                  <th key={col} style={TH}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEFECTIVE_DATA.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : "#FFF" }}>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{row.id}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{row.weaver}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.batch}</span></td>
                  <td style={TD}>{row.sareeType}</td>
                  <td style={TD}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                      {row.defects.map(d => (
                        <span key={d} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.crimson, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", padding: "2px 8px", borderRadius: 999 }}>{d}</span>
                      ))}
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.qcDate}</span></td>
                  <td style={TD}>
                    <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.crimson, display: "block" }}>{row.deduction}</span>
                    {superadmin && (
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, display: "block", marginTop: 3 }}>🔒 Full deduction details visible to Superadmin only</span>
                    )}
                  </td>
                  <td style={TD}>
                    <motion.button onClick={() => setViewDefect(row)} whileHover={{ scale: 1.05, backgroundColor: "rgba(110,15,45,0.08)" }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", border: `1.5px solid rgba(110,15,45,0.22)`, borderRadius: 8, background: "#FFF", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                      <Eye size={13} /> View
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div style={{ background: T.warmCream, borderTop: `1px solid ${T.borderDef}`, padding: "12px 16px" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
              Total defective this month: <strong>{DEFECTIVE_DATA.length} sarees</strong> · Total deductions applied: <strong style={{ fontFamily: F.mono, color: T.crimson }}>₹{totalDeduction.toLocaleString("en-IN")}</strong>
            </span>
          </div>
        </div>

        <AnimatePresence>
          {showDownloadDialog && (
            <ProductionDialog open title="Download Defective Report" onClose={() => setShowDownloadDialog(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Time Period</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Today", "This Week", "This Month", "All Time"].map(p => (
                      <motion.button key={p} onClick={() => setDlPeriod(p)} whileHover={{ scale: 1.03 }}
                        style={{ padding: "8px 16px", borderRadius: 99, border: dlPeriod === p ? "none" : `1.5px solid rgba(110,15,45,0.18)`, background: dlPeriod === p ? T.royalBurgundy : "transparent", color: dlPeriod === p ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                        {p}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Weaver</div>
                  <div style={{ position: "relative" }}>
                    <motion.button onClick={() => { setDlWeaverOpen(p => !p); setDlDefectOpen(false); }} whileHover={{ backgroundColor: "rgba(110,15,45,0.05)" }}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", border: `1.5px solid ${T.borderDef}`, borderRadius: 11, background: "#FFFDF9", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <PhUsers size={16} color={T.taupe} /> {dlWeaver}
                      </span>
                      <PhCaretDown size={14} color={T.taupe} weight="bold" />
                    </motion.button>
                    {dlWeaverOpen && (
                      <div style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 50, background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.13)", overflow: "hidden" }}>
                        {["All Weavers", "Padma Veni", "Ravi Kumar", "Suresh Murti", "Own Factory"].map(w => (
                          <button key={w} onClick={() => { setDlWeaver(w); setDlWeaverOpen(false); }}
                            style={{ display: "block", width: "100%", padding: "11px 16px", background: dlWeaver === w ? T.warmCream : "#FFFDF9", border: "none", textAlign: "left", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer", fontWeight: dlWeaver === w ? 700 : 400 }}>
                            {w}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Defect Type</div>
                  <div style={{ position: "relative" }}>
                    <motion.button onClick={() => { setDlDefectOpen(p => !p); setDlWeaverOpen(false); }} whileHover={{ backgroundColor: "rgba(110,15,45,0.05)" }}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", border: `1.5px solid ${T.borderDef}`, borderRadius: 11, background: "#FFFDF9", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <SealWarning size={16} color={T.taupe} weight="duotone" /> {dlDefectType}
                      </span>
                      <PhCaretDown size={14} color={T.taupe} weight="bold" />
                    </motion.button>
                    {dlDefectOpen && (
                      <div style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 50, background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.13)", overflow: "hidden" }}>
                        {["All Defect Types", "Thread Break", "Design Error", "Jari Issue", "Weight Problem", "Measurement Error"].map(d => (
                          <button key={d} onClick={() => { setDlDefectType(d); setDlDefectOpen(false); }}
                            style={{ display: "block", width: "100%", padding: "11px 16px", background: dlDefectType === d ? T.warmCream : "#FFFDF9", border: "none", textAlign: "left", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer", fontWeight: dlDefectType === d ? 700 : 400 }}>
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Defective Sarees</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson }}>{DEFECTIVE_DATA.length}</div>
                  </div>
                  <div style={{ background: "rgba(200,155,71,0.07)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Total Deductions</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: "#8B6018" }}>₹{DEFECTIVE_DATA.reduce((s, r) => s + parseInt(r.deduction.replace(/[₹,]/g, "")), 0).toLocaleString("en-IN")}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDownloadDialog(false)}
                    style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${T.antiqueGold} 0%, #B88730 100%)`, color: T.deepWine, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(200,155,71,0.30)" }}>
                    <DownloadSimple size={18} weight="bold" /> Download PDF Report
                  </motion.button>
                  <motion.button onClick={() => setShowDownloadDialog(false)} whileHover={{ scale: 1.02 }}
                    style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                    Cancel
                  </motion.button>
                </div>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewDefect && (
            <ProductionDialog open title="Defective Saree — Details" onClose={() => setViewDefect(null)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {viewDefect.defects.map(d => (
                    <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.crimson, background: "rgba(192,57,43,0.09)", border: "1px solid rgba(192,57,43,0.22)", padding: "6px 14px", borderRadius: 99 }}>
                      <SealWarning size={14} color={T.crimson} weight="fill" /> {d}
                    </span>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Saree ID",    val: viewDefect.id,       mono: true  },
                    { label: "Weaver",      val: viewDefect.weaver,   mono: false },
                    { label: "Batch",       val: viewDefect.batch,    mono: true  },
                    { label: "Saree Type",  val: viewDefect.sareeType, mono: false },
                    { label: "QC Date",     val: viewDefect.qcDate,   mono: false },
                  ].map(r => (
                    <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Deduction Applied to Weaver</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson }}>{viewDefect.deduction}</div>
                  </div>
                  <SealWarning size={36} color={T.crimson} weight="duotone" />
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 10, padding: "12px 14px" }}>
                  <WarningCircle size={16} color={T.antiqueGold} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018", lineHeight: 1.5 }}>
                    This saree is stored separately in the defective stock area. Deduction has been automatically applied to the weaver's payment record.
                  </div>
                </div>
                <motion.button onClick={() => setViewDefect(null)} whileHover={{ scale: 1.02 }}
                  style={{ height: 46, background: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)", color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Close
                </motion.button>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>
      </section>
    </FadeUp>
  );
}
