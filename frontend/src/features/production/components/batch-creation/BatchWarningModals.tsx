import React from "react";
import { AlertTriangle, ShoppingBag, Save as FloppyDisk } from "lucide-react";
import { T, F } from "./constants";
import { Button } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { EntityCode } from "../../../../shared/ui/domain";
import type { BulkOrderCapacityConflict } from "../useBatchFormHandlers";

const statRow: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
  padding: "7px 0", borderBottom: "1px solid rgba(110,15,45,0.07)",
};

/**
 * Blocks a bulk-order assignment that exceeds the order's placed quantity.
 * Nothing has been written to the rows when this opens — the admin either
 * takes the part that fits, or cancels and re-selects.
 */
export function BulkOrderCapacityModal({
  conflict, onAssignPartial, onCancel,
}: {
  conflict: BulkOrderCapacityConflict | null;
  onAssignPartial: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={!!conflict} onOpenChange={o => { if (!o) onCancel(); }} size="sm">
      {conflict && (
        <div style={{ padding: "26px 26px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(183,121,31,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={21} color={T.amber} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 16.5, fontWeight: 700, color: T.luxuryBrown }}>
                Not enough room in this bulk order
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                <EntityCode type="order" value={conflict.order.ref} size="sm" />
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{conflict.order.customer}</span>
              </div>
            </div>
          </div>

          <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, lineHeight: 1.65 }}>
            <strong>{conflict.order.ref}</strong> was placed for{" "}
            <strong>{conflict.order.total} saree{conflict.order.total === 1 ? "" : "s"}</strong>, and only{" "}
            <strong style={{ color: conflict.capacity === 0 ? T.red : T.amber }}>
              {conflict.capacity}
            </strong>{" "}
            {conflict.capacity === 1 ? "is" : "are"} still unassigned. You selected{" "}
            <strong>{conflict.selectedCount} saree{conflict.selectedCount === 1 ? "" : "s"}</strong> — that is{" "}
            <strong style={{ color: T.red }}>{conflict.overflow} too many</strong>.
          </div>

          <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "6px 14px" }}>
            <div style={statRow}>
              <span>Order placed for</span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{conflict.order.total}</strong>
            </div>
            <div style={statRow}>
              <span>Already assigned in this batch</span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{conflict.assignedInBatch}</strong>
            </div>
            <div style={statRow}>
              <span>Assigned in other batches</span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{conflict.assignedElsewhere}</strong>
            </div>
            <div style={{ ...statRow, borderBottom: "none", color: T.royalBurgundy, fontWeight: 700 }}>
              <span>Room left</span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{conflict.capacity}</strong>
            </div>
          </div>

          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.6 }}>
            {conflict.capacity > 0
              ? `Assign the first ${conflict.capacity} selected row${conflict.capacity === 1 ? "" : "s"} to this order and leave the remaining ${conflict.overflow} as they are, or cancel and select fewer rows.`
              : "This order is already full. Select a different order, or leave these sarees on General Stock."}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button onClick={onCancel} variant="secondary" size="md">Cancel</Button>
            {conflict.capacity > 0 && (
              <Button onClick={onAssignPartial} variant="primary" size="md" iconLeft={ShoppingBag}>
                Assign {conflict.capacity} only
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Guards navigation away from a batch with unsaved row edits — the old page
 * dropped them silently when the tab changed.
 */
export function UnsavedChangesModal({
  open, onSaveAndLeave, onDiscard, onCancel, isSaving,
}: {
  open: boolean;
  onSaveAndLeave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <Modal open={open} onOpenChange={o => { if (!o) onCancel(); }} size="xs">
      <div style={{ padding: "26px 26px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(183,121,31,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={21} color={T.amber} />
          </div>
          <div style={{ fontFamily: F.display, fontSize: 16.5, fontWeight: 700, color: T.luxuryBrown }}>
            Unsaved changes
          </div>
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe, lineHeight: 1.65 }}>
          You have edits in this batch that have not been saved. Leaving now will discard them.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button onClick={onCancel} variant="secondary" size="md">Keep editing</Button>
          <Button onClick={onDiscard} variant="danger-subtle" size="md">Discard</Button>
          <Button onClick={onSaveAndLeave} variant="primary" size="md" iconLeft={FloppyDisk} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save & leave"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
