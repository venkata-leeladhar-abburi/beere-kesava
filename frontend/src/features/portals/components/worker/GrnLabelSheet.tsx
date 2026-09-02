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

function LabelTile({ label }: { label: GrnLabel }) {
  return (
    <div
      style={{
        // Fixed physical size so a label is the same on screen and on paper,
        // and so tiles land predictably on a sticker sheet.
        width: "88mm",
        height: "52mm",
        boxSizing: "border-box",
        border: "1px solid #000",
        borderRadius: "2mm",
        padding: "4mm",
        display: "flex",
        gap: "4mm",
        alignItems: "flex-start",
        background: "#FFFFFF",
        color: "#000000",
        // A label split across a page break is a wasted sticker.
        breakInside: "avoid",
        pageBreakInside: "avoid",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ fontFamily: mono, fontSize: "3.6mm", fontWeight: 700, letterSpacing: "0.02em", wordBreak: "break-all", lineHeight: 1.25 }}>
          {label.code}
        </div>
        <div style={{ fontFamily: ui, fontSize: "3.6mm", fontWeight: 700, marginTop: "1.6mm" }}>
          {label.materialType} · {label.quantity}
        </div>
        {label.description && (
          <div style={{ fontFamily: ui, fontSize: "2.9mm", marginTop: "1mm", lineHeight: 1.3 }}>{label.description}</div>
        )}
        <div style={{ marginTop: "auto", fontFamily: ui, fontSize: "2.6mm", lineHeight: 1.45 }}>
          <div style={{ fontFamily: mono }}>{label.grnBatchId}</div>
          {label.vendor && <div>{label.vendor}</div>}
          {label.receivedDate && <div>{label.receivedDate}</div>}
        </div>
      </div>
      {/* Barcode only, same style as the saree tags (SareeTagPrint.tsx) —
          no QR alongside it. The code itself is already printed in the text
          column on the left, so it isn't repeated here. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "34mm", height: "100%" }}>
        <img
          src={labelsApi.barcodeUrl(label.code)}
          alt={`Barcode for ${label.code}`}
          style={{ width: "100%", height: "16mm", objectFit: "contain" }}
        />
      </div>
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
