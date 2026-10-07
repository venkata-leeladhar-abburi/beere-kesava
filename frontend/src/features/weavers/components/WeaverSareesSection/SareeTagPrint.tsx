import * as React from "react";
import {
  useDocument,
  LabelSheet,
  useLabelStock,
  useTileStock,
  monoFitEm,
  innerWidthEm,
  DEFAULT_LABEL_STOCK,
  type LabelStock,
} from "../../../../shared/ui/document";
import { ScannableCode } from "../../../../shared/ui/domain";
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

/** The shared frame: hairline border, tight padding, QR beside the text. */
function TileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: "0.25mm solid #000",
        borderRadius: "0.8em",
        padding: "1em 1.2em",
        display: "flex",
        alignItems: "center",
        gap: `${TAG_GAP_EM}em`,
        overflow: "hidden",
        lineHeight: 1.15,
      }}
    >
      {children}
    </div>
  );
}

const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

/** Gap between the QR and the text column, in label units. */
const TAG_GAP_EM = 1.2;
/** Tracking on the printed id — counted into its fit so the two can't disagree. */
const ID_LETTER_SPACING_EM = 0.02;
/** Advance of one bold tabular figure in the UI face, in em — slightly
 *  generous, so the big figure is sized to fit rather than to just overflow. */
const FIGURE_ADVANCE_EM = 0.66;

/**
 * QR edge length in label units for the stock in the printer.
 *
 * 20 of a 25-unit-tall sticker: on the 50x25mm roll that is a 20mm code, and
 * a saree id (capitals, digits and hyphens, up to 25 characters) is a
 * 21-module QR — 29 with its quiet zone — so each module prints ~0.69mm, or
 * 5.5 dots of a 203dpi thermal head. The Code128 this replaces printed
 * 0.22mm bars, 1.8 dots: readable only square-on, close up and unsmudged.
 * Capped at 42% of the width so a squarer roll (50x40) keeps a text column.
 */
export function tagQrEm(stock: LabelStock): number {
  return Math.min(20, innerWidthEm(stock) * 0.42);
}

/** Width of the text column beside the QR, in label units. */
export function tagColumnEm(stock: LabelStock): number {
  return innerWidthEm(stock) - tagQrEm(stock) - TAG_GAP_EM;
}

/**
 * How the id is set beside the QR: on one line when it stays readable there,
 * otherwise broken over two. Never ellipsised — the printed id is how a tag
 * is typed in by hand when it can't be scanned.
 */
export function tagIdFit(len: number, columnEm: number): { em: number; lines: 1 | 2 } {
  const oneLine = monoFitEm(len, columnEm, 2.6, 0, ID_LETTER_SPACING_EM);
  if (oneLine >= 1.7) return { em: oneLine, lines: 1 };
  // The slack keeps a break that lands one character late from spilling
  // onto a third line.
  return {
    em: monoFitEm(Math.ceil(len / 2) + 1, columnEm, 2.2, 1.1, ID_LETTER_SPACING_EM),
    lines: 2,
  };
}

/** The big figure's size: what was asked for, shrunk until it fits the column
 *  — a six-figure price must not run under the QR or off the sticker. */
export function tagFigureEm(text: string, columnEm: number, wanted: number): number {
  if (text.length === 0) return wanted;
  return Math.min(wanted, columnEm / (FIGURE_ADVANCE_EM * text.length));
}

/** The tag body both variants share: the QR on the left, and beside it the
 *  id, up to three lines of context, and one large figure — the selling price
 *  on an external piece, the received date on a weaver piece.
 *
 *  A QR rather than a Code128, on every saree tag. A barcode of a 16-character
 *  id needs ~211 modules across the sticker, which is the thinnest bar the
 *  printer can lay down at all; it scanned only when held square to the
 *  camera, and the scanner spent seconds straightening frames to find it. The
 *  QR's modules are three times the size, it reads at any angle, and it
 *  carries error correction — which is what makes the scan immediate.
 *
 *  Neither variant prints the shop name — on a 50x25mm sticker that line cost
 *  more room than it earned, and these are read at the counter where the shop
 *  is not in doubt. */
