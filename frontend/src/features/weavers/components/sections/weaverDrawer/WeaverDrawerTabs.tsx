// ── Non-overview tabs for the weaver profile drawer (batches / dispatches / payments / materials) ─
import React from "react";
import { Calendar, Check, Clock } from "lucide-react";
import { Send as PaperPlaneTilt } from "lucide-react";
import { T, F } from "../../theme";
import { SectionPill } from "../../common/primitives";
import { DateFilterBar } from "../../../../../shared/ui/DateFilterBar";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { materialItemToGrams, BUNS_PER_REEL, MaterialIssueRecord, BatchMaterialSummary } from "@/features/materials";
import { formatBunsReels } from "@/shared/lib/weightUnits";
import { BatchRecord, SareeRow } from "@/features/production";
import { DispatchRecord } from "@/features/design-library";
import { WeaverPaymentRecord } from "../../../contexts/WeaverPaymentsContext";
import { WeaverCardEntry } from "../../data";
import { DateFilterState } from "../../../../../shared/ui/DateFilterBar";

export function BatchesTab({ sortedAllWeaverBatches, dispatches, weaver, batchDateFilter, setBatchDateFilter, setViewDispatches, onNavigate }: {
  sortedAllWeaverBatches: BatchRecord[];
  dispatches: DispatchRecord[];
  weaver: WeaverCardEntry;
  batchDateFilter: DateFilterState;
  setBatchDateFilter: (f: DateFilterState) => void;
  setViewDispatches: (v: { weaverName: string; records: DispatchRecord[] }) => void;
  onNavigate?: (tab: string) => void;
}) {
  return (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionPill label="All Batches & Assigned Sarees" />
              <DateFilterBar filter={batchDateFilter} onChange={setBatchDateFilter} />
              {sortedAllWeaverBatches.length > 0 ? (
                sortedAllWeaverBatches.map(b => {
                  const weaverSareesInBatch = b.rows.filter(r => r.weaverId === weaver.id);
                  const batchDispatches = dispatches.filter(d => d.recipientType === "weaver" && d.recipientId === weaver.id && d.batches.includes(b.batchId));
                  const completedSareesInBatch = weaverSareesInBatch.filter(r => r.qcPassed === true).length;
                  const pct = weaverSareesInBatch.length > 0 ? Math.round((completedSareesInBatch / weaverSareesInBatch.length) * 100) : 0;
                  const statusBg = b.status === "completed" ? "rgba(30,102,64,0.08)" : b.status === "active" ? "rgba(200,155,71,0.08)" : "rgba(139,112,96,0.08)";
                  const statusColor = b.status === "completed" ? T.green : b.status === "active" ? T.royalBurgundy : T.taupe;

                  return (
                    <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                      {/* Batch Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, background: statusBg, color: statusColor, borderRadius: 6, padding: "3px 8px", fontWeight: 700, textTransform: "uppercase" }}>{b.status}</span>
                        </div>
                        {b.dueDate && (
                          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                            Due Date: {b.dueDate}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Progress: {completedSareesInBatch} of {weaverSareesInBatch.length} sarees done</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.antiqueGold }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }} />
                      </div>

                      {/* Saree Info Table */}
                      <div className="min-w-[500px]" style={{ overflowX: "auto", border: `1px solid ${T.borderDef}`, borderRadius: 10, background: "#FFFFFF" }}>
                        <DataTable
                          responsive
                          pagination
                          columns={[
                            {
                              id: "sareeId", header: "Saree ID", accessor: (row: SareeRow) => row.sareeId, priority: 1,
                              cell: (_v, row: SareeRow) => row.sareeId
                                ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 5, padding: "2px 6px" }}>{row.sareeId}</span>
                                : <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 12 }}>—</span>,
                            },
                            {
                              id: "loom", header: "Loom", accessor: (row: SareeRow) => row.weaverLoom,
                              cell: (_v, row: SareeRow) => row.weaverLoom
                                ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.antiqueGold }}>L{row.weaverLoom}</span>
                                : <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 12 }}>—</span>,
                            },
                            {
                              id: "sareeTypeCode", header: "Saree Type", accessor: (row: SareeRow) => row.sareeTypeCode,
                              cell: (_v, row: SareeRow) => row.sareeTypeCode
                                ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.luxuryBrown }}>{row.sareeTypeCode}</span>
                                : <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 12 }}>—</span>,
                            },
                            {
                              id: "bulkOrder", header: "Bulk Order", accessor: (row: SareeRow) => row.bulkOrderLabel, priority: 3,
                              cell: (_v, row: SareeRow) => (
                                <span style={{ fontFamily: F.ui, fontSize: 12, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600 }}>
                                  {row.bulkOrderLabel || "General Stock"}
                                </span>
                              ),
                            },
                            {
                              id: "dispatch", header: "Design Dispatch", accessor: () => null,
                              cell: (_v, row: SareeRow) => (weaverSareesInBatch.indexOf(row) === 0 && batchDispatches.length > 0) ? (
                                <Button onClick={() => setViewDispatches({ weaverName: weaver.name, records: batchDispatches })}
                                  variant="ghost" size="sm"
                                  className="h-auto rounded-md bg-[rgba(110,15,45,0.08)] text-[#6E0F2D] px-[9px] py-[3px] text-[12px] font-bold">
                                  <PaperPlaneTilt size={11} /> {batchDispatches.length} Dispatch{batchDispatches.length > 1 ? "es" : ""}
                                </Button>
                              ) : (
                                <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 12 }}>—</span>
                              ),
                            },
                            {
                              id: "qc", header: "QC Status", accessor: (row: SareeRow) => row.qcPassed,
                              cell: (_v, row: SareeRow) => {
                                let qcLabel = "In Production";
                                let qcBg = "rgba(139,112,96,0.08)";
                                let qcColorVal: string = T.taupe;
                                if (row.qcPassed === true) {
                                  qcLabel = "QC Passed"; qcBg = "rgba(30,102,64,0.08)"; qcColorVal = T.green;
                                } else if (row.qcPassed === false) {
                                  qcLabel = "QC Failed"; qcBg = "rgba(192,57,43,0.08)"; qcColorVal = T.crimson;
                                }
                                return (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: qcColorVal, background: qcBg, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>
                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: qcColorVal }} />
                                    {qcLabel}
                                  </span>
                                );
                              },
                            },
                          ] as ColumnDef<SareeRow>[]}
                          data={weaverSareesInBatch}
                          getRowId={(row: SareeRow) => row.sareeId || String(weaverSareesInBatch.indexOf(row))}
                          emptyTitle="No sarees in this batch"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                  No batch history found for this weaver.
                </div>
              )}
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, cursor: "pointer", textAlign: "right", marginTop: 8 }} onClick={() => onNavigate?.("Production")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => onNavigate?.("Production"))?.(); } }}>See All Batches →</div>
            </div>
  );
}

