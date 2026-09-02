/**
 * The physical GRN label — what actually goes onto the drum or bundle.
 * ═══════════════════════════════════════════════════════════════════════════
 * Printed via useDocument(), which isolates #document-print-root so the label
 * sheet prints alone rather than dragging the whole application onto the page.
 * Labels tile across A4 so a sheet of stickers can be run in one job; a single
 * label prints as one tile on an otherwise empty sheet.
 *
 * The code on the label is the line's own `itemCode`
 * ("GRN-SreeVignesh-004-002-1"), never the parent receipt id — that is the
 * value the Issue Material scanner matches against, and the whole point of the
 * tag is to identify this one material, not the delivery it arrived in.
 */
import { labelsApi } from "@/shared/api/labels";

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

// Same compact vertical layout as the saree tags (SareeTagPrint.tsx): a
// small header row, one full-width barcode with its code printed below it,
// then a couple of tight detail lines — barcode only, no QR.
function LabelTile({ label }: { label: GrnLabel }) {
  return (
    <div
      style={{
        // Fixed physical size so a label is the same on screen and on paper,
        // and so tiles land predictably on a sticker sheet.
        width: "82mm",
        height: "46mm",
        boxSizing: "border-box",
        border: "0.3mm solid #000",
        borderRadius: "1.5mm",
        padding: "3mm 4mm",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#FFFFFF",
        color: "#000000",
        // A label split across a page break is a wasted sticker.
        breakInside: "avoid",
        pageBreakInside: "avoid",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: ui, fontWeight: 700, fontSize: "8pt" }}>Beere Kesava &amp; Brothers Silks</span>
        <span style={{ fontFamily: mono, fontSize: "7pt", color: "#555" }}>{label.grnBatchId}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1mm" }}>
        <img
          src={labelsApi.barcodeUrl(label.code)}
          alt={`Barcode for ${label.code}`}
          style={{ width: "100%", maxWidth: "68mm", height: "11mm", objectFit: "contain" }}
        />
        <span style={{ fontFamily: mono, fontWeight: 700, fontSize: "9.5pt", wordBreak: "break-all" as const, textAlign: "center" }}>{label.code}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", fontFamily: ui, fontSize: "7.5pt", color: "#333" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label.materialType} · {label.quantity}
        </span>
        {label.vendor && <span style={{ flexShrink: 0 }}>{label.vendor}</span>}
      </div>

      {label.description && (
        <div style={{ fontFamily: ui, fontSize: "7pt", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label.description}
        </div>
      )}

      {label.receivedDate && (
        <div style={{ fontFamily: mono, fontSize: "7pt", color: "#555" }}>{label.receivedDate}</div>
      )}
    </div>
  );
}

export function GrnLabelSheet({ labels }: { labels: GrnLabel[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4mm",
        padding: "8mm",
        background: "#FFFFFF",
        // print.css sets `@page { margin: 16mm 0 13mm }` for A4 documents;
        // labels need even side margins instead, since nothing here is
        // deliberately full-bleed the way a letterhead band is.
        width: "194mm",
      }}
    >
      {labels.map(label => (
        <LabelTile key={label.code} label={label} />
      ))}
    </div>
  );
}
