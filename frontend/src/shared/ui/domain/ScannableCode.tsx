/**
 * <ScannableCode> — a genuinely scannable QR rendered as inline SVG.
 * ═══════════════════════════════════════════════════════════════════════════
 * Printed GRN labels previously drew the literal string "||| | || ||| ||" as
 * their barcode: decorative stripes that encode nothing. The Issue Material
 * scanner (CameraScannerModal → BrowserMultiFormatReader) reads real codes and
 * matches them against GrnItem.itemCode, so the scan-a-label workflow could
 * never actually have worked — every printed tag was undecodable.
 *
 * QR rather than Code 128 because @zxing/library ships 2D encoders only
 * (QRCodeWriter, DataMatrixWriter, AztecCodeWriter) and no 1D writer, and
 * BrowserMultiFormatReader already decodes QR. QR also survives the smudging
 * and partial cover a tag on a yarn drum tends to pick up, thanks to error
 * correction — a 1D barcode does not.
 *
 * Rendered as SVG so it stays sharp at any print DPI; a canvas bitmap would
 * print at screen resolution and risk failing the scan it exists for.
 */
import * as React from "react";
import {
  BarcodeFormat, EncodeHintType, QRCodeDecoderErrorCorrectionLevel, QRCodeWriter,
} from "@zxing/library";

export interface ScannableCodeProps {
  /** The exact text a scanner should read back, e.g. "GRN-RajaSilks-003-002-1". */
  value: string;
  /** Rendered edge length in px. The SVG scales, so this is a layout hint. */
  size?: number;
  className?: string;
}

/** The spec's quiet zone, in modules. Without it a reader can't isolate the
 *  finder patterns from whatever the label prints alongside the code. */
export const QR_QUIET_ZONE = 4;

/** QR modules as an SVG path, or null if `value` can't be encoded. Exported so
 *  the scan round-trip can be tested against the exact encoding that prints. */
export function encodeToPath(value: string): { path: string; modules: number } | null {
  try {
    const hints = new Map<EncodeHintType, unknown>([
      [EncodeHintType.MARGIN, 0],
      // Level L, deliberately, and not a higher one. @zxing/browser's reader
      // — the very reader that scans these tags — intermittently fails to
      // *detect* codes this writer produces at M/Q/H: the resulting mask
      // pattern defeats its finder-pattern search even on a clean, perfectly
      // rendered image. L round-trips every code shape in use (see
      // ScannableCode.test.ts, which enforces this). The cost is less
      // tolerance of a scuffed tag; a tag the scanner cannot find at all is
      // strictly worse than one that needs wiping first.
      //
      // Pass the enum, never the string "M" — a string is accepted, encodes
      // without error, and yields a matrix whose format bits disagree with
      // its data, so it decodes to a checksum error. That was the first
      // version of this file.
      [EncodeHintType.ERROR_CORRECTION, QRCodeDecoderErrorCorrectionLevel.L],
    ]);
    // Width/height of 0 asks the writer for the natural module grid rather
    // than a scaled bitmap, so the SVG can carry the scaling instead. The
    // quiet zone is added to the viewBox below rather than baked in here, so
    // it scales with the code instead of being a fixed pixel count.
    const matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 0, 0, hints);
    const modules = matrix.getWidth();

    let path = "";
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        if (matrix.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
      }
    }
    return path ? { path, modules } : null;
  } catch {
    return null;
  }
}

export function ScannableCode({ value, size = 96, className }: ScannableCodeProps) {
  const encoded = React.useMemo(() => encodeToPath(value), [value]);

  // Never render decorative stripes as a stand-in — a tag that looks
  // scannable but isn't is worse than one that plainly says it can't be.
  if (!encoded) {
    return (
      <div
        className={className}
        role="img"
        aria-label={`Barcode unavailable for ${value}`}
        style={{
          width: size, height: size, display: "flex", alignItems: "center",
          justifyContent: "center", textAlign: "center", padding: 4,
          border: "1px dashed var(--border-default, #999)", borderRadius: 4,
          fontFamily: "var(--font-ui)", fontSize: 9, lineHeight: 1.3,
          color: "var(--text-tertiary, #666)",
        }}
      >
        Code unavailable
      </div>
    );
  }

  const quiet = QR_QUIET_ZONE;
  const extent = encoded.modules + quiet * 2;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${extent} ${extent}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Scannable code for ${value}`}
    >
      {/* Explicit white ground: a printed QR needs real quiet-zone contrast,
          and a transparent SVG would inherit whatever sits behind it. */}
      <rect width={extent} height={extent} fill="#FFFFFF" />
      <path d={encoded.path} fill="#000000" transform={`translate(${quiet} ${quiet})`} />
    </svg>
  );
}