export function DispatchesTab({ dispatchGroups, dispatchDateFilter, setDispatchDateFilter, setZoomImage }: {
  dispatchGroups: { batchId: string; records: DispatchRecord[] }[];
  dispatchDateFilter: DateFilterState;
  setDispatchDateFilter: (f: DateFilterState) => void;
  setZoomImage: (v: { url: string; label: string }) => void;
}) {
  return (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionPill label="Design Dispatches Sent to This Weaver" />
              <DateFilterBar filter={dispatchDateFilter} onChange={setDispatchDateFilter} />
              {dispatchGroups.length > 0 ? (
                dispatchGroups.map(group => (
                  <div key={group.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{group.batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{group.records.length} dispatch{group.records.length > 1 ? "es" : ""}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {group.records.map(h => (
                        <div key={h.id} style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{h.id}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                              <Calendar size={12} /> Sent on {h.sentAt}
                            </div>
                          </div>
                          <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid rgba(110,15,45,0.06)`, borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.5 }}>
                            <strong>Instructions:</strong> {h.instructions}
                          </div>
                          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" as const }}>
                            {h.colorSlipImage && (
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                                <button type="button" onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — ${h.id}` })} style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}>
                                  <img src={h.colorSlipImage} alt="Color slip" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
                                </button>
                              </div>
                            )}
                            {h.designGraphImage && (
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                                <button type="button" onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — ${h.id}` })} style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}>
                                  <img src={h.designGraphImage} alt="Design graph" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
                                </button>
                              </div>
                            )}
                            {!h.colorSlipImage && !h.designGraphImage && (
                              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>No files attached</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}` }}>
                  No design dispatches found for this weaver.
                </div>
              )}
            </div>
  );
}

export function PaymentsTab({ weaver, weaverPayments, filteredWeaverPayments, paymentDateFilter, setPaymentDateFilter }: {
  weaver: WeaverCardEntry;
  weaverPayments: WeaverPaymentRecord[];
  filteredWeaverPayments: WeaverPaymentRecord[];
  paymentDateFilter: DateFilterState;
  setPaymentDateFilter: (f: DateFilterState) => void;
}) {
  return (
            <div>
              <SectionPill label="Payment Overview" />
              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown }}>Total Paid Ever</div>
                  <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown }}>{weaver.totalPaid}</div>
                </div>
              </div>

              <SectionPill label="Payment History" />
              <DateFilterBar filter={paymentDateFilter} onChange={setPaymentDateFilter} />
              {filteredWeaverPayments.length === 0 ? (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" }}>
                  {weaverPayments.length === 0 ? "No payment records found. Payments appear here after Excel upload on the Payments page." : "No payments found for the selected period."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredWeaverPayments.map(p => (
                    <div key={p.id} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Amount Paid</div>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.green }}>{formatMoney(rupees(p.amountPaid))}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>UTR Number</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.luxuryBrown }}>{p.utrNumber || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Firm Name</div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{p.firmName}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Payment Date</div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{p.paymentDate}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Batch No.</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.luxuryBrown }}>{p.batchNo || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Loom Number</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.luxuryBrown }}>{p.loomNumber || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>No. of Sarees</div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{p.noOfSarees ?? "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>Deduction</div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: p.deduction ? T.crimson : T.luxuryBrown }}>{p.deduction ? formatMoney(rupees(p.deduction)) : "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
  );
}

