import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Calendar as CalendarBlank, AlertCircle as WarningCircle, CheckCircle2 as CheckCircle,
  Eye as PhEye, Pencil as PencilSimple,
} from "lucide-react";
import { useMaterialIssue } from "../../../../materials/contexts/MaterialIssueContext";
import { T, F, EASE } from "../../theme";
import { STAGE_CFG } from "../../data";
import type { Batch, BatchStage } from "../../types";
import { FadeUp, Pip } from "../../common/primitives";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { rupees } from "@/lib/domain/money";
import { Money, StatusPill } from "@/shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";

// A batch's `stage` is this feature's own BatchStage union — "submitted"
// (sarees submitted, waiting for QC) doesn't have its own key in the shared
// production taxonomy, so it normalizes onto "qc-pending", the taxonomy's
// equivalent "waiting for QC" state.
const STAGE_TO_PRODUCTION: Record<BatchStage, StatusValueOf<"production">> = {
  weaving: "weaving",
  submitted: "qc-pending",
  "qc-passed": "qc-passed",
  finishing: "finishing",
};

export function SwipeToTally({ tallied, onOpen }: { tallied?: boolean; onOpen?: () => void }) {
  if (tallied) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(30,102,64,0.1)", color: T.green, border: `1.5px solid rgba(30,102,64,0.2)`, borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700 }}>
        <CheckCircle size={16} /> Tallied
      </div>
    );
  }

  return (
    <Button onClick={(e) => { e.stopPropagation(); onOpen?.(); }} variant="secondary" fullWidth>
      <CheckCircle size={16} /> Tally
    </Button>
  );
}


