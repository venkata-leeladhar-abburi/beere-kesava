/**
 * The physical GRN label — what actually goes onto the drum or bundle.
 * ═══════════════════════════════════════════════════════════════════════════
 * Printed via useDocument(), which isolates #document-print-root so the label
 * sheet prints alone rather than dragging the whole application onto the page.
 * Each label prints on its own page sized to the physical sticker (default
 * 50mm x 25mm, superadmin-configurable in Label Settings), so a roll printer
 * feeds exactly one sticker per label.
 *
 * The code on the label is the line's own `itemCode`
 * ("GRN-SreeVignesh-004-002-1"), never the parent receipt id — that is the
 * value the Issue Material scanner matches against, and the whole point of the
 * tag is to identify this one material, not the delivery it arrived in.
 */
import { labelsApi } from "@/shared/api/labels";
import { LabelSheet, useTileStock, monoFitEm, innerWidthEm, type LabelStock } from "@/shared/ui/document";

export interface GrnLabel {
  /** The scannable line code — also the human-readable id printed below it. */
  code: string;
  materialType: string;
  quantity: string;
  description?: string;
  grnBatchId: string;
  vendor?: string;
  receivedDate?: string;
}

const mono = "var(--font-code, ui-monospace, monospace)";
const ui = "var(--font-ui, system-ui, sans-serif)";
const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

// Same compact layout as the saree tags (SareeTagPrint.tsx): a small header
// row, one full-width barcode with its code printed below it, then a single
// detail line — barcode only, no QR. Sizes are in `em` against --label-unit
// (set by <LabelSheet>), so the tile fills the configured sticker exactly
// instead of the old fixed 82x46mm box, which overflowed the 50x25mm roll.
function LabelTile({ label }: { label: GrnLabel }) {
  const stock = useTileStock();
  // Shrink to fit rather than ellipsise — a half-printed item code can't be
  // typed back in when a scan fails.
  const codeSize = monoFitEm(label.code.length, innerWidthEm(stock), 2.3, 1.5);
  return (
    <div
      style={{
        width: "100%", height: "100%", boxSizing: "border-box",
        border: "0.25mm solid #000", borderRadius: "0.8em",
        padding: "1em 1.2em",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "#FFFFFF", color: "#000000",
        overflow: "hidden", lineHeight: 1.15,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", alignItems: "baseline" }}>
        <span style={{ fontFamily: ui, fontWeight: 700, fontSize: "1.9em", ...ellipsis }}>
          Beere Kesava &amp; Brothers Silks
        </span>
        <span style={{ fontFamily: mono, fontSize: "1.7em", flexShrink: 0 }}>{label.grnBatchId}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img
          // The generator's baked-in caption is suppressed — the code is
          // printed below at a readable size, and on a 25mm-tall sticker
          // printing it twice only costs the bars their height.
          src={labelsApi.barcodeUrl(label.code, { withText: false })}
          alt={`Barcode for ${label.code}`}
          style={{ width: "100%", height: "9.4em", objectFit: "contain", display: "block" }}
        />
        <span style={{ fontFamily: mono, fontWeight: 700, fontSize: `${codeSize}em`, maxWidth: "100%", ...ellipsis }}>
          {label.code}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1em", fontFamily: ui, fontSize: "1.8em" }}>
        <span style={{ minWidth: 0, ...ellipsis }}>
          {label.materialType} · {label.quantity}
        </span>
        {(label.vendor || label.receivedDate) && (
          <span style={{ flexShrink: 0 }}>{label.vendor || label.receivedDate}</span>
        )}
      </div>
    </div>
  );
}

export function GrnLabelSheet({ labels, stock }: { labels: GrnLabel[]; stock?: LabelStock }) {
  return (
    <LabelSheet stock={stock}>
      {labels.map(label => <LabelTile key={label.code} label={label} />)}
    </LabelSheet>
  );
}
