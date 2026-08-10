/**
 * Client-side port of scripts/check-contrast.mjs's parsing + WCAG maths.
 * ═══════════════════════════════════════════════════════════════════════════
 * The Node script is the CI gate; this module runs the *same* algorithm in
 * the browser so the Foundations → Colour gallery page can recompute every
 * ratio live from the actual `tokens.css` source (imported as raw text via
 * Vite's `?raw` loader) instead of trusting the hand-written comments next
 * to each token. If a colour regresses, this page shows it immediately —
 * no build step required. Keep this in sync with scripts/check-contrast.mjs
 * if that file's algorithm ever changes.
 */

// Vite's `?raw` import gives us the literal file contents as a string.
import tokensCssRaw from "../../../styles/tokens.css?raw";

/** Parse `--name: value;` declarations, resolving var() chains. First
 * occurrence of a given name wins (mirrors the Node script — this means the
 * `:root` block's value is used even though `.dark` redefines some names
 * later in the file). */
function parseTokens(css: string): Map<string, string> {
  const raw = new Map<string, string>();
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const [, name, value] = m;
    if (!raw.has(name)) raw.set(name, value.trim());
  }

  const resolved = new Map<string, string>();
  function resolve(name: string, seen: Set<string> = new Set()): string | undefined {
    if (resolved.has(name)) return resolved.get(name);
    if (seen.has(name)) throw new Error(`Circular var() reference: ${name}`);
    seen.add(name);
    let value = raw.get(name);
    if (value === undefined) return undefined;
    value = value.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, ref: string) => {
      const r = resolve(ref, seen);
      return r ?? "";
    });
    resolved.set(name, value);
    return value;
  }
  for (const name of raw.keys()) resolve(name);
  return resolved;
}

export const TOKENS: Map<string, string> = parseTokens(tokensCssRaw);

/** Look up a resolved token value; throws (loudly, in dev) if missing —
 * mirrors the Node script's `tv()` so a renamed/removed token is obvious. */
export function tv(name: string): string {
  const v = TOKENS.get(name);
  if (!v) throw new Error(`Token not found: ${name}`);
  return v;
}

/** All resolved custom-property names matching a prefix, e.g. "--bk-burgundy-". */
export function tokensWithPrefix(prefix: string): string[] {
  return [...TOKENS.keys()].filter((k) => k.startsWith(prefix));
}

// ── WCAG 2.1 relative luminance + contrast ratio (identical maths to the
//    Node script) ────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}
