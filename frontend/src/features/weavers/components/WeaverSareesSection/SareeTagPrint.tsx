import * as React from "react";
import {
  useDocument, LabelSheet, useLabelStock, useTileStock, monoFitEm, innerWidthEm,
  DEFAULT_LABEL_STOCK, type LabelStock,
} from "../../../../shared/ui/document";
import { labelsApi } from "../../../../shared/api/labels";
import { formatMoney, rupees } from "@/lib/domain/money";
import { encodeCostCipher } from "@/lib/domain/costCipher";

/**
 * The only fields a physical tag actually prints. Kept deliberately narrow so
 * any stock list can print tags — `WeaverSareeRow` satisfies it structurally,
 * and so does the shop portal's `ShopStockItem` once mapped.
 */
export interface SareeTagData {
  sareeId: string;
  batchId?: string | null;
  designCode?: string | null;
  sareeTypeCode?: string | null;
  sareeTypeName?: string | null;
  color?: string | null;
  /** Weight in grams. */
  weight?: number | null;
  /** Full weaver name, printed with the loom number ("Ramoji Rao · Loom 1"). */
  weaverName?: string | null;
  loomNumber?: number | null;
  /** Printed as DDMMYY (e.g. "020926"). */
  date?: string | null;
  /** Printed on the tag when present — the shop's counter price. */
  retailPrice?: number | null;

  /** Set only for an external-purchase piece — switches the tag to that
   *  layout: supplier short name, invoice, serial, ciphered cost, plain
   *  selling price, instead of the weaver/loom/weight layout above. */
  isExternal?: boolean;
  supplierShortName?: string | null;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  serial?: string | null;
  /** Retail/selling price, printed in plain rupees. */
  sellingPrice?: number | null;
  /** Buying/cost price — printed cost-ciphered (see costCipher.ts), never in plain rupees. */
  costPrice?: number | null;
}

/** DDMMYY, e.g. 2026-09-02 -> "020926". */
function ddmmyy(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

// ── Saree tag print sheet ────────────────────────────────────────────────────
// A run of physical stickers (default 50mm x 25mm, superadmin-configurable in
// Label Settings), printed through the same isolated #document-print-root as
// invoices so it never drags the rest of the app onto paper. One sticker per
// page, so a roll printer feeds exactly one label per tag.
//
// Everything inside a tile is sized in `em` against --label-unit (a 25th of
// the label height, set by <LabelSheet>), so the layout stays proportional if
// a different roll is configured instead of overflowing the sticker the way
// the old fixed 82x46mm tile did.

/** The shared frame: hairline border, tight padding, vertical rhythm. */
function TileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%", height: "100%", boxSizing: "border-box",
        border: "0.25mm solid #000", borderRadius: "0.8em",
        padding: "1em 1.2em",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden", lineHeight: 1.15,
      }}
    >
      {children}
    </div>
  );
}

const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

/**
 * Narrow modules a Code128 symbol needs for `code`, as an upper bound: 11 per
 * character, plus the start and check characters (11 each) and the stop
 * pattern (13). Subset C pairs long digit runs into one character, so a code
 * with many digits comes out narrower than this — erring that way is the safe
 * direction, since the number only decides whether the tag falls back to a QR.
 */
function code128Modules(code: string): number {
  return 11 * (code.length + 2) + 13;
}

/**
 * The narrowest bar worth printing, in mm.
 *
 * A 203dpi thermal head lays down 0.125mm dots, so 0.21mm is about 1.7 dots
 * per module. Measured against a simulated print of the real generator
 * output: at 1.8 dots a 14-character id decodes, at 1.5 it does not.
 */
const MIN_MODULE_MM = 0.21;

/** A tile's usable inner width in mm — the stock width less TileFrame's
 *  1.2em padding on each side (1em is a 25th of the label height). */
function innerWidthMm(stock: LabelStock): number {
  return innerWidthEm(stock) * (stock.heightMm / 25);
}

/** Barcode + the code printed underneath, the two things a tag exists for.
 *  The generator's own baked-in text is suppressed (withText: false) — at this
 *  size printing the code twice just costs the bars their height. */
