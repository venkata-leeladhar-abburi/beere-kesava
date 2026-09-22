import { labelsApi } from "../../api/labels";
import { ScannableCode } from "../domain/ScannableCode";
import { useTileStock, monoFitEm, innerWidthEm, type LabelStock } from "./LabelSheet";

/**
 * Narrow modules a Code128 symbol needs for `code`, as an upper bound: 11 per
 * character, plus the start and check characters (11 each) and the stop
 * pattern (13). Subset C pairs long digit runs into one character, so a code
 * with many digits comes out narrower than this — erring that way is the safe
 * direction, since the number only decides whether the label falls back to a
 * QR.
 */
export function code128Modules(code: string): number {
  return 11 * (code.length + 2) + 13;
}

/**
 * The narrowest bar worth printing, in mm.
 *
 * A 203dpi thermal head lays down 0.125mm dots, so 0.21mm is about 1.7 dots
 * per module. Measured against a simulated print of the real generator output
 * — bwip-js's PNG stretched to the real tile geometry, hard-thresholded to
 * thermal dots, then decoded with the same ZXing the scanner uses: at 1.8
 * dots a 14-character id decodes, at 1.5 it does not.
 */
export const MIN_MODULE_MM = 0.21;

/** Tracking on the printed id. Counted into the fit above, so the two can't
 *  disagree and silently truncate the code. */
const CODE_LETTER_SPACING_EM = 0.02;

/** A tile's usable inner width in mm — the stock width less the 1.2em padding
 *  a label tile applies on each side (1em is a 25th of the label height). */
export function innerWidthMm(stock: LabelStock): number {
  return innerWidthEm(stock) * (stock.heightMm / 25);
}

/**
 * Whether `code` has to be printed as a QR instead of a Code128 to survive
 * the printer, on the given stock.
 *
 * Exported so an on-screen preview of a label can show the same medium the
 * printer will actually emit, instead of drawing bars beside a tag that comes
 * out carrying a QR.
 */
export function needsQrFallback(code: string, stock: LabelStock): boolean {
  return innerWidthMm(stock) / code128Modules(code) < MIN_MODULE_MM;
}

/**
 * The scannable code on a printed label, with the human-readable id beneath
 * it — the two things a label exists for. Shared by the saree tags and the
 * GRN material-batch labels so a change to either cannot quietly diverge.
 *
 * The generator's own baked-in caption is suppressed (`withText: false`): the
 * id is printed below at a readable size, and on a 25mm-tall sticker printing
 * it twice only costs the bars their height.
 */
export function TileCode({
  code,
  barsEm = 9.4,
  maxCodeEm = 2.5,
}: {
  code: string;
  barsEm?: number;
  maxCodeEm?: number;
}) {
  const stock = useTileStock();
  // Shrink to fit rather than ellipsise — a half-printed id can't be typed
  // back in when a scan fails, and the code's own caption is switched off.
  // The 0.02em matches the `letterSpacing` the code text is rendered with
  // below — without it a long id is sized to overflow and gets ellipsised,
  // which is the one thing this line must never do.
  const size = monoFitEm(code.length, innerWidthEm(stock), maxCodeEm, 1.5, CODE_LETTER_SPACING_EM);

  // A long id — a GRN item code carrying a full vendor name
  // (GRN-SreeLakshmiSilkHouse-001-003-12), or an external-purchase code
  // carrying a long free-text invoice number — simply does not fit a
  // scannable Code128 on a 50mm sticker: 420 modules across 47mm is 0.9
  // printer dots each, and it prints as an unreadable smear however the bars
  // are laid out. A QR of the same id is square, so it spends its resolution
  // in two dimensions instead of one and still decodes at this size. The
  // scanner reads both (CameraScannerModal hints Code128 AND QR), so a label
  // simply carries whichever one can survive the printer.
  const useQr = needsQrFallback(code, stock);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {useQr ? (
        // <ScannableCode>, not the /labels/qrcode PNG, for two reasons. It
        // draws SVG, so the modules land on the printer's own grid instead
        // of being resampled from a raster; and it encodes at error
        // correction level L, which the app's own reader was found to detect
        // far more reliably than the M/Q/H codes it intermittently cannot
        // even *find* (see ScannableCode.tsx). It encodes the id alone —
        // the /scan?id= link form runs to ~70 characters, needs a version-5
        // symbol, and at this size decodes only by luck.
        //
        // Square, so it takes its edge length from the bar slot; the .bk-label-qr
        // rule in print.css makes the SVG fill that box.
        <div style={{ width: `${barsEm}em`, height: `${barsEm}em`, flexShrink: 0 }}>
          <ScannableCode value={code} className="bk-label-qr" />
        </div>
      ) : (
        // `fill`, deliberately, not `contain`.
        // A 14-character Code128 is ~189 narrow modules wide but only ~4.7x
        // as wide as it is tall, while the slot it sits in is ~6.8x as wide
        // as it is tall. `contain` therefore fitted the image by HEIGHT and
        // left the bars occupying barely 30mm of a 50mm sticker — a 0.165mm
        // module, or 1.3 dots on a 203dpi thermal head, which prints as a
        // smear no camera can decode. `fill` spends the whole sticker width
        // on the bars instead and squashes only the bar HEIGHT, which a 1D
        // symbology does not encode anything in. The quiet zone is baked into
        // the PNG (labels.service.ts) so it stretches along with them.
        // `pixelated` keeps the bar edges hard through that stretch rather
        // than letting the browser interpolate them into grey ramps.
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
          fontSize: `${size}em`, letterSpacing: `${CODE_LETTER_SPACING_EM}em`, maxWidth: "100%",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
      >
        {code}
      </span>
    </div>
  );
}
