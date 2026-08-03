import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Edit2, ArrowLeft, FileText, Factory, Package, Layers, Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useBatches } from "../../contexts/BatchContext";
import { useDesignLibrary, DispatchRecord } from "../../../design-library/contexts/DesignLibraryContext";
import { useMaterialIssue } from "../../../materials/contexts/MaterialIssueContext";
import { useQc } from "../../../qc/contexts/QcContext";
import { DispatchDetailsModal } from "../DispatchDetailsModal";
import { WeaverSareesSection } from "../../../weavers/components/WeaverSareesSection";
import { FactoryLoom } from "../../data/factoryLooms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "./theme";
import { STATUS_CFG } from "./types";

const fmtIssueDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 4 }}>{label}</div>;
}

/**
 * Design dispatches are addressed by a free-form loom label ("Loom 3") in the
 * Design Library, while looms here are identified as FL-00X / "Loom F-01".
 * Accept any of those spellings so existing dispatches still resolve.
 */
function loomDispatchAliases(loom: FactoryLoom): string[] {
  const digits = loom.loomNumber.replace(/[^0-9]/g, "").replace(/^0+/, "");
  return [loom.id, loom.loomNumber, digits ? `Loom ${digits}` : ""].filter(Boolean);
}

export function LoomDetailPage({ loom, onBack, onEdit }: {
  loom: FactoryLoom;
  onBack: () => void;
  onEdit: (l: FactoryLoom) => void;
}) {
  const [tab, setTab] = useState<"overview" | "batches" | "dispatches" | "materials">("overview");
  const [batchDateFilter, setBatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [dispatchDateFilter, setDispatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewDispatches, setViewDispatches] = useState<{ weaverName: string; records: DispatchRecord[] } | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; label: string } | null>(null);

  const { batches } = useBatches();
  const { dispatches } = useDesignLibrary();
  const { issueRecords } = useMaterialIssue();
  const { getQcForLoom } = useQc();

  const sc = STATUS_CFG[loom.status];
  const aliases = loomDispatchAliases(loom);

  const getBatchNum = (id: string) => {
    const m = id.match(/BATCH-(\d+)/);
    return m ? parseInt(m[1] ?? "0", 10) : 0;
  };

  // ── Batches this loom is working on ────────────────────────────────────────
  const loomBatches = batches.filter(b => b.rows.some(r => r.factoryLoomId === loom.id));
  const sortedLoomBatches = [...loomBatches].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return getBatchNum(b.batchId) - getBatchNum(a.batchId);
  }).filter(b => matchesDateFilter(b.createdAt, batchDateFilter));

  const qcRecords = getQcForLoom(loom.id);
  const activeBatchCount = loomBatches.filter(b => b.status === "active").length;
  const assignedCount = loomBatches.reduce((n, b) => n + b.rows.filter(r => r.factoryLoomId === loom.id).length, 0);
  const qcPassedCount = qcRecords.filter(r => r.result === "passed").length;

  // ── Materials issued to this loom ──────────────────────────────────────────
  const materialRecords = issueRecords.filter(r => r.factoryLoomId === loom.id && r.status !== "cancelled");

  // ── Design dispatches sent to this loom, grouped by batch ──────────────────
  const loomDispatches = dispatches.filter(d =>
    d.recipientType === "loom" && aliases.includes(d.recipientId) && matchesDateFilter(d.sentAt, dispatchDateFilter));
  const dispatchGroups: { batchId: string; records: DispatchRecord[] }[] = [];
  loomDispatches.forEach(d => {
    const ids = d.batches.length > 0 ? d.batches : ["No batch linked"];
    ids.forEach(bId => {
      let g = dispatchGroups.find(x => x.batchId === bId);
      if (!g) { g = { batchId: bId, records: [] }; dispatchGroups.push(g); }
      g.records.push(d);
    });
  });
  dispatchGroups.sort((a, b) => getBatchNum(b.batchId) - getBatchNum(a.batchId));

  const TABS = [
    { k: "overview", l: "Overview", icon: <FileText size={16} /> },
    { k: "batches", l: "Batch History", icon: <Layers size={16} /> },
    { k: "dispatches", l: "Design Dispatches", icon: <Sparkles size={16} /> },
    { k: "materials", l: "Materials Received", icon: <Package size={16} /> },
  ];

  return (
    <>
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky" as const, top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", color: T.royalBurgundy, fontFamily: F.ui, fontWeight: 700, fontSize: 15, padding: "8px 4px" }}>
          <ArrowLeft size={18} /> Back to Factory Looms
        </button>
        <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" as const, color: T.taupe }}>Factory Loom Profile</span>
      </div>

      {/* Identity strip */}
      <div style={{ padding: "40px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ width: 104, height: 104, borderRadius: 26, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Factory size={46} color="#FFF" />
          </div>
          <div style={{ flex: "1 1 320px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 99, padding: "5px 14px", marginBottom: 12 }}>{sc.icon}{sc.label}</span>
            <div style={{ fontFamily: F.display, fontSize: 32, color: "#1A0A0F", lineHeight: 1.2, fontWeight: 600 }}>{loom.loomNumber}</div>
            <div style={{ fontFamily: F.mono, fontSize: 14, color: T.royalBurgundy, marginTop: 6 }}>{loom.id}</div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            {[
              { icon: <Factory size={15} color={T.royalBurgundy} />, label: "Location", value: loom.location },
              { icon: <FileText size={15} color={T.royalBurgundy} />, label: "Operator", value: loom.operatorName },
              { icon: <Layers size={15} color={T.royalBurgundy} />, label: "Installed", value: loom.installedYear },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 16px", minWidth: 140 }}>
                {s.icon}
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 48px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 24, background: "#FFFFFF", overflowX: "auto" as const }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: tab === t.k ? T.royalBurgundy : T.taupe, background: "transparent", border: "none", borderBottom: `3px solid ${tab === t.k ? T.royalBurgundy : "transparent"}`, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" as const }}>
            {t.icon}{t.l}
          </button>
        ))}
      </div>

      <div style={{ padding: "40px 48px 80px", flex: 1 }}>
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 36 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
              {[
                { label: "Active Batches", v: activeBatchCount, icon: <Layers size={20} color={T.royalBurgundy} /> },
                { label: "Total Batches", v: loomBatches.length, icon: <Package size={20} color={T.antiqueGold} /> },
                { label: "Sarees Assigned", v: assignedCount, icon: <CheckCircle2 size={20} color={T.green} /> },
                { label: "QC Passed", v: qcPassedCount, icon: <Sparkles size={20} color={T.royalBurgundy} /> },
              ].map(s => (
                <div key={s.label} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.warmIvory, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1 }}>{s.v}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 32, alignItems: "start" as const }}>
              <div>
                <SectionPill label="Loom Details" />
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
                  {[
                    { label: "Loom Number", value: loom.loomNumber },
                    { label: "Location", value: loom.location },
                    { label: "Operator Name", value: loom.operatorName },
                    { label: "Operator Phone", value: loom.operatorPhone },
                    { label: "Installed Year", value: loom.installedYear },
                    { label: "Notes", value: loom.notes || "—" },
                  ].map((r, i, arr) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 1 ? T.warmIvory : "#FFFFFF" }}>
                      <span style={{ color: T.taupe, fontFamily: F.ui, fontSize: 14.5 }}>{r.label}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionPill label="Materials History" />
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, maxHeight: 320, overflowY: "auto" as const }}>
                  {materialRecords.length === 0 ? (
                    <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                      No materials issued to this loom yet.
                    </div>
                  ) : materialRecords.map(r => (
                    <div key={r.id} style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "2px 8px" }}>{r.id}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                      </div>
                      {r.materials.map((m, i) => (
                        <div key={i} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                          • {m.materialType}: <strong>{m.quantity} {m.unit}</strong>{m.description ? ` ${m.description}` : ""}
                        </div>
                      ))}
                      <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 6 }}>Batch {r.batchId || "—"} · Issued by {r.issuedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sarees — same section as the weaver profile */}
            <div>
              <SectionPill label="Sarees" />
              <WeaverSareesSection ownerType="loom" weaverId={loom.id} weaverName={loom.loomNumber} />
            </div>
          </div>
        )}

        {/* ── BATCH HISTORY ── */}
        {tab === "batches" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
            <SectionPill label="All Batches & Assigned Sarees" />
            <DateFilterBar filter={batchDateFilter} onChange={setBatchDateFilter} />
            {sortedLoomBatches.length > 0 ? sortedLoomBatches.map(b => {
              const rowsInBatch = b.rows.filter(r => r.factoryLoomId === loom.id);
              const batchDispatches = dispatches.filter(d => d.recipientType === "loom" && aliases.includes(d.recipientId) && d.batches.includes(b.batchId));
              const doneCount = rowsInBatch.filter(r => r.qcPassed === true).length;
              const pct = rowsInBatch.length > 0 ? Math.round((doneCount / rowsInBatch.length) * 100) : 0;
              const statusBg = b.status === "completed" ? "rgba(30,102,64,0.08)" : b.status === "active" ? "rgba(200,155,71,0.08)" : "rgba(139,112,96,0.08)";
              const statusColor = b.status === "completed" ? T.green : b.status === "active" ? T.royalBurgundy : T.taupe;
              return (
                <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" as const, gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, background: statusBg, color: statusColor, borderRadius: 6, padding: "3px 8px", fontWeight: 700, textTransform: "uppercase" as const }}>{b.status}</span>
                    </div>
                    {b.dueDate && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Due Date: {b.dueDate}</div>}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" as const, marginBottom: 6 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>Progress: {doneCount} of {rowsInBatch.length} sarees done</span>
                    <span style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 700, color: T.antiqueGold }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }} />
                  </div>

                  <div style={{ overflowX: "auto" as const, border: `1px solid ${T.borderDef}`, borderRadius: 10, background: "#FFFFFF" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 560 }}>
                      <thead>
                        <tr style={{ background: T.warmCream }}>
                          {["Saree ID", "Saree Type", "Bulk Order", "Design Dispatch", "QC Status"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left" as const, fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", borderBottom: `1px solid ${T.borderDef}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rowsInBatch.map((row, idx) => {
                          let qcLabel = "In Production", qcBg = "rgba(139,112,96,0.08)", qcColorVal = T.taupe;
                          if (row.qcPassed === true) { qcLabel = "QC Passed"; qcBg = "rgba(30,102,64,0.08)"; qcColorVal = T.green; }
                          else if (row.qcPassed === false) { qcLabel = "QC Failed"; qcBg = "rgba(192,57,43,0.08)"; qcColorVal = T.crimson; }
                          return (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)", borderBottom: `1px solid ${T.borderDef}` }}>
                              <td style={{ padding: "9px 10px" }}>
                                {row.sareeId
                                  ? <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 5, padding: "2px 6px" }}>{row.sareeId}</span>
                                  : <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 11 }}>—</span>}
                              </td>
                              <td style={{ padding: "9px 10px", fontFamily: F.mono, fontSize: 11, color: T.luxuryBrown }}>{row.sareeTypeCode || "—"}</td>
                              <td style={{ padding: "9px 10px", fontFamily: F.ui, fontSize: 11, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600 }}>{row.bulkOrderLabel || "General Stock"}</td>
                              <td style={{ padding: "9px 10px" }}>
                                {idx === 0 && batchDispatches.length > 0
                                  ? <button onClick={() => setViewDispatches({ weaverName: loom.loomNumber, records: batchDispatches })}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer" }}>
                                      {batchDispatches.length} Dispatch{batchDispatches.length > 1 ? "es" : ""}
                                    </button>
                                  : <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 11 }}>—</span>}
                              </td>
                              <td style={{ padding: "9px 10px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: qcColorVal, background: qcBg, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" as const }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: qcColorVal }} />{qcLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }) : (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                No batch history found for this loom.
              </div>
            )}
          </div>
        )}

        {/* ── DESIGN DISPATCHES ── */}
        {tab === "dispatches" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
            <SectionPill label="Design Dispatches Sent to This Loom" />
            <DateFilterBar filter={dispatchDateFilter} onChange={setDispatchDateFilter} />
            {dispatchGroups.length > 0 ? dispatchGroups.map(group => (
              <div key={group.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{group.batchId}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{group.records.length} dispatch{group.records.length > 1 ? "es" : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                  {group.records.map(h => (
                    <div key={h.id} style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{h.id}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Sent on {h.sentAt}</span>
                      </div>
                      <div style={{ background: "rgba(110,15,45,0.03)", border: "1px solid rgba(110,15,45,0.06)", borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.5 }}>
                        <strong>Instructions:</strong> {h.instructions}
                      </div>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" as const, flexWrap: "wrap" as const }}>
                        {h.colorSlipImage && (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                            <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                            <img src={h.colorSlipImage} alt="Color slip" onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — ${h.id}` })}
                              style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                          </div>
                        )}
                        {h.designGraphImage && (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                            <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                            <img src={h.designGraphImage} alt="Design graph" onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — ${h.id}` })}
                              style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                          </div>
                        )}
                        {!h.colorSlipImage && !h.designGraphImage && (
                          <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontStyle: "italic" as const }}>No files attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                No design dispatches found for this loom.
              </div>
            )}
          </div>
        )}

        {/* ── MATERIALS RECEIVED ── */}
        {tab === "materials" && (
          <div>
            <SectionPill label="Materials Issued — Batch Wise" />
            {materialRecords.length === 0 ? (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14.5, fontStyle: "italic" as const, marginTop: 12 }}>
                No materials issued to this loom yet. Use the Issue Material page to record material handovers.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 18, marginTop: 12 }}>
                {Array.from(materialRecords.reduce((m, r) => {
                  const key = r.batchId || "Unassigned";
                  if (!m.has(key)) m.set(key, [] as typeof materialRecords);
                  m.get(key)!.push(r);
                  return m;
                }, new Map<string, typeof materialRecords>()).entries()).map(([batchId, recs]) => {
                  let warpKg = 0;
                  let reshamKg = 0;
                  let jariReels = 0;
                  recs.forEach(r => r.materials.forEach(mat => {
                    const qty = mat.quantity || 0;
                    if (mat.materialType === "Warp") {
                      warpKg += (mat.unit || "").toLowerCase() === "kg" ? qty : qty / 1000;
                    } else if (mat.materialType === "Resham") {
                      reshamKg += (mat.unit || "").toLowerCase() === "kg" ? qty : qty / 1000;
                    } else if (mat.materialType === "Jari") {
                      jariReels += (mat.unit || "").toLowerCase().startsWith("bun") ? qty * 4 : qty;
                    }
                  }));

                  return (
                    <div key={batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}` }}>
                        <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 7, padding: "5px 12px" }}>{batchId}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{recs.length} issuance{recs.length > 1 ? "s" : ""}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${T.borderDef}` }}>
                        {[
                          { label: "Warp Outstanding", value: `${warpKg.toFixed(2)} kg`, color: T.royalBurgundy },
                          { label: "Resham Outstanding", value: `${reshamKg.toFixed(2)} kg`, color: "#7A5E1C" },
                          { label: "Jari Outstanding", value: `${jariReels} reels`, color: T.green },
                        ].map((s, i) => (
                          <div key={s.label} style={{ padding: "14px 22px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
                            <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                            <div style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column" as const, gap: 12 }}>
                        {recs.map(r => (
                          <div key={r.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap" as const, gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", borderRadius: 6, padding: "3px 9px" }}>{r.id}</span>
                                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                              {r.materials.map((m, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" as const }}>
                                  <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{m.materialType}</span>
                                  {m.description && <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{m.description}</span>}
                                  <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, marginLeft: "auto" }}>{m.quantity} {m.unit}</span>
                                  <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: "rgba(139,112,96,0.10)", borderRadius: 5, padding: "2px 8px" }}>{m.grnBatchId}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 10 }}>Issued by {r.issuedBy}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky edit bar — mirrors the weaver profile */}
      <div style={{ padding: "24px 32px", borderTop: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky" as const, bottom: 0, display: "flex", gap: 16 }}>
        <motion.button onClick={() => onEdit(loom)} whileHover={{ scale: 1.02 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "14px 0", fontFamily: F.ui, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
          <Edit2 size={16} /> Edit Details
        </motion.button>
      </div>
    </div>

    <AnimatePresence>
      {viewDispatches && <DispatchDetailsModal key="dd" weaverName={viewDispatches.weaverName} records={viewDispatches.records} onClose={() => setViewDispatches(null)} />}
      {zoomImage && (
        <motion.div key="zoom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setZoomImage(null)}
          style={{ position: "fixed" as const, inset: 0, background: "rgba(20,4,10,0.85)", zIndex: 200, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 14, cursor: "zoom-out" }}>
          <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "#fff", fontWeight: 600 }}>{zoomImage.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
