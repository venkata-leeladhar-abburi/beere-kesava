import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Flower2, Clock, Layers, Package, RotateCcw } from "lucide-react";
import { formatDueDate } from "./batchCompletion";
import { SareeRow } from "@/features/production";
import { Card, ProgressBar, StatusBadge, SareeTypeDetailCard } from "./theme";
import { Button } from "../../../../shared/ui/primitives";
import { DispatchInstructionsBlock } from "./desktop/batchCardHelpers";
import { WeaverBatchSareesModal } from "./WeaverBatchSareesModal";

// Shared tokens
const C = {
  burg: "#6E0F2D", dark: "#3D0E1A", gold: "#C89B47", green: "#1E6640",
  crim: "#C0392B", text: "#3B2314", muted: "#69635E",
  bdr: "rgba(110,15,45,0.10)", cream: "#F7F2EA", white: "#FFFFFF",
};
const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

export type MyBatchEntry = { batchId: string; status: string; dueDate: string; rows: SareeRow[]; myRows: SareeRow[]; totalCount: number; createdAt: string; updatedAt: string; };

export function MobileBatchCard({ b, idx }: { b: MyBatchEntry; idx: number }) {
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [showSarees, setShowSarees] = useState(false);

  const isActive = b.status === "active";
  const borderColor = idx % 2 === 0 ? C.burg : C.gold;
  const myCount = b.myRows.length;
  const readyCount = b.myRows.filter(r => r.sareeId).length;
  const pendingCount = myCount - readyCount;
  const qcPassedCount = b.myRows.filter(r => r.qcPassed === true).length;
  // Produced = QC-passed OR finished via the Raise Quotation receive flow —
  // either milestone alone counts a saree as produced. A semi-approved saree
  // meets neither: it is back with the weaver for rework.
  const producedCount = b.myRows.filter(r => r.qcPassed === true || r.finished === true).length;
  const reworkCount = b.myRows.filter(r => r.awaitingRework === true).length;
  const sareeTypePairs = Array.from(new Map(b.myRows.filter(r => r.sareeTypeCode && r.sareeTypeName).map(r => [r.sareeTypeCode!, r.sareeTypeName!])).entries());
  const bulkOrders    = Array.from(new Set(b.myRows.map(r => r.bulkOrderLabel).filter(Boolean))) as string[];
  const generalStock  = b.myRows.filter(r => !r.bulkOrderLabel).length;

  return (
    <div style={{ margin: "0 20px 14px" }}>
      <Card leftBorder={borderColor} style={{ padding: 18 }} onClick={() => setShowSarees(true)}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.burg }}>
            {b.batchId}
          </span>
          <StatusBadge
            label={isActive ? "🟢 Open — Weaving" : "🟡 Draft"}
            color={isActive ? C.green : C.gold}
            bg={isActive ? "rgba(30,102,64,0.10)" : "rgba(200,155,71,0.15)"}
          />
        </div>
        {/* Wrapped so a click inside the modal's Radix portal — which still
            bubbles through the React tree, not the DOM tree it's rendered
            into — doesn't reach the card's own onClick and reopen it. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- pure event-isolation wrapper (stops a nested portal/button click from bubbling to the card's own onClick); it has no interaction of its own, so it isn't a keyboard target */}
        <div onClick={e => e.stopPropagation()}>
          <WeaverBatchSareesModal batch={b} open={showSarees} onOpenChange={setShowSarees} />
        </div>

        {/* Saree count */}
        <div style={{ background: C.cream, borderRadius: 12, padding: "12px 16px", marginBottom: 12, textAlign: "center" as const }}>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Sarees assigned to you</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.text, lineHeight: 1 }}>{myCount}</div>
          {pendingCount > 0 && (
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3 }}>
              {readyCount} with ID · {pendingCount} pending setup
            </div>
          )}
        </div>

        {/* Produced progress indicator — finished via either the Worker
            Staff receive-back flow or the Raise Quotation receive flow */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Produced: {producedCount} of {myCount}</span>
            <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 600 }}>{Math.round((producedCount / myCount) * 100)}%</span>
          </div>
          <ProgressBar pct={(producedCount / myCount) * 100} height={7} />
        </div>

        {/* QC progress indicator */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>QC: {qcPassedCount} of {myCount} passed</span>
            <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 600 }}>{Math.round((qcPassedCount / myCount) * 100)}%</span>
          </div>
          <ProgressBar pct={(qcPassedCount / myCount) * 100} height={7} />
        </div>

        {/* Semi-approved sarees are back with the weaver — called out here so
            the gap between Produced and the batch total is explained. */}
        {reworkCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,155,71,0.10)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 9, padding: "8px 12px", marginBottom: 12 }}>
            <RotateCcw size={13} color={C.gold} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>
              <strong>{reworkCount}</strong> semi-approved — rework and hand in again
            </span>
          </div>
        )}

        {/* Clickable saree type chips — stop propagation so this doesn't also
            trigger the card's own click-to-open-batch handler above. */}
        {sareeTypePairs.length > 0 && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- pure event-isolation wrapper (stops a nested portal/button click from bubbling to the card's own onClick); it has no interaction of its own, so it isn't a keyboard target
          <div style={{ marginBottom: 10 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 6 }}>TAP TO VIEW SAREE TYPE DETAILS</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {sareeTypePairs.map(([code, name]) => (
                <Button
                  key={code}
                  onClick={() => setExpandedType(expandedType === code ? null : code)}
                  size="sm"
                  className={
                    expandedType === code
                      ? "inline-flex items-center gap-1.5 bg-[#3D0E1A] border-[1.5px] border-[#3D0E1A] rounded-lg px-3 py-1 h-auto text-white"
                      : "inline-flex items-center gap-1.5 bg-[rgba(61,14,26,0.04)] border-[1.5px] border-[rgba(110,15,45,0.10)] rounded-lg px-3 py-1 h-auto text-[#3B2314]"
                  }
                >
                  <Layers size={11} color={expandedType === code ? "#FFF" : C.text} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: expandedType === code ? "#FFF" : C.text }}>{name}</span>
                </Button>
              ))}
            </div>
            <AnimatePresence>
              {expandedType && (
                <SareeTypeDetailCard
                  key={expandedType}
                  typeCode={expandedType}
                  typeName={sareeTypePairs.find(([c]) => c === expandedType)?.[1] ?? expandedType}
                  onClose={() => setExpandedType(null)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Order strips */}
        {bulkOrders.map(label => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.15)", borderRadius: 9, padding: "8px 12px", marginBottom: 8 }}>
            <Package size={13} color={C.green} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Customer Order</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.green }}>{label}</div>
            </div>
          </div>
        ))}
        {generalStock > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(139,112,96,0.07)", border: "1px solid rgba(139,112,96,0.15)", borderRadius: 9, padding: "8px 12px", marginBottom: 8 }}>
            <Package size={13} color={C.muted} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>General Stock</div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{generalStock} saree{generalStock !== 1 ? "s" : ""} for stock</div>
            </div>
          </div>
        )}

        {formatDueDate(b.dueDate) && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
            <Clock size={14} color={C.muted} />
            <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Due by <span style={{ color: C.text, fontWeight: 600 }}>{formatDueDate(b.dueDate)}</span></span>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <DispatchInstructionsBlock batchId={b.batchId} />
        </div>
      </Card>
    </div>
  );
}