function TileCode({ code, barsEm = 9.4, maxCodeEm = 2.5 }: { code: string; barsEm?: number; maxCodeEm?: number }) {
  const stock = useTileStock();
  // Shrink to fit rather than ellipsise — a half-printed id is unreadable and
  // the barcode's own caption is switched off.
  const size = monoFitEm(code.length, innerWidthEm(stock), maxCodeEm, 1.5);

  // A long id — an external-purchase code carrying a long free-text invoice
  // number, e.g. RAVI-INV-2026-118-07 — simply does not fit a scannable
  // Code128 on a 50mm sticker: 275 modules across 47mm is 1.4 printer dots
  // each, and it prints as an unreadable smear however the bars are laid
  // out. A QR of the same id is square, so it spends its resolution in two
  // dimensions instead of one and still decodes at this size. The scanner
  // reads both (CameraScannerModal hints Code128 AND QR), so the tag simply
  // prints whichever one can survive the printer.
  const useQr = innerWidthMm(stock) / code128Modules(code) < MIN_MODULE_MM;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* `fill`, deliberately, not `contain`.
          A 14-character Code128 is ~189 narrow modules wide but only ~4.7x as
          wide as it is tall, while the slot it sits in is ~6.8x as wide as it
          is tall. `contain` therefore fitted the image by HEIGHT and left the
          bars occupying barely 30mm of a 50mm sticker — a 0.165mm module, or
          1.3 dots on a 203dpi thermal head, which prints as a smear no camera
          can decode. `fill` spends the whole sticker width on the bars
          instead (~0.24mm a module) and squashes only the bar HEIGHT, which a
          1D symbology does not encode anything in. The quiet zone is baked
          into the PNG (labels.service.ts) so it stretches along with them.
          `pixelated` keeps the bar edges hard through that stretch rather
          than letting the browser interpolate them into grey ramps. */}
      {useQr ? (
        // `bare: true` — the id alone. The default QR encodes a whole
        // /scan?id= link, which at ~70 characters needs a version-5 symbol
        // whose modules land on 1.6 printer dots and decodes only by luck at
        // this size; the id alone fits a version-1/2 symbol that reads every
        // time. Square, so it takes its height from the bar slot.
        <img
          src={labelsApi.qrCodeUrl(code, { bare: true })}
          alt={`QR code for ${code}`}
          style={{
            width: `${barsEm}em`, height: `${barsEm}em`,
            display: "block", imageRendering: "pixelated",
          }}
        />
      ) : (
        <img
          src={labelsApi.barcodeUrl(code, { withText: false })}
          alt={`Barcode for ${code}`}
          style={{
            width: "100%", height: `${barsEm}em`,
            objectFit: "fill", display: "block", imageRendering: "pixelated",
          }}
        />
      )}
      <span
        style={{
          fontFamily: "var(--font-code, ui-monospace, monospace)", fontWeight: 700,
          fontSize: `${size}em`, letterSpacing: "0.02em", maxWidth: "100%", ...ellipsis,
        }}
      >
        {code}
      </span>
    </div>
  );
}

/** The tag body both variants share: the barcode and its code at the top,
 *  then up to three lines of context on the left against one large figure on
 *  the right — the selling price on an external piece, the received date on a
 *  weaver piece.
 *
 *  Neither variant prints the shop name any more — on a 50x25mm sticker that
 *  line cost more room than it earned, and these are read at the counter
 *  where the shop is not in doubt. The type gets the space instead, sized so
 *  the sticker is readable at arm's length rather than merely legible. */
function TagLayout({
  code, lines, feature,
}: {
  code: string;
  /** Rendered top to bottom in the left column; `mono` for codes and ciphers,
   *  `emphasis` to print one line larger than its neighbours. */
  lines: { text: string; mono?: boolean; emphasis?: boolean }[];
  /** The one big thing on the right, with an optional caption over it. */
  feature: { text: string; label?: string; em?: number };
}) {
  return (
    <TileFrame>
      {/* Short bars — the detail lines and the big figure below need the
          height. 7.4mm is about the floor: below ~6mm a phone has to be held
          square-on to the tag to get a clean scan line across the symbol. */}
      <div style={{ marginTop: "0.4em" }}>
        <TileCode code={code} barsEm={7.4} maxCodeEm={2.6} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "0.8em" }}>
        <div
          style={{
            minWidth: 0, display: "flex", flexDirection: "column", gap: "0.1em",
            fontFamily: "var(--font-ui, sans-serif)", fontSize: "2.3em",
          }}
        >
          {lines.map((line, i) => (
            <span
              // eslint-disable-next-line react/no-array-index-key -- fixed-order detail lines, never reordered
              key={i}
              style={{
                ...ellipsis,
                ...(line.mono ? { fontFamily: "var(--font-code, ui-monospace, monospace)", fontWeight: 700, letterSpacing: "0.04em" } : null),
                ...(line.emphasis ? { fontSize: "1.45em" } : null),
              }}
            >
              {line.text}
            </span>
          ))}
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {feature.label && (
            <span
              style={{
                fontFamily: "var(--font-ui, sans-serif)", fontSize: "1.7em",
                fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              }}
            >
              {feature.label}
            </span>
          )}
          {/* Inter with tabular figures rather than a display serif: on a
              203dpi thermal head a grotesque's even stroke weight survives
              the print better, and equal-width digits stop the figure from
              shifting between one tag and the next. */}
          <span
            style={{
              fontFamily: "var(--font-ui, sans-serif)", fontWeight: 700,
              fontSize: `${feature.em ?? 6.4}em`, lineHeight: 1,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
            }}
          >
            {feature.text}
          </span>
        </div>
      </div>
    </TileFrame>
  );
}

