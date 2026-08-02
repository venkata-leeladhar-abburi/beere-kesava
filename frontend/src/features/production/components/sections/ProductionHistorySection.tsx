import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Calendar, Users, Search, Download, Eye } from "lucide-react";
import { getSareeTypeByName } from "../../../pricing/components/RatesPricingPage";
import { T, F } from "../theme";
import { HISTORY_BATCHES } from "../data";
import type { CodeCallbacks } from "../types";
import { FadeUp, Pip, ClickableCode, ProductionDialog } from "../common/primitives";

function HistoryBatchSquares({ size }: { size: number }) {
  const colors = ["#7C3AED", T.royalBurgundy, T.taupe, "#B45309"];
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 56 }}>
      {Array.from({ length: Math.min(size, 4) }).map((_, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], opacity: 0.85 }} />
      ))}
    </div>
  );
}

function HistoryDropBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", whiteSpace: "nowrap" }}>
      {icon}{label}<ChevronDown size={14} style={{ color: T.taupe }} />
    </button>
  );
}

export function ProductionHistorySection({ onSareeTypeClick }: CodeCallbacks) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [rPeriod, setRPeriod] = useState("This Month");
  const [rFormat, setRFormat] = useState("PDF");
  const [rWeavers, setRWeavers] = useState("All Weavers");
  const [rIncludes, setRIncludes] = useState<Record<string, boolean>>({
    "Batch Summary": true,
    "Making Charges Breakdown": true,
    "Weaver-wise Totals": true,
    "Design-wise Report": false,
    "Defect Analysis": false,
  });

  const TH: React.CSSProperties = { fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", padding: "10px 14px", textAlign: "left" as const, background: "#F3EEE8", borderBottom: `2px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, padding: "11px 14px", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const };

  return (
    <div id="prod-history" style={{ padding: "40px 40px 0" }}>
      <FadeUp>
        <div style={{ background: T.darkBurgundy, borderRadius: "12px 12px 0 0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="7" fill="rgba(200,155,71,0.18)" />
              <rect x="7" y="9"  width="20" height="3" rx="1.5" fill={T.antiqueGold} />
              <rect x="7" y="22" width="20" height="3" rx="1.5" fill={T.antiqueGold} />
              <rect x="11"  y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
              <rect x="14.5" y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
              <rect x="18"  y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
              <rect x="21.5" y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
            </svg>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,253,249,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 2 }}>COMPLETED BATCHES · RECORDS</div>
              <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Production History</h2>
            </div>
          </div>
          <motion.button onClick={() => setShowReportDialog(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: `linear-gradient(135deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.deepWine, boxShadow: "0 2px 12px rgba(200,155,71,0.30)" }}>
            <Download size={14} />Generate Production Report
          </motion.button>
        </div>

        <div style={{ background: "#fff", padding: "12px 24px", borderLeft: `1px solid ${T.borderDef}`, borderRight: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <HistoryDropBtn label="30 Apr 2026 – 30 Apr 2026" icon={<Calendar size={14} style={{ color: T.royalBurgundy }} />} />
          <HistoryDropBtn label="All Saree Types" />
          <HistoryDropBtn label="All Weavers" icon={<Users size={14} style={{ color: T.royalBurgundy }} />} />
          <HistoryDropBtn label="All Orders" />
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..."
              style={{ width: "100%", padding: "7px 12px 7px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#FAFAFA", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        <div style={{ background: T.silkCream, padding: "10px 24px", borderLeft: `1px solid ${T.borderDef}`, borderRight: `1px solid ${T.borderDef}`, borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>
            Showing <strong style={{ color: T.luxuryBrown }}>1 to 10</strong> of <strong style={{ color: T.luxuryBrown }}>25</strong> completed batches
          </span>
          <div style={{ display: "flex", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Completed:</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>25</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Making Charges:</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹9,24,930</span>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", border: `1px solid ${T.borderDef}`, borderTop: "none", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.07)", background: T.warmIvory }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1060 }}>
            <thead>
              <tr>
                <th style={TH}>Batch Number</th>
                <th style={TH}>Saree Type</th>
                <th style={{ ...TH, textAlign: "center" }}>Batch Size</th>
                <th style={TH}>Weavers</th>
                <th style={{ ...TH, textAlign: "center" }}>Completion</th>
                <th style={{ ...TH, textAlign: "center" }}>All Pieces</th>
                <th style={{ ...TH, textAlign: "right" }}>Making Charges</th>
                <th style={TH}>Completed On</th>
                <th style={{ ...TH, textAlign: "center" }}>Bulk Order</th>
                <th style={{ ...TH, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY_BATCHES.filter(b =>
                !search || b.id.toLowerCase().includes(search.toLowerCase()) || b.sareeType.toLowerCase().includes(search.toLowerCase())
              ).map((b, i) => (
                <tr key={b.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : "#F8F4EF", borderBottom: `1px solid ${T.borderDef}` }}>
                  <td style={TD}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{b.id}</span>
                  </td>
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="3" width="12" height="8" rx="1.5" stroke={T.antiqueGold} strokeWidth="1.2" fill="none" />
                        <line x1="1" y1="5.5" x2="13" y2="5.5" stroke={T.antiqueGold} strokeWidth="0.8" />
                        <line x1="1" y1="8.5" x2="13" y2="8.5" stroke={T.antiqueGold} strokeWidth="0.8" />
                      </svg>
                      {(() => {
                        const rec = getSareeTypeByName(b.sareeType);
                        return (
                          <ClickableCode onClick={rec && onSareeTypeClick ? () => onSareeTypeClick(rec.code) : undefined} style={{ fontSize: 12.5, fontWeight: 500 }}>{b.sareeType}</ClickableCode>
                        );
                      })()}
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <HistoryBatchSquares size={b.batchSize} />
                    </div>
                  </td>
                  <td style={TD}>
                    <div style={{ display: "flex" }}>
                      {b.weavers.map((w, wi) => (
                        <div key={wi} style={{ marginLeft: wi > 0 ? -8 : 0 }}>
                          <Pip initials={w.initials} bg={w.bg} size={26} />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>{b.completion}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{b.allPieces}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13 }}>{b.makingCharges}</span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{b.completedOn}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {b.bulkOrder
                      ? <span style={{ fontFamily: F.mono, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>{b.bulkOrder}</span>
                      : <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, fontStyle: "italic" }}>General Stock</span>}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <motion.button whileHover={{ scale: 1.08 }} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${T.borderDef}`, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.royalBurgundy }}>
                      <Eye size={13} />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: `1px solid ${T.borderDef}` }}>
            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Showing 1 to 10 of 25 entries</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["Prev", "1", "2", "3", "Next"].map(p => (
                <button key={p} onClick={() => typeof p === "string" && !isNaN(Number(p)) && setCurrentPage(Number(p))}
                  style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${p === String(currentPage) ? T.royalBurgundy : T.borderDef}`, background: p === String(currentPage) ? T.royalBurgundy : "#fff", color: p === String(currentPage) ? "#FFFDF9" : T.luxuryBrown, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Rows per page</span>
              <HistoryDropBtn label="10" />
            </div>
          </div>
        </div>
      </FadeUp>

      <AnimatePresence>
        {showReportDialog && (
          <ProductionDialog open title="Generate Production Report" onClose={() => setShowReportDialog(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Report Period</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Today", "This Week", "This Month", "Last 3 Months", "This Year"].map(p => (
                    <motion.button key={p} onClick={() => setRPeriod(p)} whileHover={{ scale: 1.03 }}
                      style={{ padding: "8px 14px", borderRadius: 99, border: rPeriod === p ? "none" : `1.5px solid rgba(110,15,45,0.18)`, background: rPeriod === p ? T.royalBurgundy : "transparent", color: rPeriod === p ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                      {p}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Weaver</div>
                <select value={rWeavers} onChange={e => setRWeavers(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "0 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none" }}>
                  <option>All Weavers</option>
                  <option>Padma Veni</option>
                  <option>Ravi Kumar</option>
                  <option>Suresh Murti</option>
                  <option>Anand K.</option>
                  <option>Own Factory</option>
                </select>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Include in Report</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {Object.entries(rIncludes).map(([key, checked]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "9px 14px", borderRadius: 10, background: checked ? "rgba(110,15,45,0.05)" : "transparent", border: `1px solid ${checked ? "rgba(110,15,45,0.16)" : T.borderDef}`, transition: "all 0.15s" }}>
                      <input type="checkbox" checked={checked} onChange={() => setRIncludes(prev => ({ ...prev, [key]: !prev[key] }))}
                        style={{ width: 16, height: 16, accentColor: T.royalBurgundy, cursor: "pointer" }} />
                      <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: checked ? 700 : 400, color: checked ? T.luxuryBrown : T.taupe }}>{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                    <motion.button key={fmt} onClick={() => setRFormat(fmt)} whileHover={{ scale: 1.03 }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: rFormat === fmt ? "none" : `1.5px solid ${T.borderDef}`, background: rFormat === fmt ? T.royalBurgundy : "transparent", color: rFormat === fmt ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
                      {fmt}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowReportDialog(false)}
                  style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${T.antiqueGold} 0%, #B88730 100%)`, color: T.deepWine, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(200,155,71,0.28)" }}>
                  <Download size={17} /> Generate &amp; Download
                </motion.button>
                <motion.button onClick={() => setShowReportDialog(false)} whileHover={{ scale: 1.02 }}
                  style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  Cancel
                </motion.button>
              </div>
            </div>
          </ProductionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
