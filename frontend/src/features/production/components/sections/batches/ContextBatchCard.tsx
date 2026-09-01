import { motion } from "motion/react";
import { Palette, ArrowRight } from "lucide-react";
import { useDesignLibrary } from "@/features/design-library";
import { type BatchRecord, type SareeRow } from "../../../contexts/BatchContext";
import { T, F } from "../../theme";
import { Button } from "../../../../../shared/ui/primitives";
import { EntityCode } from "@/shared/ui/domain";
import { imgSareeMock as imgSaree } from "@/shared/constants/mockImages";

// Kept in step with batch-creation/constants.tsx's rowComplete, which is the
// definition the Finalize gate uses. Requiring designCode and sareeTypeCode
// here counted rows as incomplete that the batch page considers finished —
// so a batch could be finalized and still show "0 complete" on its card.
// Both are optional: design is a nullable FK, and the saree type is confirmed
// at receipt rather than up front.
//
// A factory-loom row is complete too — keying off weaverId alone left every
// in-house row uncounted.
export function rowComplete(r: SareeRow) {
  return !!((r.weaverId || r.factoryLoomId) && r.sareeId);
}
export function weaverBreakdown(rows: SareeRow[]): { name: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const key = r.weaverName || "Unassigned";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}
export function bulkOrderBreakdown(rows: SareeRow[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const key = r.bulkOrderLabel || "Not assigned";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([label, count]) => ({ label, count }));
}

export function ContextBatchCard({
  b,
  onNavigateBatches,
  onClick,
}: {
  b: BatchRecord;
  onNavigateBatches?: (batchId: string) => void;
  onClick?: () => void;
}) {
  const { getDesign } = useDesignLibrary();
  const firstRow = b.rows[0];
  const designObj = firstRow ? getDesign(firstRow.designCode) : undefined;
  const designImage = designObj?.colorSlipPhoto || designObj?.designGraph || imgSaree;

  const completeCount = b.rows.filter(rowComplete).length;
  const pct = b.totalCount > 0 ? Math.round((completeCount / b.totalCount) * 100) : 0;
  const weavers = weaverBreakdown(b.rows);
  const orders = bulkOrderBreakdown(b.rows);
  const hasDueDate = Boolean(b.dueDate);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.008, boxShadow: "0 24px 60px rgba(110,15,45,0.12)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{
        background: "#FFFFFF",
        border: `1px solid ${T.borderDef}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(74,6,27,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
      }}
    >
      <div style={{ height: 160, position: "relative", overflow: "hidden", background: T.silkCream }}>
        <motion.img
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          src={designImage}
          alt={b.batchId}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />

        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <EntityCode type="batch" value={b.batchId} size="sm" />
        </div>

        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: b.status === "active" ? "#FFFFFF" : T.luxuryBrown, background: b.status === "active" ? "rgba(30,102,64,0.85)" : "rgba(200,155,71,0.92)", backdropFilter: "blur(4px)", borderRadius: 99, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: b.status === "active" ? "#2ECC71" : T.royalBurgundy }} />
            {b.status === "active" ? "Active" : "Draft"}
          </span>
        </div>

        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{b.totalCount} Sarees</div>
          </div>
          {hasDueDate && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.goldLight }}>{b.dueDate}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {firstRow && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "8px 12px" }}>
            <Palette size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {firstRow.sareeTypeName} · <span style={{ fontFamily: F.ui, color: T.royalBurgundy }}>{firstRow.designCode}</span>
            </span>
          </div>
        )}

        <div>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            Assigned Weavers
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {weavers.map(w => (
              <span key={w.name} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: w.name === "Unassigned" ? "rgba(139,112,96,0.06)" : "rgba(110,15,45,0.05)", color: w.name === "Unassigned" ? T.taupe : T.royalBurgundy, border: `1px solid ${w.name === "Unassigned" ? "rgba(139,112,96,0.15)" : T.borderDef}`, borderRadius: 8, padding: "4px 8px" }}>
                {w.count} × {w.name}
              </span>
            ))}
          </div>
        </div>

        {orders.length > 0 && (
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Linked Orders
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {orders.map(o => (
                <span key={o.label} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: o.label === "Not assigned" ? "rgba(139,112,96,0.06)" : "rgba(30,102,64,0.05)", color: o.label === "Not assigned" ? T.taupe : T.green, border: `1px solid ${o.label === "Not assigned" ? "rgba(139,112,96,0.15)" : "rgba(30,102,64,0.15)"}`, borderRadius: 8, padding: "4px 8px" }}>
                  {o.count} × {o.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 1, background: "rgba(110,15,45,0.05)", margin: "4px 0" }} />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Rows complete: {completeCount} of {b.totalCount}</span>
            <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 800, color: pct === 100 ? T.green : T.antiqueGold }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "100%", background: pct === 100 ? `linear-gradient(90deg, ${T.green} 0%, #4ade80 100%)` : `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99 }}
            />
          </div>
        </div>

        {(b.createdBy || b.talliedBy) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {b.createdBy && (
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>Created by {b.createdBy}</div>
            )}
            {b.talliedBy && (
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>Tallied by {b.talliedBy}</div>
            )}
          </div>
        )}

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <Button
            onClick={(e) => { e.stopPropagation(); onNavigateBatches?.(b.batchId); }}
            variant="secondary" size="md" iconLeft={ArrowRight} fullWidth
            className="border-[1.5px] border-[rgba(110,15,45,0.16)] bg-[rgba(110,15,45,0.04)] text-[#6E0F2D] hover:bg-[rgba(110,15,45,0.08)]"
          >
            Open in Batch Creation
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

