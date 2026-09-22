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
 *
 * That code embeds the vendor's whole business name, so it routinely runs to
 * 25-35 characters — far past what a Code128 can hold legibly on a 50mm
 * sticker. <TileCode> is what decides: it prints bars when they will survive
 * the printer and a QR when they will not, which for most GRN labels means a
 * QR. The scanner reads either.
 */
import { LabelSheet, TileCode, type LabelStock } from "@/shared/ui/document";

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
// row, one full-width scannable code with its id printed below it, then a
// single detail line. Sizes are in `em` against --label-unit (set by
// <LabelSheet>), so the tile fills the configured sticker exactly instead of
// the old fixed 82x46mm box, which overflowed the 50x25mm roll.
function LabelTile({ label }: { label: GrnLabel }) {
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

      <TileCode code={label.code} barsEm={9.4} maxCodeEm={2.3} />

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