// Completed batch card — shown only once ALL of the weaver's sarees in the batch have passed QC
export function CompletedBatchCard({ b }: { b: MyBatchEntry }) {
  const [showSarees, setShowSarees] = useState(false);
  const produced = b.myRows.filter(r => r.qcPassed === true || r.finished === true).length;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setShowSarees(true)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowSarees(true); } }}
      style={{ margin: "0 16px 12px", background: C.white, borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 2px 16px rgba(44,24,16,0.07)", cursor: "pointer" }}
    >
      {/* Color band + batch id */}
      <div style={{ height: 56, background: "linear-gradient(135deg, #1E6640 0%, #2D9640 100%)", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, position: "relative" as const }}>
        <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(to right, rgba(26,5,12,0.45) 0%, transparent 70%)" }} />
        <div style={{ position: "relative" as const, display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <Flower2 size={18} color="rgba(255,255,255,0.70)" />
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{b.batchId}</span>
        </div>
        <span style={{ position: "relative" as const, fontFamily: F.u, fontSize: 12, color: "#1D4ED8", background: "rgba(255,255,255,0.92)", borderRadius: 999, padding: "3px 10px", fontWeight: 600 }}>✓ Completed</span>
      </div>
      {/* Wrapped so a click inside the modal's Radix portal — which still
          bubbles through the React tree, not the DOM tree it's rendered
          into — doesn't reach the card's own onClick and reopen it. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- pure event-isolation wrapper (stops a nested portal/button click from bubbling to the card's own onClick); it has no interaction of its own, so it isn't a keyboard target */}
      <div onClick={e => e.stopPropagation()}>
        <WeaverBatchSareesModal batch={b} open={showSarees} onOpenChange={setShowSarees} />
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ background: C.cream, borderRadius: 10, padding: "10px 10px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 3 }}>PRODUCED</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text }}>{produced}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>sarees</div>
          </div>
          <div style={{ background: "rgba(30,102,64,0.08)", borderRadius: 10, padding: "10px 10px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 3 }}>QC PASS</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.green }}>100%</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>all passed</div>
          </div>
        </div>

        {formatDueDate(b.dueDate) && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Clock size={13} color={C.muted} />
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Due by <span style={{ color: C.text, fontWeight: 600 }}>{formatDueDate(b.dueDate)}</span></span>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <DispatchInstructionsBlock batchId={b.batchId} />
        </div>
      </div>
    </div>
  );
}

export type BatchQuickFilter = "all" | "active" | "qc-pending" | "completed" | "draft";
export const BATCH_QUICK_FILTERS: { id: BatchQuickFilter; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "active",     label: "Active" },
  { id: "qc-pending", label: "QC Pending" },
  { id: "completed",  label: "Completed" },
  { id: "draft",      label: "Draft" },
];

export function BatchQuickFilterPills({ value, onChange }: { value: BatchQuickFilter; onChange: (v: BatchQuickFilter) => void }) {
  return (
    <div style={{ position: "relative" as const }}>
      <div className="wp-filter-scroll" style={{ display: "flex", gap: 8, padding: "12px 20px 4px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
        <style>{`.wp-filter-scroll::-webkit-scrollbar { display: none; }`}</style>
        {BATCH_QUICK_FILTERS.map(f => {
          const isActive = value === f.id;
          return (
            <Button
              key={f.id}
              onClick={() => onChange(f.id)}
              size="sm"
              className={
                isActive
                  ? "flex-shrink-0 rounded-full px-4 py-2 h-auto border-none bg-[#6E0F2D] text-white font-semibold whitespace-nowrap"
                  : "flex-shrink-0 rounded-full px-4 py-2 h-auto border border-[rgba(110,15,45,0.10)] bg-white text-[#3B2314] font-normal whitespace-nowrap"
              }
            >
              {f.label}
            </Button>
          );
        })}
      </div>
      {/* Fade hint — signals there are more pills to scroll to, so the last one
          never looks like it's simply been cut off by the screen edge. */}
      <div style={{ position: "absolute" as const, top: 0, right: 0, bottom: 4, width: 28, background: "linear-gradient(to right, rgba(255,255,255,0), #FAFAFA)", pointerEvents: "none" as const }} />
    </div>
  );
}