export function MaterialsTab({ materialRecords, materialByBatch, totalRecordCount, materialDateFilter, setMaterialDateFilter }: {
  /** Handover records already narrowed to the active date window. */
  materialRecords: MaterialIssueRecord[];
  /** Batch summaries for the batches represented in {@link materialRecords}. */
  materialByBatch: BatchMaterialSummary[];
  /** Unfiltered handover count, so the results line can read "N of M". */
  totalRecordCount: number;
  materialDateFilter: DateFilterState;
  setMaterialDateFilter: (f: DateFilterState) => void;
}) {
  const filterActive = materialDateFilter.mode !== "all";
  return (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionPill label="Materials Issued — Batch Wise" />
              <DateFilterBar filter={materialDateFilter} onChange={setMaterialDateFilter} />
              {totalRecordCount > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  Showing <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{materialRecords.length}</span> of{" "}
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{totalRecordCount}</span> handover{totalRecordCount !== 1 ? "s" : ""}
                  {filterActive ? " in the selected period" : ""} · issued/returned/outstanding figures below are batch lifetime totals.
                </div>
              )}
              {materialRecords.length === 0 ? (
                <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" }}>
                  {filterActive
                    ? "No material handovers to this weaver in the selected period. Widen the date filter to see more."
                    : "No materials issued to this weaver yet. Use the Issue Material page to record material handovers."}
                </div>
              ) : (() => {
                const fmtKg = (g: number) => `${(g / 1000).toFixed(2)} kg`;
                const recordsByBatch = new Map<string, typeof materialRecords>();
                materialRecords.forEach(r => {
                  const key = r.batchId || "Unassigned";
                  if (!recordsByBatch.has(key)) recordsByBatch.set(key, []);
                  recordsByBatch.get(key)!.push(r);
                });
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {materialByBatch.map(b => {
                      const outColor = b.outstandingGrams > 0 ? T.crimson : T.green;
                      const records = recordsByBatch.get(b.batchId) ?? [];

                      // Break down issued/outstanding by material type. Returns are only
                      // weighed in aggregate per batch (no per-material split at receipt),
                      // so each material's outstanding is apportioned from the batch-level
                      // outstanding in proportion to how much of that material was issued.
                      const byMaterial = new Map<string, { label: string; issuedGrams: number; reels: number }>();
                      records.forEach(r => r.materials.forEach(m => {
                        const key = m.materialType === "Warp" && m.warpSubtype ? `Warp — ${m.warpSubtype}` : m.materialType;
                        if (!byMaterial.has(key)) byMaterial.set(key, { label: key, issuedGrams: 0, reels: 0 });
                        const entry = byMaterial.get(key)!;
                        entry.issuedGrams += materialItemToGrams(m);
                        if (m.materialType === "Jari") {
                          entry.reels += (m.unit || "").toLowerCase().startsWith("bun")
                            ? (m.quantity || 0) / BUNS_PER_REEL
                            : (m.quantity || 0);
                        }
                      }));
                      const outstandingRatio = b.issuedGrams > 0 ? b.outstandingGrams / b.issuedGrams : 0;
                      const materialBreakdown = Array.from(byMaterial.values()).map(entry => ({
                        ...entry,
                        outstandingGrams: entry.issuedGrams * outstandingRatio,
                      }));

                      return (
                        <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
                          {/* Batch header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, flexWrap: "wrap", gap: 10 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 7, padding: "5px 12px" }}>{b.batchId}</span>
                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.sareesReceived} saree{b.sareesReceived !== 1 ? "s" : ""} returned</span>
                          </div>

                          {/* Stats strip — issued / returned / outstanding */}
                          <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                            {[
                              { label: "Issued", value: fmtKg(b.issuedGrams), sub: b.jariReels > 0 ? `incl. ${b.jariReels} jari reels` : undefined, color: T.luxuryBrown },
                              { label: "Returned", value: fmtKg(b.receivedGrams), sub: undefined, color: T.green },
                              { label: "Outstanding", value: fmtKg(b.outstandingGrams), sub: "still with weaver", color: outColor },
                            ].map((s, i) => (
                              <div key={s.label} style={{ padding: "14px 22px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
                                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                                {s.sub && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>{s.sub}</div>}
                              </div>
                            ))}
                          </div>

                          {/* Outstanding broken down per material */}
                          {materialBreakdown.length > 0 && (
                            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
                              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Outstanding by Material</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {materialBreakdown.map(m => {
                                  const mOutColor = m.outstandingGrams > 0 ? T.crimson : T.green;
                                  return (
                                    <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" }}>
                                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{m.label}</span>
                                      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                                        {m.label === "Jari" ? (
                                          <>
                                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                                              Issued: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{formatBunsReels(m.reels)}</span>
                                            </span>
                                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                                              Outstanding: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: mOutColor }}>{formatBunsReels(Math.round(m.reels * outstandingRatio))}</span>
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                                              Issued: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{fmtKg(m.issuedGrams)}</span>
                                            </span>
                                            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                                              Outstanding: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: mOutColor }}>{fmtKg(m.outstandingGrams)}</span>
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Individual handover records for this batch */}
                          <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                            {records.map(r => (
                              <div key={r.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 9px", fontWeight: 700 }}>{r.id}</span>
                                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                  </div>
                                  {r.signatureCaptured ? (
                                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 5 }}><Check size={12} /> Signed</span>
                                  ) : (
                                    <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> Pending</span>
                                  )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                                  {r.materials.map((m) => (
                                    // Material rows carry no persisted id; grnBatchId + materialType uniquely
                                    // identifies each row within a handover record's material list.
                                    <div key={`${m.grnBatchId}-${m.materialType}`} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" }}>
                                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>
                                        {m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}
                                      </span>
                                      {m.description && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{m.description}</span>}
                                      {m.materialType === "Jari" && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{m.jariType} · {m.jariGrade} · {m.jariColor}</span>}
                                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, marginLeft: "auto" }}>{m.quantity} {m.unit}</span>
                                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, background: "rgba(139,112,96,0.10)", borderRadius: 5, padding: "2px 8px" }}>{m.grnBatchId}</span>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Issued by {r.issuedBy}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
  );
}

