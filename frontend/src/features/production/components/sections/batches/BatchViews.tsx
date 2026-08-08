import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Calendar as CalendarBlank, AlertCircle as WarningCircle, CheckCircle2 as CheckCircle,
  Eye as PhEye, ChevronRight as PhCaretRight, Pencil as PencilSimple,
} from "lucide-react";
import { useMaterialIssue } from "../../../../materials/contexts/MaterialIssueContext";
import { T, F, EASE } from "../../theme";
import { STAGE_CFG } from "../../data";
import type { Batch } from "../../types";
import { FadeUp, Pip, ProductionDialog } from "../../common/primitives";
import { Button, NumberInput } from "../../../../../shared/ui/primitives";

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

/** Shows received series (color, worker weight) for a batch and lets the admin
 *  enter the final weight, which reduces the weaver's outstanding. */
export function TallyDialog({ batchId, onClose, onConfirmed }: { batchId: string; onClose: () => void; onConfirmed: () => void }) {
  const { getReceivedForBatch, finalizeReceivedWeight } = useMaterialIssue();
  const series = getReceivedForBatch(batchId);
  const [weights, setWeights] = useState<Record<string, string>>(() =>
    Object.fromEntries(series.map(s => [s.id, String(((s.finalWeightGrams ?? s.weightGrams) / 1000).toFixed(3))]))
  );
  const [confirming, setConfirming] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    series.forEach(s => {
      const kg = parseFloat(weights[s.id] ?? "");
      if (!isNaN(kg) && kg >= 0) finalizeReceivedWeight(s.id, Math.round(kg * 1000));
    });
    onConfirmed();
  };

  return (
    <ProductionDialog open title={`Tally — ${batchId}`} onClose={onClose}>
      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>
        Series received for this batch, weighed at receipt by worker staff. Enter the final weight for each series — this becomes the weight used against the weaver's outstanding material.
      </div>
      {series.length === 0 ? (
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "20px 0", textAlign: "center" }}>
          No series have been received for this batch yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, maxHeight: 340, overflowY: "auto" }}>
          {series.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 14px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{s.id}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: (s.color || "#ccc").toLowerCase(), border: "1px solid rgba(0,0,0,0.15)" }} />
                    {s.color || "—"}
                  </span>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>· Worker entry: {(s.weightGrams / 1000).toFixed(3)} kg</span>
                  {s.tallied && <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.green }}>· Tallied</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600 }}>Final wt (kg)</label>
                <NumberInput
                  min={0} step={0.001}
                  value={weights[s.id] === undefined || weights[s.id] === "" ? "" : Number(weights[s.id])}
                  onValueChange={v => setWeights(prev => ({ ...prev, [s.id]: v === "" ? "" : String(v) }))}
                  className="w-[84px]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {series.length > 0 && (
        confirming ? (
          <div ref={trackRef} style={{ position: "relative", background: "rgba(110,15,45,0.06)", borderRadius: 10, height: 44, overflow: "hidden", border: `1px solid rgba(110,15,45,0.15)` }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, pointerEvents: "none", paddingLeft: 20 }}>
              Swipe to confirm tally
            </div>
            <motion.div
              drag="x"
              dragConstraints={trackRef}
              dragElastic={0.05}
              dragSnapToOrigin={true}
              onDragEnd={(e, info) => {
                if (trackRef.current && info.offset.x > trackRef.current.offsetWidth - 55) {
                  handleConfirm();
                }
              }}
              style={{ width: 52, height: 42, position: "absolute", left: 0, top: 0, background: T.royalBurgundy, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", color: "#fff", zIndex: 2 }}
            >
              <PhCaretRight size={18} />
            </motion.div>
          </div>
        ) : (
          <Button onClick={() => setConfirming(true)} variant="primary" fullWidth>
            <CheckCircle size={16} /> Confirm Final Weights
          </Button>
        )
      )}
    </ProductionDialog>
  );
}

