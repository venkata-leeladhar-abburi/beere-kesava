import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Calendar as CalendarBlank, AlertCircle as WarningCircle, CheckCircle2 as CheckCircle,
  Eye as PhEye,
} from "lucide-react";
import { useMaterialIssue, materialItemToGrams, BUNS_PER_REEL } from "@/features/materials";
import { formatBunsReels } from "@/shared/lib/weightUnits";
import { T, F, EASE } from "../../theme";
import { STAGE_CFG } from "../../data";
import type { Batch, BatchStage } from "../../types";
import { FadeUp, Pip } from "../../common/primitives";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { rupees } from "@/lib/domain/money";
import { EntityCode, Money, StatusPill } from "@/shared/ui/domain";
import type { StatusValueOf } from "@/lib/domain/status";

const TopDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginBottom: 12 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ display: "flex", gap: 3, paddingRight: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
  </div>
);

const BottomDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 20, marginTop: 16 }}>
    <div style={{ display: "flex", gap: 3, paddingLeft: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginLeft: 8 }} />
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ margin: "0 8px", flexShrink: 0 }}>
      <g transform="translate(30, 10)">
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="-16,0 -12,-3 -8,0 -12,3" fill={T.antiqueGold} />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <path d="M-5,0 L0,-5 L5,0 L0,5 Z" fill={T.antiqueGold} />
        <circle cx="0" cy="0" r="1.5" fill="#FFFDF9" />
        {/* eslint-disable-next-line no-restricted-syntax -- decorative SVG ornament, not a chart data mark */}
        <polygon points="8,0 12,-3 16,0 12,3" fill={T.antiqueGold} />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${T.antiqueGold}`, opacity: 0.6, marginRight: 8 }} />
    <div style={{ display: "flex", gap: 3, paddingRight: 4 }}>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.antiqueGold }} />
    </div>
  </div>
);

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
      <div className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-[rgba(30,102,64,0.1)] text-[#1E6640] border border-[rgba(30,102,64,0.2)] rounded-lg py-2 px-2 text-[12px] font-bold whitespace-nowrap">
        <CheckCircle size={15} /> Tallied
      </div>
    );
  }

  return (
    <Button onClick={(e) => { e.stopPropagation(); onOpen?.(); }} variant="secondary" className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center">
      <CheckCircle size={15} /> Tally
    </Button>
  );
}


export function BatchCard({ b, onView }: { b: Batch; expandedId: string | null; setExpandedId: (id: string | null) => void; onView?: (b: Batch) => void; onSlip?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const pct = Math.round((b.done / b.total) * 100);
  const { getReceivedForBatch } = useMaterialIssue();
  const batchSeries = getReceivedForBatch(b.id);
  const isTallied = batchSeries.length > 0 && batchSeries.every(s => s.tallied);

  return (
    <motion.div
      onClick={() => onView?.(b)}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{
        background: "#FFFDF9",
        borderRadius: 12,
        border: `1.5px solid ${T.antiqueGold}`,
        boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        cursor: "pointer"
      }}
    >
      <div style={{ height: 4, background: T.royalBurgundy, width: "100%", opacity: 0.8 }} />

      <div style={{ padding: "16px 20px 0" }}>
        <TopDivider />
      </div>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 20px 14px" }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <EntityCode type="batch" value={b.id} size="md" />
            </div>
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
                  <span>Started <strong style={{ fontFamily: F.ui }}>{b.started}</strong> · Submitted <strong style={{ fontFamily: F.ui }}>{b.submitted}</strong></span>
                ) : (
                  <span>Started <strong style={{ fontFamily: F.ui }}>{b.started}</strong> · Expected <strong style={{ fontFamily: F.ui }}>{b.expected}</strong></span>
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

        <div style={{ padding: "0 20px" }}>
          <BottomDivider />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-4 sm:p-5 pt-0 w-full min-w-0">
          <Button onClick={(e) => { e.stopPropagation(); onView?.(b); }} variant="secondary" className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center">
            <PhEye size={15} /> Open Batch
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
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
      cell: (_v, b) => <EntityCode type="batch" value={b.id} size="sm" />,
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
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{b.design}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.designName}</div></span>,
    },
    {
      id: "sareeCode", header: "Saree Type", accessor: b => b.sareeCode,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.sareeTypeName}</div></span>,
    },
    {
      id: "progress", header: "Progress", accessor: b => b.done,
      cell: (_v, b) => {
        const cfg = STAGE_CFG[b.stage];
        const pct = Math.round((b.done / b.total) * 100);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
            <div style={{ flex: 1, height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: cfg.border, borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{b.done}/{b.total}</span>
          </div>
        );
      },
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
      cell: (_v, b) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={() => onView?.(b)} variant="secondary" size="sm">
            View
          </Button>
          <Button onClick={() => onEdit?.(b)} variant="secondary" size="sm">
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={batches}
      getRowId={b => b.id}
      emptyTitle="No batches found"
    />
  );
}

/** Materials issued for one batch, broken out per loom — a batch can hand
 * material to more than one weaver/loom, and lumping every loom's issuance
 * into a single line hides how much any one loom actually got. */
function BatchMaterialsCell({ batchId }: { batchId: string }) {
  const { getRecordsForBatch } = useMaterialIssue();
  const records = getRecordsForBatch(batchId);

  if (records.length === 0) {
    return <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>No materials issued</span>;
  }

  const byLoom = new Map<string, Map<string, { grams: number; reels: number }>>();
  records.forEach(r => {
    const loomLabel = r.loomNumber
      ? `Loom ${r.loomNumber}`
      : r.factoryLoomNumber
        ? `Factory Loom ${r.factoryLoomNumber}`
        : "Unassigned Loom";
    if (!byLoom.has(loomLabel)) byLoom.set(loomLabel, new Map());
    const totals = byLoom.get(loomLabel)!;
    r.materials.forEach(m => {
      if (!totals.has(m.materialType)) totals.set(m.materialType, { grams: 0, reels: 0 });
      const t = totals.get(m.materialType)!;
      t.grams += materialItemToGrams(m);
      if (m.materialType === "Jari") {
        t.reels += (m.unit || "").toLowerCase().startsWith("bun")
          ? (m.quantity || 0) / BUNS_PER_REEL
          : (m.quantity || 0);
      }
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 240 }}>
      {Array.from(byLoom.entries()).map(([loomLabel, totals]) => (
        <div key={loomLabel} style={{ lineHeight: 1.5 }}>
          <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.royalBurgundy }}>{loomLabel}: </span>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            {Array.from(totals.entries()).map(([type, t], i) => (
              <span key={type}>
                {i > 0 && " · "}
                {type} {type === "Jari" ? formatBunsReels(Math.round(t.reels)) : `${(t.grams / 1000).toFixed(2)}kg`}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BatchTableView({ batches, onView, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const columns: ColumnDef<Batch>[] = [
    {
      id: "id", header: "Batch No.", accessor: b => b.id, priority: 1,
      cell: (_v, b) => <EntityCode type="batch" value={b.id} size="sm" />,
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
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}</span>,
    },
    {
      id: "materials", header: "Materials Given", accessor: b => b.materials, priority: 3,
      cell: (_v, b) => <BatchMaterialsCell batchId={b.id} />,
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
      cell: (_v, b) => <span style={{ fontSize: 13, color: T.luxuryBrown }}><Money value={rupees(b.rate)} /></span>,
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
            View
          </Button>
          <Button onClick={() => onEdit?.(b)} variant="secondary" size="sm">
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 6px 24px rgba(74,6,27,0.05)" }}>
      <div style={{ overflowX: "auto" }}>
        <DataTable columns={columns} data={batches} getRowId={b => b.id} />
      </div>
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {batches.length} of {batches.length} batches</div>
    </div>
  );
}
