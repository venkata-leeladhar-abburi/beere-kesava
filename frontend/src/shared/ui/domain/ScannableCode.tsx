/**
 * <ScannableCode> — a genuinely scannable QR rendered as inline SVG.
 * ═══════════════════════════════════════════════════════════════════════════
 * Printed GRN labels previously drew the literal string "||| | || ||| ||" as
 * their barcode: decorative stripes that encode nothing. The Issue Material
 * scanner (CameraScannerModal → BrowserMultiFormatReader) reads real codes and
 * matches them against GrnItem.itemCode, so the scan-a-label workflow could
 * never actually have worked — every printed tag was undecodable.
 *
 * QR rather than Code 128: its modules print several times the size of a
 * barcode's bars on the same sticker, it reads at any angle, and it survives
 * the smudging and partial cover a tag tends to pick up, thanks to error
 * correction — a 1D barcode does none of that. Every saree tag and GRN label
 * carries one.
 *
 * Rendered as SVG so it stays sharp at any print DPI; a canvas bitmap would
 * print at screen resolution and risk failing the scan it exists for.
 */
import * as React from "react";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  EncodeHintType,
  HybridBinarizer,
  QRCodeDecoderErrorCorrectionLevel,
  QRCodeReader,
  QRCodeWriter,
  RGBLuminanceSource,
  type BitMatrix,
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

/**
 * Error-correction levels to try, in order of preference.
 *
 * ZXing's JS reader — what the scanner falls back to on an iPhone or a
 * Windows desktop, where the browser has no barcode detector of its own —
 * cannot *find* some perfectly valid QR codes: a run of data modules that
 * happens to resemble a finder pattern derails its search, at most camera
 * distances, even on a clean image. Which codes is down to the exact module
 * pattern, so it is specific to the text encoded: measured over ~800 real
 * tag ids, 1 in 60 was hard or impossible to scan at level L. The same text
 * at another level is a different pattern and almost always reads cleanly,
 * so each level is rendered and read back (see readsBack) and the first that
 * reads at every size wins.
 *
 * L first: it gives the smallest symbol and so the largest printed modules.
 *
 * Always the enum, never the string "M" — a string is accepted, encodes
 * without error, and yields a matrix whose format bits disagree with its
 * data, so it decodes to a checksum error.
 */
const LEVELS = [
  QRCodeDecoderErrorCorrectionLevel.L,
  QRCodeDecoderErrorCorrectionLevel.M,
  QRCodeDecoderErrorCorrectionLevel.Q,
  QRCodeDecoderErrorCorrectionLevel.H,
];

/**
 * Camera pixels per module each candidate is read back at — a tag held far
 * from the camera through to one filling the frame. Fractional on purpose:
 * the reader's misses come and go with how modules land on the pixel grid,
 * and whole-number sizes hide them. This set was picked by measurement: it
 * cut the unreadable (id, size) pairs over the same ~800 ids by 93%.
 */
const READ_SCALES = [3.5, 4.5, 5.75, 6.25, 8.5, 11.5, 15.5];

const READ_HINTS = new Map<DecodeHintType, unknown>([[DecodeHintType.TRY_HARDER, true]]);

function matrixFor(value: string, level: QRCodeDecoderErrorCorrectionLevel): BitMatrix | null {
  try {
    const hints = new Map<EncodeHintType, unknown>([
      [EncodeHintType.MARGIN, 0],
      [EncodeHintType.ERROR_CORRECTION, level],
    ]);
    // Width/height of 0 asks the writer for the natural module grid rather
    // than a scaled bitmap, so the SVG can carry the scaling instead. The
    // quiet zone is added to the viewBox rather than baked in here, so it
    // scales with the code instead of being a fixed pixel count.
    return new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 0, 0, hints);
  } catch {
    return null;
  }
}

/** Whether the scanner's own reader gets `value` back from `matrix` drawn,
 *  quiet zone included, at `pxPerModule`. */
function readsBack(matrix: BitMatrix, value: string, pxPerModule: number): boolean {
  const modules = matrix.getWidth();
  const extent = modules + QR_QUIET_ZONE * 2;
  const size = Math.round(extent * pxPerModule);
  const luma = new Uint8ClampedArray(size * size).fill(255);
  for (let y = 0; y < size; y++) {
    const my = Math.floor(((y + 0.5) / size) * extent) - QR_QUIET_ZONE;
    if (my < 0 || my >= modules) continue;
    for (let x = 0; x < size; x++) {
      const mx = Math.floor(((x + 0.5) / size) * extent) - QR_QUIET_ZONE;
      if (mx >= 0 && mx < modules && matrix.get(mx, my)) luma[y * size + x] = 0;
    }
  }
  try {
    const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luma, size, size)));
    return new QRCodeReader().decode(bitmap, READ_HINTS).getText() === value;
  } catch {
    return false;
  }
}

/** The matrix for `value` the scanner reads most reliably, or null if the
 *  text can't be encoded at all. */
function bestMatrix(value: string): BitMatrix | null {
  let best: BitMatrix | null = null;
  let bestMisses = Infinity;
  for (const level of LEVELS) {
    const matrix = matrixFor(value, level);
    if (!matrix) continue;
    let misses = 0;
    for (const scale of READ_SCALES) {
      if (!readsBack(matrix, value, scale)) misses++;
      if (misses >= bestMisses) break; // already no better than what we have
    }
    if (misses < bestMisses) {
      best = matrix;
      bestMisses = misses;
    }
    if (misses === 0) break;
  }
  return best;
}

type Encoded = { path: string; modules: number };

// Choosing a level costs a few milliseconds per code, and a tag sheet draws
// hundreds — each of them again for the preview, the print and any re-render.
const encodedCache = new Map<string, Encoded | null>();
const ENCODED_CACHE_MAX = 5000;

/** QR modules as an SVG path, or null if `value` can't be encoded. Exported so
 *  the scan round-trip can be tested against the exact encoding that prints. */
export function encodeToPath(value: string): Encoded | null {
  const cached = encodedCache.get(value);
  if (cached !== undefined) return cached;

  let encoded: Encoded | null = null;
  const matrix = bestMatrix(value);
  if (matrix) {
    const modules = matrix.getWidth();
    let path = "";
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        if (matrix.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
      }
    }
    if (path) encoded = { path, modules };
  }

  if (encodedCache.size >= ENCODED_CACHE_MAX) encodedCache.clear();
  encodedCache.set(value, encoded);
  return encoded;
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
        // useDocument refuses to print a sheet carrying one of these.
        data-code-unavailable=""
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 4,
          border: "1px dashed var(--border-default, #999)",
          borderRadius: 4,
          fontFamily: "var(--font-ui)",
          fontSize: 9,
          lineHeight: 1.3,
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
