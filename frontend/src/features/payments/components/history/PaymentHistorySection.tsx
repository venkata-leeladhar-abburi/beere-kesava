import React, { useState } from "react";
import { AlignJustify, ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Download, Eye, LayoutGrid, LayoutList, Receipt, Search, TrendingUp, X } from "lucide-react";
import { motion } from "motion/react";

import { DownloadGate } from "../../../../app/components/DownloadAccess";
import { PAY_HISTORY } from "../../data/history";
import { EASE, F, T, DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../theme";
import { Invoice } from "../../types";
import { FadeUp } from "../common/motion";
import { HIST_STATUS_CFG, HIST_TYPE_CFG, HistoryCard, getHistTypeIcon } from "./HistoryCard";

export function PaymentHistorySection() {
  const [dateFilter,   setDateFilter]   = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [typeFilter,   setTypeFilter]   = useState("All Payment Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [search,       setSearch]       = useState("");
  const [view,         setView]         = useState<"card" | "list" | "table">("card");
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 10;

  const filtered = PAY_HISTORY.filter(r => {
    if (typeFilter   !== "All Payment Types" && r.type   !== typeFilter)   return false;
    if (statusFilter !== "All Statuses"      && r.status !== statusFilter) return false;
    if (!matchesDateFilter(r.date, dateFilter)) return false;
    if (search && !r.party.toLowerCase().includes(search.toLowerCase()) &&
        !r.refNo.toLowerCase().includes(search.toLowerCase()) &&
        !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIn  = filtered.filter(r => r.type === "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalOut = filtered.filter(r => r.type !== "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalAmt = filtered.reduce((s, r) => s + r.amount, 0);
  const netFlow  = totalIn - totalOut;

  const clearFilters = () => { setTypeFilter("All Payment Types"); setStatusFilter("All Statuses"); setSearch(""); setDateFilter(DEFAULT_DATE_FILTER); };

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", padding: "13px 14px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "13px 14px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

  const viewOptions = [
    { key: "card"  as const, Icon: LayoutGrid,   label: "Card View"  },
    { key: "list"  as const, Icon: LayoutList,   label: "List View"  },
    { key: "table" as const, Icon: AlignJustify, label: "Table View" },
  ];

  const HIST_STATS = [
    { icon: <ArrowDownCircle size={22} color={T.green}         />, iconBg: T.greenBg,                 iconBorder: "rgba(30,102,64,0.18)",  label: "Total Collected",  value: `₹${totalIn.toLocaleString("en-IN")}`,           sub: "Customer receipts · period", color: T.green,         hi: false },
    { icon: <ArrowUpCircle   size={22} color={T.crimson}       />, iconBg: T.crimsonBg,               iconBorder: "rgba(192,57,43,0.18)",  label: "Total Paid Out",   value: `₹${totalOut.toLocaleString("en-IN")}`,          sub: "Vendor & weaver payments",   color: T.crimson,       hi: false },
    { icon: <TrendingUp      size={22} color={T.antiqueGold}   />, iconBg: "rgba(200,155,71,0.12)",   iconBorder: T.borderGold,            label: "Net Cash Flow",    value: `₹${Math.abs(netFlow).toLocaleString("en-IN")}`, sub: netFlow >= 0 ? "Positive flow" : "Net outflow", color: netFlow >= 0 ? T.green : T.crimson, hi: true },
  ];

  return (
    <div id="pay-history" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99, flexShrink: 0 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Payment History
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Complete history of all payments made and received. Use filters to find specific transactions.
            </p>
          </div>
          <DownloadGate>
            <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
              <Download size={15} color={T.antiqueGold} />Download All Transactions
            </button>
          </DownloadGate>
        </div>

        {/* ── 4 Summary stat cards ───────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 22, alignItems: "stretch" }}>
          {HIST_STATS.map(s => (
            <div key={s.label} style={{
              display: "flex", flexDirection: "column", gap: 10,
              background: s.hi ? `linear-gradient(145deg,${T.warmCream},#FDF6E4)` : T.warmIvory,
              borderRadius: 16,
              border: s.hi ? `1px solid ${T.borderGold}` : `1px solid ${T.borderDef}`,
              borderTop: s.hi ? `3px solid ${T.antiqueGold}` : `1px solid ${T.borderDef}`,
              boxShadow: s.hi ? "0 4px 20px rgba(200,155,71,0.12)" : "0 2px 12px rgba(74,6,27,0.06)",
              padding: "20px",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, border: `1px solid ${s.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, lineHeight: 1.4 }}>{s.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: "auto" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Filter bar ──────────────────────────────────────── */}
        <div style={{ background: T.warmIvory, borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>

            {/* View toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: T.warmCream, borderRadius: 9, padding: 3, border: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              {viewOptions.map(({ key, Icon: Ico, label }) => (
                <button key={key} onClick={() => setView(key)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7, border: "none", background: view === key ? T.royalBurgundy : "transparent", color: view === key ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                  <Ico size={14} />{label}
                </button>
              ))}
            </div>

            {/* Type dropdown */}
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ height: 38, padding: "0 12px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", cursor: "pointer" }}>
              {["All Payment Types","Vendor Payment","Weaver Payment","Customer Receipt"].map(o => <option key={o}>{o}</option>)}
            </select>

            {/* Status dropdown */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ height: 38, padding: "0 12px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", cursor: "pointer" }}>
              {["All Statuses","Paid","Partial","Pending"].map(o => <option key={o}>{o}</option>)}
            </select>

            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, position: "relative" as const }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search party, ref no, description..."
                style={{ width: "100%", height: 38, padding: "0 12px 0 36px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
            </div>

            {/* Clear */}
            <button onClick={clearFilters}
              style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 15px", border: `1px solid ${T.borderDef}`, borderRadius: 8, background: T.silkCream, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              <X size={13} />Clear
            </button>
          </div>

          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        {/* ── CARD VIEW ───────────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, alignItems: "stretch", marginBottom: 32 }}>
            {filtered.map((r, i) => (
              <motion.div key={r.id} style={{ display: "flex", flexDirection: "column" }}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}>
                <HistoryCard r={r} />
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center" as const }}>
                <Receipt size={40} color={T.borderDef} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe }}>No transactions match your filters.</div>
              </div>
            )}
          </div>
        )}

        {/* ── LIST VIEW ────────────────────────────────────────── */}
        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" as const }}>
                <Receipt size={40} color={T.borderDef} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe }}>No transactions match your filters.</div>
              </div>
            ) : filtered.map((r, i) => {
              const typeCfg = HIST_TYPE_CFG[r.type];
              const stsCfg  = HIST_STATUS_CFG[r.status];
              const { Icon: HistIcon, color: iconColor, iconBg } = getHistTypeIcon(r.type);
              const isReceipt = r.type === "Customer Receipt";
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                    background: i % 2 === 0 ? "#FFFDF9" : T.silkCream,
                    borderBottom: `1px solid ${T.borderDef}`,
                    borderLeft: `4px solid ${typeCfg.border}`,
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: iconBg, border: `1px solid ${typeCfg.border}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <HistIcon size={18} color={iconColor} />
                  </div>

                  {/* Party + Type */}
                  <div style={{ flex: "0 0 200px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.party}</div>
                    <span style={{ display: "inline-block", marginTop: 3, padding: "2px 8px", borderRadius: 6, fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color }}>{r.type}</span>
                  </div>

                  {/* Description */}
                  <div style={{ flex: 1, fontFamily: F.ui, fontSize: 13, color: T.taupe, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {r.description}
                  </div>

                  {/* Ref + PO */}
                  <div style={{ flex: "0 0 130px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.royalBurgundy, fontWeight: 600 }}>{r.refNo}</div>
                    {r.invoicePO && <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>{r.invoicePO}</div>}
                  </div>

                  {/* Date */}
                  <div style={{ flex: "0 0 100px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{r.date}</div>

                  {/* Amount */}
                  <div style={{ flex: "0 0 120px", textAlign: "right" as const }}>
                    <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: isReceipt ? T.green : T.crimson }}>
                      {isReceipt ? "+" : "−"}₹{r.amount.toLocaleString("en-IN")}
                    </div>
                    {r.utr && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.green, marginTop: 2 }}>{r.utr}</div>}
                  </div>

                  {/* Status badge */}
                  <span style={{ display: "inline-block", padding: "4px 11px", borderRadius: 20, fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, background: stsCfg.bg, color: stsCfg.color, flexShrink: 0 }}>
                    {r.status === "Paid" ? "✓ Paid" : r.status === "Partial" ? "◑ Partial" : "⏱ Pending"}
                  </span>

                  {/* Mode + Recorded */}
                  <div style={{ flex: "0 0 100px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                    <div>{r.mode}</div>
                    <div style={{ marginTop: 2, fontSize: 11 }}>{r.recordedBy}</div>
                  </div>

                  {/* View button */}
                  <button style={{ padding: "6px 14px", border: `1px solid ${T.borderDef}`, borderRadius: 8, background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer", flexShrink: 0 }}>
                    <Eye size={13} />
                  </button>
                </motion.div>
              );
            })}
            {/* Summary footer */}
            {filtered.length > 0 && (
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmCream }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{filtered.length} transaction{filtered.length > 1 ? "s" : ""}</span>
                <div style={{ display: "flex", gap: 24 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 13, color: T.green, fontWeight: 700 }}>+₹{totalIn.toLocaleString("en-IN")}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 13, color: T.crimson, fontWeight: 700 }}>−₹{totalOut.toLocaleString("en-IN")}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 13, color: netFlow >= 0 ? T.green : T.crimson, fontWeight: 700, borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 24 }}>Net: {netFlow >= 0 ? "+" : "−"}₹{Math.abs(netFlow).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ──────────────────────────────────────── */}
        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
                <thead>
                  <tr>
                    <th style={TH}>Date</th>
                    <th style={TH}>Payment Type</th>
                    <th style={TH}>Party Name</th>
                    <th style={TH}>Reference No</th>
                    <th style={{ ...TH, maxWidth: 200 }}>Description</th>
                    <th style={TH}>Invoice / PO No</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Amount (₹)</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Status</th>
                    <th style={TH}>Payment Mode</th>
                    <th style={TH}>UTR / Ref No</th>
                    <th style={TH}>Recorded By</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const typeCfg = HIST_TYPE_CFG[r.type];
                    const stsCfg  = HIST_STATUS_CFG[r.status];
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${typeCfg.border}` }}>
                        <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{r.date}</span></td>
                        <td style={TD}>
                          <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color, whiteSpace: "nowrap" as const }}>{r.type}</span>
                        </td>
                        <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.party}</span></td>
                        <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.refNo}</span></td>
                        <td style={{ ...TD, maxWidth: 200 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: 200 }}>{r.description}</span>
                        </td>
                        <td style={TD}>
                          {r.invoicePO
                            ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.invoicePO}</span>
                            : <span style={{ color: T.borderDef }}>—</span>
                          }
                        </td>
                        <td style={{ ...TD, textAlign: "right" as const }}>
                          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: r.type === "Customer Receipt" ? T.green : T.crimson }}>
                            {r.type !== "Customer Receipt" && "−"}₹{r.amount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td style={{ ...TD, textAlign: "center" as const }}>
                          <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.mono, fontSize: 12, fontWeight: 700, background: stsCfg.bg, color: stsCfg.color }}>
                            {r.status === "Paid" ? "✓ Paid" : r.status === "Partial" ? "◑ Partial" : "⏱ Pending"}
                          </span>
                        </td>
                        <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.mode}</span></td>
                        <td style={TD}>
                          {r.utr
                            ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.green }}>{r.utr}</span>
                            : <span style={{ fontFamily: F.ui, fontSize: 13, color: T.borderDef }}>—</span>
                          }
                        </td>
                        <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.recordedBy}</span></td>
                        <td style={{ ...TD, textAlign: "center" as const }}>
                          <button
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px",
                              border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8,
                              background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                              color: T.royalBurgundy, cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.04)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(110,15,45,0.12)"; }}
                          >
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: T.darkBurgundy }}>
                    <td colSpan={5} style={{ ...TD, background: T.darkBurgundy, fontSize: 13, fontWeight: 700, color: "#FFFDF9", padding: "14px 14px", borderBottom: "none" }}>
                      TOTALS FOR SELECTED PERIOD
                    </td>
                    <td style={{ ...TD, background: T.darkBurgundy, borderBottom: "none" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.50)" }}>{filtered.length} rows</span>
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, background: T.darkBurgundy, borderBottom: "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight }}>+₹{totalIn.toLocaleString("en-IN")}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: "#F47B72"  }}>−₹{totalOut.toLocaleString("en-IN")}</span>
                        <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.antiqueGold }}>₹{totalAmt.toLocaleString("en-IN")}</span>
                      </div>
                    </td>
                    <td colSpan={5} style={{ ...TD, background: T.darkBurgundy, borderBottom: "none" }} />
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmIvory }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                Showing {Math.min(PER_PAGE, filtered.length)} of {filtered.length} results
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 13px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  <ChevronLeft size={14} />Prev
                </button>
                {[1,2,3].map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${page===p ? T.royalBurgundy : T.borderDef}`, background: page===p ? T.royalBurgundy : "#fff", color: page===p ? "#FFFDF9" : T.luxuryBrown, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{p}</button>
                ))}
                <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 13px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  Next<ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </FadeUp>
    </div>
  );
}