/** Own-factory / weaver piece tag — batch, saree type and weight on the left
 *  against the date the piece came in from the weaver or loom.
 *
 *  No price on this variant: these stickers go on at receipt, before the
 *  piece is priced for the counter. */
function TagCard({ r }: { r: SareeTagData }) {
  if (r.isExternal) return <ExternalTagCard r={r} />;

  const typeLabel = [r.sareeTypeCode || null, r.sareeTypeName || null].filter(Boolean).join(" · ");
  const weaverLine = [r.weaverName || null, r.loomNumber != null ? `Loom ${r.loomNumber}` : null].filter(Boolean).join(" · ");

  return (
    <TagLayout
      code={r.sareeId}
      lines={[
        { text: r.batchId || "—", mono: true },
        // Falls back to the weaver and loom when a piece carries no saree
        // type, so the line is never blank on a printed sticker.
        { text: typeLabel || weaverLine || "—" },
        { text: r.weight != null ? `${r.weight}g` : (r.color || "—") },
      ]}
      // DDMMYY, e.g. 20 Sep 2026 -> 200926 — the form the designers already
      // use on their own paperwork.
      // No caption over it: six digits in that corner are unambiguous on a
      // tag that carries no other number, and the room goes to the date.
      feature={{ text: ddmmyy(r.date) || "—", em: 6 }}
    />
  );
}

/** External-purchase piece tag — invoice · serial and the ciphered cost on the
 *  left, against the plain selling price. */
function ExternalTagCard({ r }: { r: SareeTagData }) {
  const typeLabel = r.sareeTypeCode
    ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}`
    : (r.sareeTypeName || "");
  const invoiceLine = [r.invoiceNumber || null, r.serial || null].filter(Boolean).join(" · ") || typeLabel || "—";

  return (
    <TagLayout
      code={r.sareeId}
      lines={[
        { text: invoiceLine },
        // Cost price is never printed as a plain number — encoded via the LORD
        // GANESH letter cipher (see costCipher.ts) so a customer can't read it
        // while staff who know the phrase can decode it back. Printed larger
        // than the invoice line: it is what staff actually read off the tag.
        { text: r.costPrice != null ? encodeCostCipher(r.costPrice) : "—", mono: true, emphasis: true },
      ]}
      feature={{ label: "Net Price", text: r.sellingPrice != null ? formatMoney(rupees(r.sellingPrice)) : "" }}
    />
  );
}

function TagSheet({ rows, stock }: { rows: SareeTagData[]; stock: LabelStock }) {
  return (
    <LabelSheet stock={stock}>
      {/* eslint-disable-next-line react/no-array-index-key -- extra copies of one saree id are intentionally identical */}
      {rows.map((r, i) => <TagCard key={`${r.sareeId}-${i}`} r={r} />)}
    </LabelSheet>
  );
}

/**
 * A single tag rendered exactly as it prints, for on-screen preview — same
 * tile, same stock, same barcode endpoint, magnified with `zoom` so the
 * superadmin's "Live Preview" is the real label rather than a hand-drawn
 * approximation that could drift from it.
 */
export function SareeTagPreview({ tag, stock, zoom = 3 }: { tag: SareeTagData; stock?: LabelStock; zoom?: number }) {
  return (
    <div style={{ ["--label-zoom" as string]: zoom, zoom, width: "fit-content" }}>
      <TagSheet rows={[tag]} stock={stock ?? DEFAULT_LABEL_STOCK} />
    </div>
  );
}

/**
 * Prints one physical tag per row — pass a single row or many.
 *
 * The sticker size comes from superadmin → Label Settings (50mm × 25mm by
 * default); `stockOverride` is for the one screen that offers its own Label
 * Size selector, so that selector actually changes what is printed rather
 * than being decoration.
 */
export function usePrintSareeTags() {
  const { print } = useDocument();
  const stock = useLabelStock();
  return React.useCallback((rows: SareeTagData[], stockOverride?: LabelStock) => {
    if (rows.length === 0) return;
    print(<TagSheet rows={rows} stock={stockOverride ?? stock} />);
  }, [print, stock]);
}