function TagLayout({
  code,
  lines,
  feature,
}: {
  code: string;
  /** Rendered top to bottom under the id; `mono` for codes and ciphers,
   *  `emphasis` to print one line larger than its neighbours. */
  lines: { text: string; mono?: boolean; emphasis?: boolean }[];
  /** The one big thing at the foot of the column, with an optional caption over it. */
  feature: { text: string; label?: string; em?: number };
}) {
  const stock = useTileStock();
  const qrEm = tagQrEm(stock);
  const columnEm = tagColumnEm(stock);
  const id = tagIdFit(code.length, columnEm);

  return (
    <TileFrame>
      {/* Square, so it takes its edge from the sticker height; the
          .bk-label-qr rule in print.css makes the SVG fill that box. The
          quiet zone is inside the SVG, so nothing here may crowd it. */}
      <div style={{ width: `${qrEm}em`, height: `${qrEm}em`, flexShrink: 0 }}>
        <ScannableCode value={code} className="bk-label-qr" />
      </div>

      <div
        style={{
          minWidth: 0,
          flex: 1,
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "0.1em" }}>
          <span
            style={{
              fontFamily: "var(--font-code, ui-monospace, monospace)",
              fontWeight: 700,
              fontSize: `${id.em}em`,
              letterSpacing: `${ID_LETTER_SPACING_EM}em`,
              ...(id.lines === 1
                ? { whiteSpace: "nowrap" }
                : { overflowWrap: "anywhere", wordBreak: "break-all", lineHeight: 1.1 }),
            }}
          >
            {code}
          </span>
          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.1em",
              fontFamily: "var(--font-ui, sans-serif)",
              fontSize: "2.3em",
            }}
          >
            {lines.map((line, i) => (
              <span
                // eslint-disable-next-line react/no-array-index-key -- fixed-order detail lines, never reordered
                key={i}
                style={{
                  ...ellipsis,
                  ...(line.mono
                    ? {
                        fontFamily: "var(--font-code, ui-monospace, monospace)",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }
                    : null),
                  ...(line.emphasis ? { fontSize: "1.45em" } : null),
                }}
              >
                {line.text}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {feature.label && (
            <span
              style={{
                fontFamily: "var(--font-ui, sans-serif)",
                fontSize: "1.7em",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
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
              fontFamily: "var(--font-ui, sans-serif)",
              fontWeight: 700,
              fontSize: `${tagFigureEm(feature.text, columnEm, feature.em ?? 6.4)}em`,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
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
  const weaverLine = [r.weaverName || null, r.loomNumber != null ? `Loom ${r.loomNumber}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <TagLayout
      code={r.sareeId}
      lines={[
        { text: r.batchId || "—", mono: true },
        // Falls back to the weaver and loom when a piece carries no saree
        // type, so the line is never blank on a printed sticker.
        { text: typeLabel || weaverLine || "—" },
        { text: r.weight != null ? `${r.weight}g` : r.color || "—" },
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
    : r.sareeTypeName || "";
  const invoiceLine =
    [r.invoiceNumber || null, r.serial || null].filter(Boolean).join(" · ") || typeLabel || "—";

  return (
    <TagLayout
      code={r.sareeId}
      lines={[
        { text: invoiceLine },
        // Cost price is never printed as a plain number — encoded via the LORD
        // GANESH letter cipher (see costCipher.ts) so a customer can't read it
        // while staff who know the phrase can decode it back. Printed larger
        // than the invoice line: it is what staff actually read off the tag.
        {
          text: r.costPrice != null ? encodeCostCipher(r.costPrice) : "—",
          mono: true,
          emphasis: true,
        },
      ]}
      feature={{
        label: "Net Price",
        text: r.sellingPrice != null ? formatMoney(rupees(r.sellingPrice)) : "",
      }}
    />
  );
}

/** The exact sheet "Print All Barcodes" sends to the printer — exported for
 * doc-preview's `?doc=tags-sheet&print`, so page count can be checked. */
export function SareeTagSheet({ rows, stock }: { rows: SareeTagData[]; stock?: LabelStock }) {
  return <TagSheet rows={rows} stock={stock ?? DEFAULT_LABEL_STOCK} />;
}

function TagSheet({ rows, stock }: { rows: SareeTagData[]; stock: LabelStock }) {
  return (
    <LabelSheet stock={stock}>
      {rows.map((r, i) => (
        // eslint-disable-next-line react/no-array-index-key -- extra copies of one saree id are intentionally identical
        <TagCard key={`${r.sareeId}-${i}`} r={r} />
      ))}
    </LabelSheet>
  );
}

/**
 * A single tag rendered exactly as it prints, for on-screen preview — same
 * tile, same stock, same QR, magnified with `zoom` so the
 * superadmin's "Live Preview" is the real label rather than a hand-drawn
 * approximation that could drift from it.
 */
export function SareeTagPreview({
  tag,
  stock,
  zoom = 3,
}: {
  tag: SareeTagData;
  stock?: LabelStock;
  zoom?: number;
}) {
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
  return React.useCallback(
    (rows: SareeTagData[], stockOverride?: LabelStock) => {
      if (rows.length === 0) return;
      print(<TagSheet rows={rows} stock={stockOverride ?? stock} />);
    },
    [print, stock]
  );
}
