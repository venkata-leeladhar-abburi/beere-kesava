/**
 * The physical saree tag — printed and tied to the piece on receipt.
 * ═══════════════════════════════════════════════════════════════════════════
 * Same contract as the GRN label sheet: printed through useDocument() so only
 * the tags reach the page, one tag per page sized to the physical sticker
 * (default 50mm x 25mm, superadmin-configurable in Label Settings), and
 * carrying a genuinely scannable code rather than decorative stripes — the
 * shop-staff scanner reads these tags to look a saree up by its id.
 *
 * At 50x25 the code sits on the left and the text beside it, rather than
 * stacked: a QR wide enough to scan is most of a 25mm-tall sticker's height,
 * so a vertical layout left no room for anything else.
 */
import { ScannableCode } from "@/shared/ui/domain";
import { LabelSheet, useTileStock, monoFitEm, innerWidthEm, type LabelStock } from "@/shared/ui/document";

export interface SareeTag {
  sareeId: string;
  entityLabel: string;
  entityValue: string;
  date: string;
}

const mono = "var(--font-code, ui-monospace, monospace)";
const ui = "var(--font-ui, system-ui, sans-serif)";
const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

/** QR edge length, in label units. 17 of a 25-unit-tall sticker leaves a real
 *  quiet zone above and below and still gives ~0.45mm per module for a
 *  24-character id — comfortably above what a 203dpi thermal head resolves —
 *  while leaving the text column wide enough to print the id unabbreviated. */
const QR_EM = 17;

function TagTile({ tag }: { tag: SareeTag }) {
  const stock = useTileStock();
  // The column beside the QR: inner width less the code and the gap between.
  const columnEm = innerWidthEm(stock) - QR_EM - 1.2;
  // Fit rather than ellipsise — the id is the one thing on this tag that has
  // to stay readable when the QR won't scan.
  const idSize = monoFitEm(tag.sareeId.length, columnEm, 2.6, 1.4);
  return (
    <div
      style={{
        width: "100%", height: "100%", boxSizing: "border-box",
        border: "0.25mm solid #000", borderRadius: "0.8em",
        padding: "1em 1.2em",
        display: "flex", alignItems: "center", gap: "1.2em",
        background: "#FFFFFF", color: "#000000",
        overflow: "hidden", lineHeight: 1.2,
      }}
    >
      <div style={{ width: `${QR_EM}em`, height: `${QR_EM}em`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ScannableCode value={tag.sareeId} size={76} className="bk-label-qr" />
      </div>

      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.4em" }}>
        <div style={{ fontFamily: ui, fontSize: "1.8em", ...ellipsis }}>
          Beere Kesava &amp; Brothers Silks
        </div>
        <div style={{ fontFamily: mono, fontSize: `${idSize}em`, fontWeight: 700, ...ellipsis }}>{tag.sareeId}</div>
        <div style={{ fontFamily: ui, fontSize: "1.7em", ...ellipsis }}>
          {tag.entityLabel}: {tag.entityValue}
        </div>
        <div style={{ fontFamily: ui, fontSize: "1.7em", ...ellipsis }}>{tag.date}</div>
      </div>
    </div>
  );
}

export function SareeTagSheet({ tags, stock }: { tags: SareeTag[]; stock?: LabelStock }) {
  return (
    <LabelSheet stock={stock}>
      {/* One saree can be tagged more than once (extra copies), so the id
          alone isn't unique across the run. */}
      {tags.map((tag, i) => (
        // eslint-disable-next-line react/no-array-index-key -- copies of one id are intentionally identical
        <TagTile key={`${tag.sareeId}-${i}`} tag={tag} />
      ))}
    </LabelSheet>
  );
}
