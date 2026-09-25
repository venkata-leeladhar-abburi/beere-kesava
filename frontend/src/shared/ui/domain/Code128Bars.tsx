/**
 * Code128Bars — a Code128 barcode drawn in the browser as SVG.
 *
 * Printed tags used to load each barcode as a PNG from GET /labels/barcode,
 * one request per tag. A sheet of 200+ tags (one external purchase) fired
 * 200+ requests at once: the API's rate limit (100 per minute) refused
 * roughly half of them, and the print dialog opened after a 3-second wait
 * whether the rest had arrived or not — so the sheet came out with bars on
 * some tags and a blank space on the others. Drawing the bars here makes no
 * request at all, so there is nothing to refuse and nothing to wait for.
 *
 * The symbol is identical to the one the server drew: the same bwip-js, the
 * same options (labels.service.ts generateBarcodePng). `paddingwidth: 10`
 * bakes Code128's quiet zone into the drawing, and `preserveAspectRatio=
 * "none"` stretches it to fill its box exactly as the PNG's `objectFit: fill`
 * did — width across the sticker for the bars, only height squashed, which a
 * 1D symbology encodes nothing in.
 *
 * bwip-js returns an SVG string; its paths are read back out and drawn as
 * React elements rather than injected as markup.
 */
import * as React from "react";
import { code128, drawingSVG } from "bwip-js/browser";

export interface Code128Drawing {
  viewBox: string;
  paths: { d: string; stroke?: string; strokeWidth?: string; fill?: string }[];
}

const ATTR = /([a-z-]+)="([^"]*)"/g;

/** The bars for `value`, or null if Code128 can't encode it (e.g. non-ASCII). */
export function encodeCode128(value: string): Code128Drawing | null {
  // bwip-js does not reject text outside Code128's range: it draws bars for
  // it anyway, and they scan back as something other than `value` — a tag
  // that silently names the wrong saree. Printable ASCII only; anything else
  // goes to the QR fallback, which carries any text.
  if (!value || !/^[\x20-\x7E]+$/.test(value)) return null;
  let svg: string;
  try {
    svg = code128(
      { bcid: "code128", text: value, scale: 6, height: 8, paddingwidth: 10, includetext: false },
      drawingSVG(),
    );
  } catch {
    return null;
  }
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  if (!viewBox) return null;

  const paths: Code128Drawing["paths"] = [];
  for (const [, attrs] of svg.matchAll(/<path\s([^>]*?)\/?>/g)) {
    const a = Object.fromEntries([...attrs.matchAll(ATTR)].map(m => [m[1], m[2]]));
    if (!a.d) continue;
    paths.push({ d: a.d, stroke: a.stroke, strokeWidth: a["stroke-width"], fill: a.fill });
  }
  return paths.length ? { viewBox, paths } : null;
}

export interface Code128BarsProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  /** Drawn instead when `value` can't be encoded as Code128. */
  fallback?: React.ReactNode;
}

export function Code128Bars({ value, className, style, fallback = null }: Code128BarsProps) {
  const drawing = React.useMemo(() => encodeCode128(value), [value]);
  if (!drawing) return <>{fallback}</>;

  return (
    <svg
      className={className}
      style={{ display: "block", ...style }}
      viewBox={drawing.viewBox}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Barcode for ${value}`}
    >
      {/* Explicit white ground: the quiet zone needs real contrast on paper,
          and a transparent SVG would inherit whatever sits behind it. */}
      <rect width="100%" height="100%" fill="#FFFFFF" />
      {drawing.paths.map(p => (
        <path key={p.d} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill} />
      ))}
    </svg>
  );
}
