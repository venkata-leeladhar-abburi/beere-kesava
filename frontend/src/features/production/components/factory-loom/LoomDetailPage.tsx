import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Edit2, FileText, Factory, Package, Layers, Sparkles,
  CheckCircle2, ChevronLeft, UserRound } from "lucide-react";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { SectionCard } from "@/shared/ui/SectionCard";
import { useBatches } from "../../contexts/BatchContext";
import { useDesignLibrary, DispatchRecord } from "@/features/design-library";
import { useMaterialIssue } from "@/features/materials";
import { useQc } from "@/features/qc";
import { DispatchDetailsModal } from "../DispatchDetailsModal";
import { WeaverSareesSection } from "@/features/weavers";
import { FactoryLoom, loomLabel } from "../../data/factoryLooms";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "./theme";
import { LOOM_STATUS_TO_CONDITION } from "./types";
import { LoomMaterialsTab } from "./LoomMaterialsTab";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Breadcrumbs } from "../../../../shared/ui/nav/Breadcrumbs";
import { recordView } from "../../../../shared/ui/overlay";
import { EntityCode, StatusPill } from "../../../../shared/ui/domain";

const fmtIssueDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 4 }}>{label}</div>;
}

function loomDispatchAliases(loom: FactoryLoom): string[] {
  // Dispatch/QC rows may reference the loom by id, display code or the legacy
  // typed number, so match on all of them.
  const digits = (loom.loomNumber || "").replace(/[^0-9]/g, "").replace(/^0+/, "");
  return [loom.id, loom.displayCode ?? "", loom.loomNumber, digits ? `Loom ${digits}` : ""].filter(Boolean);
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
    recordView({ key: `loom:${loom.id}`, label: loomLabel(loom), path: "/admin/production", kind: "Loom" });
  }, [loom]);

  const { batches } = useBatches();
  const { dispatches } = useDesignLibrary();
  const { issueRecords } = useMaterialIssue();
  const { getQcForLoom } = useQc();

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
    <div className="px-3 sm:px-7 xl:px-14 py-4 sm:py-8 min-h-dvh">
      <div className="mb-3 sm:mb-4">
        <Breadcrumbs
          items={[
            { key: "people", label: "People", onClick: onBack },
            { key: "factory-looms", label: "Factory Looms", onClick: onBack },
            { key: "loom", label: loomLabel(loom) },
          ]}
        />
      </div>

      {/* Header row with Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:px-5 sm:py-3.5 rounded-2xl border border-[var(--border-default)] shadow-sm">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <Button
            onClick={onBack}
            variant="secondary"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-[10px] border border-[rgba(110,15,45,0.25)] bg-[#FFFDF9] hover:bg-[#6E0F2D] text-[#6E0F2D] hover:text-white active:bg-[#4A061B] active:text-white font-bold text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft size={16} /> Back to Factory Looms
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <Button
            onClick={() => onEdit(loom)}
            variant="primary"
            size="md"
            iconLeft={Edit2}
            className="h-9 sm:h-10 px-4 rounded-[10px] border-none shadow-[0_4px_16px_rgba(110,15,45,0.3)] bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#580C24] font-bold text-xs sm:text-sm cursor-pointer"
          >
            Edit Details
          </Button>

          <div className="hidden xs:flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] bg-[rgba(110,15,45,0.06)] border border-[rgba(110,15,45,0.18)] text-[#6E0F2D] font-bold text-xs uppercase tracking-wider whitespace-nowrap">
            <UserRound size={14} className="text-[#6E0F2D]" />
            <span>Factory Loom Profile</span>
          </div>

          <StatusPill taxonomy="condition" status={LOOM_STATUS_TO_CONDITION[loom.status]} />

          <EntityCode type="loom" value={loom.displayCode || loom.loomNumber || loom.id} size="md" className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-[10px] bg-[#FFFDF9] border border-[#E8DCC4] text-[#3B2314] font-mono font-bold text-xs flex items-center whitespace-nowrap shrink-0" />
        </div>
      </div>

      {/* Profile Hero Banner */}
      <div className="mb-6">
        <div className="relative bg-[#0D0207] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,155,71,0.25)]">
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${BG_IMAGE})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.24, pointerEvents: "none"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(74,6,27,0.92) 0%, rgba(13,2,7,0.95) 100%)", pointerEvents: "none" }} />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col lg:flex-row gap-5 lg:gap-7 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap w-full lg:w-auto">
              <div className="relative shrink-0">
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg, ${T.antiqueGold}, ${T.goldLight})`, color: T.darkBurgundy, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(200,155,71,0.45)", boxShadow: "0 6px 20px rgba(200,155,71,0.35)" }}>
                  <Factory size={36} color={T.darkBurgundy} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.4px", textTransform: "uppercase", background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 99, padding: "2px 10px" }}>
                    IN-HOUSE FACTORY LOOM
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-[#FFFDF9] font-bold font-serif leading-tight truncate">
                  {loomLabel(loom)}
                </h1>
                <div className="mt-2 flex items-center gap-3 flex-wrap text-xs sm:text-sm text-white/70">
                  <span className="flex items-center gap-1.5"><Factory size={14} color={T.antiqueGold} /> Location: <strong>{loom.location}</strong></span>
                  <span className="flex items-center gap-1.5"><FileText size={14} color={T.antiqueGold} /> Operator: <strong>{loom.operatorName}</strong></span>
                </div>
              </div>
            </div>

            {/* Metrics Stats Cards */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-[rgba(200,155,71,0.16)] flex items-center justify-center shrink-0">
                  <Factory size={20} color={T.antiqueGold} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Location</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{loom.location}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Operator</div>
                  <div className="text-sm sm:text-base font-bold text-[#7EE2A8] mt-0.5 whitespace-nowrap">{loom.operatorName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3.5 sm:px-5 sm:py-4 flex-1 sm:flex-none">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Layers size={20} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Installed</div>
                  <div className="text-sm sm:text-base font-bold text-[#FFFDF9] mt-0.5 whitespace-nowrap">{loom.installedYear}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto section-nav-scroll pb-1 mb-6 border-b-2 border-[var(--border-default)]">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map(t => (
            <Button
              key={t.k}
              variant="tertiary"
              onClick={() => setTab(t.k as "overview" | "batches" | "dispatches" | "materials")}
              className={
                "rounded-none px-4 sm:px-6 py-3 mb-[-6px] shrink-0 text-sm sm:text-base cursor-pointer flex items-center gap-2 " +
                (tab === t.k
                  ? "border-b-[3px] border-[#6E0F2D] text-[#6E0F2D] font-bold"
                  : "border-b-[3px] border-transparent text-[#9C8672] font-medium")
              }
            >
              {t.icon} {t.l}
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full">
        {tab === "overview" && (
          <SectionCard
            icon={FileText}
            title="Factory Loom Overview"
            subtitle={`Active batches, loom specifications, and material allocation for ${loomLabel(loom)}`}
          >
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

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" as const }}>
                <div>
                  <SectionPill label="Loom Details" />
                  <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
                    {[
                      { label: "Loom Number", value: loomLabel(loom) },
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
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", borderRadius: 6, padding: "2px 8px" }}>{r.id}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{fmtIssueDate(r.issuedAt)}</span>
                        </div>
                        {r.materials.map((m) => (
                          <div key={`${m.materialType}-${m.quantity}-${m.unit}-${m.description || ""}`} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
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
                <WeaverSareesSection ownerType="loom" weaverId={loom.id} weaverName={loomLabel(loom)} />
              </div>
            </div>
          </SectionCard>
        )}

        {tab === "batches" && (
          <SectionCard
            icon={Layers}
            title="Batch Production History"
            subtitle={`Assigned batches, saree progress, and QC status for ${loomLabel(loom)}`}
          >
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
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
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, background: statusBg, color: statusColor, borderRadius: 6, padding: "3px 8px", fontWeight: 700, textTransform: "uppercase" as const }}>{b.status}</span>
                      </div>
                      {b.dueDate && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Due Date: {b.dueDate}</div>}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" as const, marginBottom: 6 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Progress: {doneCount} of {rowsInBatch.length} sarees done</span>
                      <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.antiqueGold }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }} />
                    </div>

                    <div style={{ overflowX: "auto" as const, border: `1px solid ${T.borderDef}`, borderRadius: 10, background: "#FFFFFF" }}>
                      <DataTable
                        responsive
                        columns={[
                          {
                            id: "sareeId", header: "Saree ID", accessor: (row: typeof rowsInBatch[number]) => row.sareeId, priority: 1,
                            cell: (_v, row) => row.sareeId
                              ? <EntityCode type="saree" value={row.sareeId} size="sm" />
                              : <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 12 }}>—</span>,
                          },
                          {
                            id: "sareeTypeCode", header: "Saree Type", accessor: row => row.sareeTypeCode,
                            cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{row.sareeTypeCode || "—"}</span>,
                          },
                          {
                            id: "bulkOrder", header: "Bulk Order", accessor: row => row.bulkOrderLabel, priority: 3,
                            cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, color: row.bulkOrderRef ? T.royalBurgundy : T.green, fontWeight: 600 }}>{row.bulkOrderLabel || "General Stock"}</span>,
                          },
                          {
                            id: "dispatch", header: "Design Dispatch", accessor: () => null,
                            cell: (_v, row) => (rowsInBatch.indexOf(row) === 0 && batchDispatches.length > 0)
                              ? <Button onClick={() => setViewDispatches({ weaverName: loomLabel(loom), records: batchDispatches })} variant="link"
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
          </SectionCard>
        )}

        {tab === "dispatches" && (
          <SectionCard
            icon={Sparkles}
            title="Design Dispatches & Graph Slips"
            subtitle={`Design instructions, color slips, and graph artwork issued to ${loomLabel(loom)}`}
          >
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
              <DateFilterBar filter={dispatchDateFilter} onChange={setDispatchDateFilter} />
              {dispatchGroups.length > 0 ? dispatchGroups.map(group => (
                <div key={group.batchId} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{group.batchId}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{group.records.length} dispatch{group.records.length > 1 ? "es" : ""}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                    {group.records.map(h => (
                      <div key={h.id} style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{h.id}</span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Sent on {h.sentAt}</span>
                        </div>
                        <div style={{ background: "rgba(110,15,45,0.03)", border: "1px solid rgba(110,15,45,0.06)", borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.5 }}>
                          <strong>Instructions:</strong> {h.instructions}
                        </div>
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" as const, flexWrap: "wrap" as const }}>
                          {h.colorSlipImage && (
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Color Slip</span>
                              <button type="button" onClick={() => setZoomImage({ url: h.colorSlipImage!, label: `Color Slip — ${h.id}` })}
                                style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", display: "block" }}>
                                <img src={h.colorSlipImage} alt="Color slip"
                                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                              </button>
                            </div>
                          )}
                          {h.designGraphImage && (
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>Design Graph</span>
                              <button type="button" onClick={() => setZoomImage({ url: h.designGraphImage!, label: `Design Graph — ${h.id}` })}
                                style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", display: "block" }}>
                                <img src={h.designGraphImage} alt="Design graph"
                                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" as const, border: `1px solid ${T.borderDef}`, cursor: "pointer" }} />
                              </button>
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
          </SectionCard>
        )}

        {tab === "materials" && (
          <SectionCard
            icon={Package}
            title="Materials Received & Allocation"
            subtitle={`Yarn, warp, and raw material issue logs for ${loomLabel(loom)}`}
          >
            <LoomMaterialsTab materialRecords={materialRecords} />
          </SectionCard>
        )}
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
