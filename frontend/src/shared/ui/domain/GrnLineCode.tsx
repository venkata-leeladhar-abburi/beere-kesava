/**
 * <GrnLineCode> — the traceability chip for one received material line.
 * ═══════════════════════════════════════════════════════════════════════════
 * A goods receipt carries two levels of id and the UI kept showing only the
 * outer one: `GRN-RajaSilks-003-002` is the whole delivery, while each
 * material inside it has its own `GRN-RajaSilks-003-002-1/-2/-3` — the id
 * actually printed on that material's barcode label. Weaver, loom and vendor
 * screens rendered the batch id against every line, so three different
 * materials all displayed the same code and nothing could be traced back to
 * the drum it came from.
 *
 * This renders the line code as the primary id (matching the barcode label)
 * and keeps the parent receipt as a quiet caption, so both levels stay
 * visible. Falls back to the batch id alone for rows received before per-line
 * codes existed.
 */
import * as React from "react";
import { EntityCode } from "./EntityCode";

export interface GrnLineCodeProps {
  /** Parent receipt id, e.g. `GRN-RajaSilks-003-002`. */
  batchId?: string | null;
  /** Per-line id, e.g. `GRN-RajaSilks-003-002-1`. Absent on legacy rows. */
  itemCode?: string | null;
  /** Hides the parent-receipt caption where the batch is already shown nearby. */
  hideParent?: boolean;
  size?: "sm" | "md";
}

export function GrnLineCode({ batchId, itemCode, hideParent, size = "sm" }: GrnLineCodeProps) {
  const primary = itemCode || batchId;
  if (!primary) return null;

  // Only worth captioning the parent when it isn't already the value shown.
  const showParent = !hideParent && !!batchId && !!itemCode && itemCode !== batchId;

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <EntityCode type="goodsReceipt" value={primary} size={size} />
      {showParent && (
        <span
          className="text-[var(--text-tertiary)]"
          style={{ fontFamily: "var(--font-code)", fontSize: "var(--text-code-sm)", fontVariantNumeric: "tabular-nums" }}
        >
          of {batchId}
        </span>
      )}
    </span>
  );
}
