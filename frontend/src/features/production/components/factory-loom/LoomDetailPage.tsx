import React, { useEffect, useState } from "react";
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
import { LoomMaterialsTab } from "./LoomMaterialsTab";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { recordView } from "../../../../shared/ui/overlay";
import { EntityCode } from "../../../../shared/ui/domain";

const fmtIssueDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 4 }}>{label}</div>;
}

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

  // Escape closes the image zoom overlay — Part C.3's focus contract applies
  // to every scrim-backed overlay, not just the named Modal/Drawer/Popover.
  useEffect(() => {
    if (!zoomImage) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomImage(null); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoomImage]);

  // Command palette RECENT group (design-system/05-OVERLAYS.md Part H) —
  // record this profile as viewed once per mount.
  useEffect(() => {
    recordView({ key: `loom:${loom.id}`, label: loom.loomNumber, path: "/admin/production", kind: "Loom" });
  }, [loom.id, loom.loomNumber]);

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

  const materialRecords = issueRecords.filter(r => r.factoryLoomId === loom.id && r.status !== "cancelled");

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
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100dvh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky" as const, top: 0, zIndex: 10 }}>
        <Button onClick={onBack} variant="link" iconLeft={ArrowLeft} className="text-[#6E0F2D] font-bold text-sm">
          Back to Factory Looms
        </Button>
        <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" as const, color: T.taupe }}>Factory Loom Profile</span>
      </div>

      <div style={{ padding: "16px 48px 0", background: "#FFFFFF" }}>
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "factory-looms", label: "Factory Looms", onClick: onBack },
            { key: "loom", label: loom.loomNumber },
          ]}
        />
      </div>

      <div style={{ padding: "40px 48px", background: "#FFFFFF", borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ width: 104, height: 104, borderRadius: 26, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Factory size={46} color="#FFF" />
          </div>
          <div style={{ flex: "1 1 320px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 99, padding: "5px 14px", marginBottom: 12 }}>{sc.icon}{sc.label}</span>
            <div style={{ fontFamily: F.display, fontSize: 30, color: "#1A0A0F", lineHeight: 1.2, fontWeight: 600 }}>{loom.loomNumber}</div>
            <div style={{ marginTop: 6 }}><EntityCode type="loom" value={loom.id} size="md" /></div>
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
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 48px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 24, background: "#FFFFFF", overflowX: "auto" as const }}>
        {TABS.map(t => (
          <Button key={t.k} onClick={() => setTab(t.k as any)} variant="ghost"
            className={`h-auto py-4 rounded-none gap-2 text-sm font-semibold whitespace-nowrap border-b-[3px] ${tab === t.k ? "border-[#6E0F2D] text-[#6E0F2D]" : "border-transparent text-[var(--text-tertiary)]"} hover:bg-transparent`}>
            {t.icon}{t.l}
          </Button>
        ))}
      </div>

      <div style={{ padding: "40px 48px 80px", flex: 1 }}>
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
                      <span style={{ color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>{r.label}</span>
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
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "2px 8px" }}>{r.id}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                      </div>
                      {r.materials.map((m, i) => (
                        <div key={i} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                          • {m.materialType}: <strong>{m.quantity} {m.unit}</strong>{m.description ? ` ${m.description}` : ""}
                        </div>
                      ))}
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>Batch {r.batchId || "—"} · Issued by {r.issuedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <SectionPill label="Sarees" />
              <WeaverSareesSection ownerType="loom" weaverId={loom.id} weaverName={loom.loomNumber} />
            </div>
          </div>
        )}

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
                      <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, background: statusBg, color: statusColor, borderRadius: 6, padding: "3px 8px", fontWeight: 700, textTransform: "uppercase" as const }}>{b.status}</span>
                    </div>
                    {b.dueDate && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Due Date: {b.dueDate}</div>}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" as const, marginBottom: 6 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Progress: {doneCount} of {rowsInBatch.length} sarees done</span>
                    <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.antiqueGold }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }} />
                  </div>

                  <div style={{ overflowX: "auto" as const, border: `1px solid ${T.borderDef}`, borderRadius: 10, background: "#FFFFFF", minWidth: 560 }}>
                    <DataTable
                      columns={[
                        {
                          id: "sareeId", header: "Saree ID", accessor: (row: typeof rowsInBatch[number]) => row.sareeId,
                          cell: (_v, row) => row.sareeId
                            ? <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 5, padding: "2px 6px" }}>{row.sareeId}</span>
                            : <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 12 }}>—</span>,
                        },
                        {
                          id: "sareeTypeCode", header: "Saree Type", accessor: row => row.sareeTypeCode,
                          cell: (_v, row) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{row.sareeTypeCode || "—"}</span>,
                        },
                        {
                          id: "bulkOrder", header: "Bulk Order", accessor: row => row.bulkOrderLabel,
                          cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600 }}>{row.bulkOrderLabel || "General Stock"}</span>,
                        },
                        {
                          id: "dispatch", header: "Design Dispatch", accessor: () => null,
                          cell: (_v, row) => (rowsInBatch.indexOf(row) === 0 && batchDispatches.length > 0)
                            ? <Button onClick={() => setViewDispatches({ weaverName: loom.loomNumber, records: batchDispatches })} variant="link"
                                className="text-xs font-bold text-[#6E0F2D] bg-[rgba(110,15,45,0.08)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
                                {batchDispatches.length} Dispatch{batchDispatches.length > 1 ? "es" : ""}
                              </Button>
                            : <span style={{ color: "rgba(139,112,96,0.35)", fontSize: 12 }}>—</span>,
                        },
                        {
                          id: "qc", header: "QC Status", accessor: row => row.qcPassed,
                          cell: (_v, row) => {
                            let qcLabel = "In Production", qcBg = "rgba(139,112,96,0.08)", qcColorVal: string = T.taupe;
                            if (row.qcPassed === true) { qcLabel = "QC Passed"; qcBg = "rgba(30,102,64,0.08)"; qcColorVal = T.green; }
                            else if (row.qcPassed === false) { qcLabel = "QC Failed"; qcBg = "rgba(192,57,43,0.08)"; qcColorVal = T.crimson; }
                            return (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: qcColorVal, background: qcBg, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" as const }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: qcColorVal }} />{qcLabel}
                              </span>
                            );
                          },
                        },
                      ] as ColumnDef<typeof rowsInBatch[number]>[]}
                      data={rowsInBatch}
                      getRowId={row => row.sareeId || String(rowsInBatch.indexOf(row))}
                      emptyTitle="No sarees in this batch"
                    />
                  </div>
                </div>
              );
            }) : (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                No batch history found for this loom.
              </div>
            )}
          </div>
        )}

        {tab === "dispatches" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
            <SectionPill label="Design Dispatches Sent to This Loom" />
            <DateFilterBar filter={dispatchDateFilter} onChange={setDispatchDateFilter} />
            {dispatchGroups.length > 0 ? dispatchGroups.map(group => (
              <div key={group.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{group.batchId}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{group.records.length} dispatch{group.records.length > 1 ? "es" : ""}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                  {group.records.map(h => (
                    <div key={h.id} style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{h.id}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Sent on {h.sentAt}</span>
                      </div>
                      <div style={{ background: "rgba(110,15,45,0.03)", border: "1px solid rgba(110,15,45,0.06)", borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.5 }}>
                        <strong>Instructions:</strong> {h.instructions}
                      </div>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" as const, flexWrap: "wrap" as const }}>
                        {h.colorSlipImage && (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                            <img src={h.colorSlipImage} alt="Color slip" onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — ${h.id}` })}
                              style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                          </div>
                        )}
                        {h.designGraphImage && (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                            <img src={h.designGraphImage} alt="Design graph" onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — ${h.id}` })}
                              style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                          </div>
                        )}
                        {!h.colorSlipImage && !h.designGraphImage && (
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" as const }}>No files attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div style={{ background: T.warmIvory, borderRadius: 16, padding: 20, textAlign: "center" as const, color: T.taupe, fontFamily: F.ui, fontSize: 14, fontStyle: "italic" as const, border: `1px solid ${T.borderDef}` }}>
                No design dispatches found for this loom.
              </div>
            )}
          </div>
        )}

        {tab === "materials" && (
          <LoomMaterialsTab materialRecords={materialRecords} />
        )}
      </div>

      <div style={{ padding: "24px 32px", borderTop: `1px solid ${T.borderDef}`, background: "#FFFFFF", position: "sticky" as const, bottom: 0, display: "flex", gap: 16 }}>
        <Button onClick={() => onEdit(loom)} variant="primary" size="lg" iconLeft={Edit2} fullWidth className="text-base">
          Edit Details
        </Button>
      </div>
    </div>

    <AnimatePresence>
      {viewDispatches && <DispatchDetailsModal key="dd" weaverName={viewDispatches.weaverName} records={viewDispatches.records} onClose={() => setViewDispatches(null)} />}
      {zoomImage && (
        <motion.div key="zoom" role="dialog" aria-modal="true" aria-label={zoomImage.label}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setZoomImage(null)}
          style={{ position: "fixed" as const, inset: 0, background: "var(--surface-scrim)", zIndex: "var(--z-modal)", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 14, cursor: "zoom-out" }}>
          <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "#fff", fontWeight: 600 }}>{zoomImage.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