export function BatchCard({ b, onView, onSlip, onEdit }: { b: Batch; expandedId: string | null; setExpandedId: (id: string | null) => void; onView?: (b: Batch) => void; onSlip?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const cfg = STAGE_CFG[b.stage];
  const pct = Math.round((b.done / b.total) * 100);
  const { getReceivedForBatch } = useMaterialIssue();
  const batchSeries = getReceivedForBatch(b.id);
  const isTallied = batchSeries.length > 0 && batchSeries.every(s => s.tallied);

  return (
    <motion.div
      onClick={() => onView?.(b)}
      whileHover={{ y: -6, scale: 1.008, boxShadow: "0 24px 60px rgba(110,15,45,0.12)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.05)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", position: "relative", cursor: "pointer" }}
    >
      <div style={{ width: 6, height: "100%", background: cfg.border, position: "absolute", left: 0, top: 0, bottom: 0 }} />
      <div style={{ paddingLeft: 6, display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 20px 14px" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.royalBurgundy, marginBottom: 8, letterSpacing: "0.2px" }}>{b.id}</div>
            <StatusPill taxonomy="production" status={STAGE_TO_PRODUCTION[b.stage]} />
          </div>
        </div>
        <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
            <div style={{ display: "flex", position: "relative", paddingRight: b.weavers.length > 1 ? 16 : 0 }}>
              {b.weavers.map((w, index) => (
                <div key={w.id} style={{ marginLeft: index > 0 ? -12 : 0, zIndex: 10 - index, position: "relative", transition: "transform 0.25s ease" }}>
                  <Pip initials={w.initials} bg={w.bg} size={32} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assigned Weavers</span>
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
                {b.weavers.map(w => w.name).join(" + ")}
              </span>
            </div>
          </div>

          <div style={{ background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <CalendarBlank size={17} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                {b.submitted ? (
                  <span>Started <strong style={{ fontFamily: F.mono }}>{b.started}</strong> · Submitted <strong style={{ fontFamily: F.mono }}>{b.submitted}</strong></span>
                ) : (
                  <span>Started <strong style={{ fontFamily: F.mono }}>{b.started}</strong> · Expected <strong style={{ fontFamily: F.mono }}>{b.expected}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Produced</span>
                <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, color: T.luxuryBrown }}>{b.done}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>of {b.total} Assigned</span>
              </div>
              <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: T.antiqueGold }}>{pct}%</span>
            </div>

            <div style={{ height: 10, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden", position: "relative", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)" }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: EASE }}
                style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99, boxShadow: "0 1px 4px rgba(200,155,71,0.25)" }}
              />
            </div>

            {(b.finishingDone !== undefined || b.qcPassed !== undefined || b.late) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {b.finishingDone !== undefined && (
                  <div style={{ background: "rgba(30,102,64,0.05)", border: `1px solid rgba(30,102,64,0.15)`, borderRadius: 8, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, color: T.green, fontWeight: 600 }}>
                    ✨ Finishing: {b.finishingDone} of {b.total}
                  </div>
                )}
                {b.qcPassed !== undefined && (() => {
                  // "done" is QC-passed OR finished-via-quotation, so the gap
                  // between them is sarees produced through Raise Quotation —
                  // not a rejection. Rejected is tracked separately.
                  const viaQuotation = Math.max(0, b.done - b.qcPassed);
                  return (
                    <div style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>
                      ✓ QC Passed: {b.qcPassed}
                      {viaQuotation > 0 && ` · Via Quotation: ${viaQuotation}`}
                      {!!b.rejected && ` · Rejected: ${b.rejected}`}
                    </div>
                  );
                })()}
                {b.late && (
                  <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 8, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, color: T.crimson, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <WarningCircle size={13} /> Running {b.late}d late
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <Button onClick={(e) => { e.stopPropagation(); onView?.(b); }} variant="secondary" fullWidth>
            <PhEye size={16} /> Open Batch
          </Button>
          <SwipeToTally tallied={isTallied} onOpen={() => onView?.(b)} />
        </div>
      </div>
    </motion.div>
  );
}

export function BatchCardGrid({ batches, onView, onSlip, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onSlip?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>
      {batches.map((b, i) => (
        <FadeUp key={b.id} delay={i * 0.04} style={{ height: "100%" }}>
          <BatchCard b={b} expandedId={expandedId} setExpandedId={setExpandedId} onView={onView} onSlip={onSlip} onEdit={onEdit} />
        </FadeUp>
      ))}
    </div>
  );
}

export function BatchListView({ batches, onView, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const columns: ColumnDef<Batch>[] = [
    {
      id: "id", header: "Batch Number", accessor: b => b.id, priority: 1,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{b.id}</span>,
    },
    {
      id: "stage", header: "Stage", accessor: b => b.stage, type: "status",
      cell: (_v, b) => <StatusPill taxonomy="production" status={STAGE_TO_PRODUCTION[b.stage]} />,
    },
    {
      id: "weavers", header: "Weavers", accessor: b => b.weavers,
      cell: (_v, b) => <div style={{ display: "flex", gap: 6 }}>{b.weavers.map(w => <Pip key={w.id} initials={w.initials} bg={w.bg} size={28} />)}</div>,
    },
    {
      id: "design", header: "Design", accessor: b => b.design, priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{b.design}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.designName}</div></span>,
    },
    {
      id: "sareeCode", header: "Saree Type", accessor: b => b.sareeCode,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.sareeTypeName}</div></span>,
    },
    {
      id: "progress", header: "Progress", accessor: b => b.done,
      cell: (_v, b) => {
        const cfg = STAGE_CFG[b.stage];
        const pct = Math.round((b.done / b.total) * 100);
        return (
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 700, marginBottom: 5 }}>Produced {b.done} / Assigned {b.total}</div>
            <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", width: 110 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: cfg.border, borderRadius: 99 }} />
            </div>
          </div>
        );
      },
    },
    {
      id: "started", header: "Started", accessor: b => b.started, priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.started}</span>,
    },
    {
      id: "expected", header: "Expected End", accessor: b => b.submitted ?? b.expected, priority: 3,
      cell: (_v, b) => (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: b.late ? T.crimson : T.taupe }}>
          {b.submitted ?? b.expected}
          {b.late && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><WarningCircle size={13} /> {b.late}d late</div>}
        </span>
      ),
    },
    {
      id: "charges", header: "Making Charges", accessor: b => b.total * b.rate,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, fontWeight: 700 }}><Money value={rupees(b.total * b.rate)} /></span>,
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
      cell: (_v, b) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={() => onView?.(b)} variant="secondary" size="sm">
            <PhEye size={14} /> View
          </Button>
          {b.isLive && onEdit && (
            <Button onClick={() => onEdit(b)} variant="tertiary" size="sm">
              <PencilSimple size={14} /> Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 6px 24px rgba(74,6,27,0.05)" }}>
      <DataTable responsive columns={columns} data={batches} getRowId={b => b.id} />
    </div>
  );
}

export function BatchTableView({ batches, onView, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const columns: ColumnDef<Batch>[] = [
    {
      id: "id", header: "Batch No.", accessor: b => b.id, priority: 1,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 700, whiteSpace: "nowrap" }}>{b.id}</span>,
    },
    {
      id: "stage", header: "Stage", accessor: b => b.stage, type: "status",
      cell: (_v, b) => <StatusPill taxonomy="production" status={STAGE_TO_PRODUCTION[b.stage]} />,
    },
    {
      id: "weavers", header: "Weaver(s)", accessor: b => b.weavers,
      cell: (_v, b) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {b.weavers.map(w => <div key={w.id} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, whiteSpace: "nowrap", fontWeight: 500 }}>{w.name} <span style={{ color: T.taupe }}>({w.id})</span></div>)}
        </div>
      ),
    },
    {
      id: "sareeCode", header: "Saree Type", accessor: b => b.sareeCode,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}</span>,
    },
    {
      id: "materials", header: "Materials Given", accessor: b => b.materials, priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, maxWidth: 200, lineHeight: 1.5, display: "inline-block" }}>{b.materials}</span>,
    },
    {
      id: "started", header: "Started", accessor: b => b.started, priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, whiteSpace: "nowrap" }}>{b.started}</span>,
    },
    {
      id: "expected", header: "Expected End", accessor: b => b.submitted ?? b.expected, priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 13, color: b.late ? T.crimson : T.taupe, whiteSpace: "nowrap", fontWeight: b.late ? 600 : 400 }}>{b.submitted ?? b.expected}</span>,
    },
    {
      id: "total", header: "Assigned", accessor: b => b.total, align: "center",
      cell: (_v, b) => <span style={{ fontFamily: F.display, fontSize: 16, color: T.luxuryBrown }}>{b.total}</span>,
    },
    {
      id: "done", header: "Produced", accessor: b => b.done, align: "center",
      cell: (_v, b) => <span style={{ fontFamily: F.display, fontSize: 16, color: T.antiqueGold }}>{b.done}</span>,
    },
    {
      id: "qcPassed", header: "QC Passed", accessor: b => b.qcPassed, align: "center",
      cell: (_v, b) => <span style={{ fontFamily: F.display, fontSize: 16, color: T.green }}>{b.qcPassed ?? "—"}</span>,
    },
    {
      id: "rate", header: "Rate/Saree", accessor: b => b.rate, priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}><Money value={rupees(b.rate)} /></span>,
    },
    {
      id: "est", header: "Est. Charges", accessor: b => b.total * b.rate,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 700 }}><Money value={rupees(b.total * b.rate)} /></span>,
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
      cell: (_v, b) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={() => onView?.(b)} variant="secondary" size="sm">
            <PhEye size={14} /> View
          </Button>
          {b.isLive && onEdit && (
            <Button onClick={() => onEdit(b)} variant="tertiary" size="sm">
              <PencilSimple size={14} /> Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 6px 24px rgba(74,6,27,0.05)" }}>
      <div style={{ overflowX: "auto" }}>
        <DataTable responsive columns={columns} data={batches} getRowId={b => b.id} />
      </div>
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {batches.length} of {batches.length} batches</div>
    </div>
  );
}
