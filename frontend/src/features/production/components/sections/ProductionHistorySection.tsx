import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Calendar, Users, Download, Eye } from "lucide-react";
import { getSareeTypeByName } from "../../../pricing/components/RatesPricingPage";
import { T, F } from "../theme";
import type { CodeCallbacks } from "../types";
import type { HistoryBatch } from "../types";
import { useBatches } from "../../contexts/BatchContext";
import { qcApi } from "../../../../shared/api/qc";
import { FadeUp, Pip, ClickableCode, ProductionDialog } from "../common/primitives";
import { Button, SearchInput, Select, SelectItem, Checkbox, IconButton } from "../../../../shared/ui/primitives";

const PIP_COLORS = ["#7C3AED", T.royalBurgundy, T.taupe, "#B45309"];

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
    <Button variant="secondary" size="sm" className="whitespace-nowrap">
      {icon}{label}<ChevronDown size={14} style={{ color: T.taupe }} />
    </Button>
  );
}

export function ProductionHistorySection({ onSareeTypeClick }: CodeCallbacks) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { batches } = useBatches();
  const { data: qcRecords = [], isLoading: qcLoading } = useQuery({
    queryKey: ["qc", "all"],
    queryFn: () => qcApi.list().then(r => r.items),
  });

  // History table shows finalized (completed) batches only. Per-saree QC
  // outcomes (okPieces/found, making charges) come from real QC records
  // joined by batchId — there is no separate "printing"/"embossing"
  // workflow tracked by the backend, so status is simply "Printing
  // Completed" for every finalized batch here (kept for label continuity
  // with the rest of the section's styling, not a tracked backend state).
  const HISTORY_BATCHES: HistoryBatch[] = useMemo(() => {
    const completed = batches.filter(b => b.status === "completed");
    return completed.map((b): HistoryBatch => {
      const batchQc = qcRecords.filter(r => r.batchId === b.batchId);
      const okPieces = batchQc.filter(r => r.result === "PASSED" || r.result === "SEMI").length;
      const found = batchQc.filter(r => r.result === "DEFECTIVE").length;
      const makingCharges = batchQc.reduce((sum, r) => sum + Number(r.makingCharge), 0);

      const seenWeavers = new Map<string, { initials: string; bg: string }>();
      b.rows.forEach(r => {
        if (r.weaverId && r.weaverInitials && !seenWeavers.has(r.weaverId)) {
          seenWeavers.set(r.weaverId, { initials: r.weaverInitials, bg: PIP_COLORS[seenWeavers.size % PIP_COLORS.length]! });
        }
      });
      const firstRow = b.rows.find(r => r.sareeTypeName || r.designCode);

      return {
        id: b.batchId,
        designCode: firstRow?.designCode ?? "—",
        sareeType: firstRow?.sareeTypeName ?? "—",
        batchSize: b.totalCount,
        weavers: Array.from(seenWeavers.values()),
        completion: b.rows.filter(r => r.sareeId).length,
        allPieces: b.totalCount,
        okPieces: batchQc.length > 0 ? okPieces : null,
        found: batchQc.length > 0 ? found : null,
        status: "Printing Completed",
        makingCharges: `₹${makingCharges.toLocaleString("en-IN")}`,
        completedOn: new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        bulkOrder: b.rows.find(r => r.bulkOrderRef)?.bulkOrderRef ?? undefined,
      };
    });
  }, [batches, qcRecords]);
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

  const TH: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", padding: "10px 14px", textAlign: "left" as const, background: "#F3EEE8", borderBottom: `2px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, padding: "11px 14px", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const };

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
              <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 2 }}>COMPLETED BATCHES · RECORDS</div>
              <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Production History</h2>
            </div>
          </div>
          <Button onClick={() => setShowReportDialog(true)} variant="secondary" size="sm">
            <Download size={14} />Generate Production Report
          </Button>
        </div>

        <div style={{ background: "#fff", padding: "12px 24px", borderLeft: `1px solid ${T.borderDef}`, borderRight: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <HistoryDropBtn label="30 Apr 2026 – 30 Apr 2026" icon={<Calendar size={14} style={{ color: T.royalBurgundy }} />} />
          <HistoryDropBtn label="All Saree Types" />
          <HistoryDropBtn label="All Weavers" icon={<Users size={14} style={{ color: T.royalBurgundy }} />} />
          <HistoryDropBtn label="All Orders" />
          <div style={{ flex: 1, minWidth: 180 }}>
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..." />
          </div>
        </div>

        <div style={{ background: T.silkCream, padding: "10px 24px", borderLeft: `1px solid ${T.borderDef}`, borderRight: `1px solid ${T.borderDef}`, borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>
            Showing <strong style={{ color: T.luxuryBrown }}>{HISTORY_BATCHES.length}</strong> of <strong style={{ color: T.luxuryBrown }}>{HISTORY_BATCHES.length}</strong> completed batches
          </span>
          <div style={{ display: "flex", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Completed:</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{HISTORY_BATCHES.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Making Charges:</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>
                ₹{HISTORY_BATCHES.reduce((sum, b) => sum + parseInt(b.makingCharges.replace(/[₹,]/g, "") || "0", 10), 0).toLocaleString("en-IN")}
              </span>
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
              {qcLoading && (
                <tr><td colSpan={10} style={{ ...TD, textAlign: "center", color: T.taupe }}>Loading production history…</td></tr>
              )}
              {!qcLoading && HISTORY_BATCHES.length === 0 && (
                <tr><td colSpan={10} style={{ ...TD, textAlign: "center", color: T.taupe }}>No completed batches yet.</td></tr>
              )}
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
                          <ClickableCode onClick={rec && onSareeTypeClick ? () => onSareeTypeClick(rec.code) : undefined} style={{ fontSize: 12, fontWeight: 500 }}>{b.sareeType}</ClickableCode>
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
                      ? <span style={{ fontFamily: F.mono, fontSize: 12, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>{b.bulkOrder}</span>
                      : <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>General Stock</span>}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <IconButton icon={Eye} label="View batch" variant="secondary" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: `1px solid ${T.borderDef}` }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Showing {HISTORY_BATCHES.length} of {HISTORY_BATCHES.length} entries</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["Prev", "1", "2", "3", "Next"].map(p => (
                <Button key={p} onClick={() => typeof p === "string" && !isNaN(Number(p)) && setCurrentPage(Number(p))}
                  variant={p === String(currentPage) ? "primary" : "secondary"} size="sm">
                  {p}
                </Button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Rows per page</span>
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
                    <Button key={p} onClick={() => setRPeriod(p)} variant={rPeriod === p ? "primary" : "tertiary"} size="sm">
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Weaver</div>
                <Select value={rWeavers} onValueChange={setRWeavers}>
                  <SelectItem value="All Weavers">All Weavers</SelectItem>
                  <SelectItem value="Padma Veni">Padma Veni</SelectItem>
                  <SelectItem value="Ravi Kumar">Ravi Kumar</SelectItem>
                  <SelectItem value="Suresh Murti">Suresh Murti</SelectItem>
                  <SelectItem value="Anand K.">Anand K.</SelectItem>
                  <SelectItem value="Own Factory">Own Factory</SelectItem>
                </Select>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Include in Report</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {Object.entries(rIncludes).map(([key, checked]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "9px 14px", borderRadius: 10, background: checked ? "rgba(110,15,45,0.05)" : "transparent", border: `1px solid ${checked ? "rgba(110,15,45,0.16)" : T.borderDef}`, transition: "all 0.15s" }}>
                      <Checkbox checked={checked} onCheckedChange={() => setRIncludes(prev => ({ ...prev, [key]: !prev[key] }))} />
                      <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? T.luxuryBrown : T.taupe }}>{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                    <Button key={fmt} onClick={() => setRFormat(fmt)} variant={rFormat === fmt ? "primary" : "tertiary"} fullWidth>
                      {fmt}
                    </Button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={() => setShowReportDialog(false)} variant="primary" size="lg" className="flex-[2]">
                  <Download size={17} /> Generate &amp; Download
                </Button>
                <Button onClick={() => setShowReportDialog(false)} variant="tertiary" size="lg" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </ProductionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