export function BatchCard({ b, onView, onSlip, onEdit }: { b: Batch; expandedId: string | null; setExpandedId: (id: string | null) => void; onView?: (b: Batch) => void; onSlip?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const cfg = STAGE_CFG[b.stage];
  const pct = Math.round((b.done / b.total) * 100);
  const { getReceivedForBatch } = useMaterialIssue();
  const [tallyOpen, setTallyOpen] = useState(false);
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.badgeColor, background: cfg.badgeBg, borderRadius: 99, padding: "6px 14px", border: `1px solid ${cfg.border}22`, boxShadow: `0 2px 10px ${cfg.badgeBg}` }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.badgeColor, boxShadow: `0 0 6px ${cfg.badgeColor}` }} />
              {cfg.label}
            </span>
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
                <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, color: T.luxuryBrown }}>{b.done}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>/ {b.total} Sarees Completed</span>
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
                {b.qcPassed !== undefined && (
                  <div style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>
                    ✓ QC Passed: {b.qcPassed} {b.done - b.qcPassed > 0 && `(Rejected: ${b.done - b.qcPassed})`}
                  </div>
                )}
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
          <SwipeToTally tallied={isTallied} onOpen={() => setTallyOpen(true)} />
        </div>
      </div>
      {tallyOpen && (
        <TallyDialog batchId={b.id} onClose={() => setTallyOpen(false)} onConfirmed={() => setTallyOpen(false)} />
      )}
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
  const cols = ["Batch Number", "Stage", "Weavers", "Design", "Saree Type", "Progress", "Started", "Expected End", "Making Charges", "Action"];
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 6px 24px rgba(74,6,27,0.05)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 140px 150px 140px 150px 120px 120px 130px 90px", padding: "12px 20px", background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
        {cols.map(h => <div key={h} style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</div>)}
      </div>
      {batches.map((b, i) => {
        const cfg = STAGE_CFG[b.stage];
        const pct = Math.round((b.done / b.total) * 100);
        const est = b.total * b.rate;
        return (
          <div key={b.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 140px 150px 140px 150px 120px 120px 130px 90px", alignItems: "center", padding: "14px 20px", background: i % 2 === 1 ? "rgba(247,242,234,0.55)" : "#FFFFFF", borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${cfg.border}`, minHeight: 64 }}>
            <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{b.id}</div>
            <div><span style={{ display: "inline-block", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.badgeColor, background: cfg.badgeBg, borderRadius: 99, padding: "4px 10px", whiteSpace: "nowrap" }}>{cfg.label}</span></div>
            <div style={{ display: "flex", gap: 6 }}>{b.weavers.map(w => <Pip key={w.id} initials={w.initials} bg={w.bg} size={28} />)}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{b.design}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.designName}</div></div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.sareeTypeName}</div></div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 700, marginBottom: 5 }}>{b.done}/{b.total}</div>
              <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", width: 110 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: cfg.border, borderRadius: 99 }} />
              </div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.started}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: b.late ? T.crimson : T.taupe }}>{b.submitted ?? b.expected}{b.late && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><WarningCircle size={13} /> {b.late}d late</div>}</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, fontWeight: 700 }}>₹{est.toLocaleString("en-IN")}</div>
            <div>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BatchTableView({ batches, onView, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const headers = ["Batch No.", "Stage", "Weaver(s)", "Saree Type", "Materials Given", "Started", "Expected End", "Target", "Done", "QC Passed", "Rate/Saree", "Est. Charges", "Action"];
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 6px 24px rgba(74,6,27,0.05)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1400 }}>
          <thead>
            <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
              {headers.map(h => <th key={h} style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", textAlign: "left", padding: "12px 16px", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {batches.map((b, i) => {
              const cfg = STAGE_CFG[b.stage];
              const est = b.total * b.rate;
              return (
                <tr key={b.id} style={{ background: i % 2 === 1 ? "rgba(247,242,234,0.50)" : "#FFFFFF", borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${cfg.border}` }}>
                  <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 700, whiteSpace: "nowrap" }}>{b.id}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ display: "inline-block", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.badgeColor, background: cfg.badgeBg, borderRadius: 99, padding: "4px 10px", whiteSpace: "nowrap" }}>{cfg.label}</span></td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {b.weavers.map(w => <div key={w.id} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, whiteSpace: "nowrap", fontWeight: 500 }}>{w.name} <span style={{ color: T.taupe }}>({w.id})</span></div>)}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 12, color: T.taupe, maxWidth: 200, lineHeight: 1.5 }}>{b.materials}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13, color: T.taupe, whiteSpace: "nowrap" }}>{b.started}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13, color: b.late ? T.crimson : T.taupe, whiteSpace: "nowrap", fontWeight: b.late ? 600 : 400 }}>{b.submitted ?? b.expected}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 16, color: T.luxuryBrown, textAlign: "center" }}>{b.total}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 16, color: T.antiqueGold, textAlign: "center" }}>{b.done}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 16, color: T.green, textAlign: "center" }}>{b.qcPassed ?? "—"}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>₹{b.rate}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 700 }}>₹{est.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "14px 16px" }}>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {batches.length} of {batches.length} batches</div>
    </div>
  );
}
